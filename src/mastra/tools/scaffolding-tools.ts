import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';

// Helper function to ensure a directory exists
async function ensureDir(dirPath: string) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') throw error;
    }
}

// Code generation helpers
function generateToolCode(tool: any) {
    const outputSchemaLine = tool.outputSchema ? `outputSchema: ${tool.outputSchema},` : '';
    return `
export const ${tool.name} = createTool({
    id: "${tool.name}",
    description: "${tool.description}",
    inputSchema: ${tool.inputSchema},
    ${outputSchemaLine}
    execute: async ({ context }) => {
        console.log("Executing tool: ${tool.name} with context:", context);
        ${tool.code}
    },
});
`;
}

function generateAgentCode(agent: any) {
    const toolImports = agent.tools.length > 0 ? `import { ${agent.tools.join(', ')} } from '../tools';` : '';
    const toolsObject = agent.tools.length > 0 ? `{ ${agent.tools.map((t: string) => t).join(', ')} }` : '{}';
    return `
import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
${toolImports}

export const ${agent.name} = new Agent({
    name: "${agent.name}",
    description: "${agent.description || ''}",
    instructions: \`${agent.instructions}\`,
    model: ${agent.model},
    tools: ${toolsObject},
});
`;
}

const FinalAgentConfigSchema = z.object({
  projectName: z.string(),
  description: z.string(),
  dependencies: z.record(z.string()),
  entryPoint: z.object({
    type: z.enum(['agent', 'workflow']),
    name: z.string(),
  }),
  agents: z.array(z.any()),
  tools: z.array(z.any()),
  workflows: z.array(z.any()).optional(),
});


export const scaffoldProjectTool = createTool({
  id: 'scaffold-project',
  description: 'Scaffolds a new Mastra project from the configuration.',
  inputSchema: z.object({
    config: FinalAgentConfigSchema,
    outputPath: z.string().optional().describe('Defaults to ./generated-agents/'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    projectPath: z.string(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { config, outputPath = './generated-agents/' } = context;
    const { projectName, description, dependencies, agents, tools, workflows } = config;

    try {
      const projectDir = join(process.cwd(), outputPath, projectName);
      const srcDir = join(projectDir, 'src', 'mastra');
      await ensureDir(join(srcDir, 'agents'));
      await ensureDir(join(srcDir, 'tools'));
      await ensureDir(join(srcDir, 'workflows'));

      const packageJson = {
          name: projectName,
          version: "0.1.0",
          description,
          scripts: { "dev": "mastra dev", "test": "tsx src/test.ts" },
          dependencies: { ...dependencies },
          devDependencies: { "typescript": "^5.0.0", "@types/node": "latest", "tsx": "latest", "dotenv": "latest" }
      };
      await fs.writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const tsconfigJson = {
          "compilerOptions": { "target": "ES2022", "module": "ES2022", "moduleResolution": "bundler", "esModuleInterop": true, "strict": true, "skipLibCheck": true, "noEmit": true },
          "include": ["src/**/*"]
      };
      await fs.writeFile(join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfigJson, null, 2));
      await fs.writeFile(join(projectDir, '.env'), 'OPENAI_API_KEY=your_api_key_here');

      const allToolCode = tools.map(generateToolCode).join('');
      const toolsFileContent = `import { createTool } from "@mastra/core/tools";\nimport { z } from "zod";\n${allToolCode}`;
      await fs.writeFile(join(srcDir, 'tools', 'index.ts'), toolsFileContent);

      const allAgentCode = agents.map(agent => generateAgentCode(agent)).join('');
      await fs.writeFile(join(srcDir, 'agents', 'index.ts'), allAgentCode);

      if (workflows && workflows.length > 0) {
        await fs.writeFile(join(srcDir, 'workflows', 'index.ts'), '// Workflows scaffolded here');
      } else {
        await fs.writeFile(join(srcDir, 'workflows', 'index.ts'), '// No workflows defined.');
      }

      const agentImports = agents.length > 0 ? `import { ${agents.map(a => a.name).join(', ')} } from './agents';` : '';
      const mainIndexContent = `import { Mastra } from "@mastra/core";\n${agentImports}\n\nexport const mastra = new Mastra({ agents: { ${agents.map(a => a.name).join(', ')} } });`;
      await fs.writeFile(join(srcDir, 'index.ts'), mainIndexContent);

      return {
        success: true,
        projectPath: projectDir,
        message: `Project '${projectName}' scaffolded successfully!`,
      };

    } catch (error: any) {
      return {
        success: false,
        projectPath: outputPath,
        message: `Scaffolding failed: ${error.message}`,
      };
    }
  },
});

export const checkScaffoldingStatusTool = createTool({
    id: 'check-scaffolding-status',
    description: 'Checks if a scaffolded project exists.',
    inputSchema: z.object({ projectName: z.string(), outputPath: z.string().optional() }),
    outputSchema: z.object({ exists: z.boolean(), path: z.string() }),
    execute: async ({ context }) => {
        const { projectName, outputPath = './generated-agents/' } = context;
        const projectPath = join(process.cwd(), outputPath, projectName);
        try {
            await fs.stat(projectPath);
            return { exists: true, path: projectPath };
        } catch {
            return { exists: false, path: projectPath };
        }
    },
});