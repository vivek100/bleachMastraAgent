import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';

// Match the schema from config-tools.ts exactly
const WorkflowStepSchema = z.object({
  id: z.string(),
  type: z.string(),
  config: z.record(z.any()).optional(),
});

const FinalAgentConfigSchema = z.object({
  projectName: z.string(),
  description: z.string(),
  dependencies: z.record(z.string()),
  entryPoint: z.object({
    type: z.enum(['agent', 'workflow']),
    name: z.string(),
  }),
  agents: z.array(z.object({
    name: z.string(),
    instructions: z.string(),
    model: z.string(),
    tools: z.array(z.string()),
    description: z.string().optional(),
  })),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.string(),
    outputSchema: z.string().optional(),
    code: z.string(),
  })),
  workflows: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.string(),
    outputSchema: z.string(),
    steps: z.array(WorkflowStepSchema),
  })).optional(),
});

// Helper function to ensure a directory exists
async function ensureDir(dirPath: string) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') throw error;
    }
}

// =================================================================
// CODE GENERATION HELPERS (Ported from scaffolder.js)
// =================================================================

function generateToolCode(tool: any) {
    const outputSchemaLine = tool.outputSchema ? `outputSchema: ${tool.outputSchema},` : '';
    const dependenciesLine = tool.dependencies ? `dependencies: ${JSON.stringify(tool.dependencies)},` : '';
    return `
export const ${tool.name} = createTool({
    id: "${tool.name}",
    description: "${tool.description}",
    inputSchema: ${tool.inputSchema},
    ${outputSchemaLine}
    ${dependenciesLine}
    execute: async ({ context }) => {
        // Mock implementation. Replace with your actual logic.
        console.log("Executing tool: ${tool.name} with context:", context);
        ${tool.code}
    },
});
`;
}

function generateAgentCode(agent: any) {
    const toolImports = agent.tools.length > 0 ? `import { ${agent.tools.join(', ')} } from '../tools';` : '';
    const toolsObject = agent.tools.length > 0 ? `{ ${agent.tools.join(', ')} }` : '{}';

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

// A simple placeholder, as full workflow generation is complex
function generateWorkflowCode(workflow: any) {
    return `
import { createWorkflow } from "@mastra/core/workflows";
import * as z from "zod";

// NOTE: This is a basic scaffold. You will need to implement the workflow logic.
export const ${workflow.name} = createWorkflow({
    id: "${workflow.name}",
    description: "${workflow.description}",
    inputSchema: ${workflow.inputSchema},
    outputSchema: ${workflow.outputSchema},
})
    .addStep({
        id: 'initial-step',
        type: 'your-step-type', // e.g., 'agent' or 'tool'
        // ... add your step configuration
    })
    .commit();
`;
}

// Tool to trigger the scaffolding process
export const scaffoldProjectTool = createTool({
  id: 'scaffold-project',
  description: 'Scaffolds a new Mastra project from the configuration using the existing scaffolder',
  inputSchema: z.object({
    config: FinalAgentConfigSchema.describe('The final validated configuration'),
    outputPath: z.string().optional().describe('Optional output path, defaults to ./generated-agents/'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    projectPath: z.string(),
    message: z.string(),
    logs: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { config, outputPath = './generated-agents/' } = context;
    const { projectName, description, dependencies, agents, tools, workflows } = config;
    const logs: string[] = [];

    try {
      // 1. Create project structure
      const projectDir = join(process.cwd(), outputPath, projectName);
      const srcDir = join(projectDir, 'src', 'mastra');
      logs.push(`Creating project at: ${projectDir}`);

      await ensureDir(join(srcDir, 'agents'));
      await ensureDir(join(srcDir, 'tools'));
      await ensureDir(join(srcDir, 'workflows'));

      // 2. Generate package.json
      const packageJson = {
          name: projectName,
          version: "0.1.0",
          description,
          main: "src/mastra/index.ts",
          scripts: {
              "dev": "mastra dev",
              "build": "mastra build",
              "test": "tsx src/test.ts"
          },
          dependencies: {
              ...dependencies,
              "tsx": "latest",
              "zod": "latest",
              "@mastra/core": "latest"
          },
          devDependencies: {
              "typescript": "^5.0.0",
              "@types/node": "latest",
              "dotenv": "latest"
          }
      };
      await fs.writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
      logs.push("✓ Generated package.json");

      // 3. Generate tsconfig.json and .env
      const tsconfigJson = {
          "compilerOptions": {
              "target": "ES2022",
              "module": "ES2022",
              "moduleResolution": "bundler",
              "esModuleInterop": true,
              "strict": true,
              "skipLibCheck": true,
              "noEmit": true,
          },
          "include": ["src/**/*"]
      };
      await fs.writeFile(join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfigJson, null, 2));
      logs.push("✓ Generated tsconfig.json");
      await fs.writeFile(join(projectDir, '.env'), 'OPENAI_API_KEY=your_api_key_here');
      logs.push("✓ Generated .env file");

      // 4. Generate code files for tools
      const allToolCode = tools.map(generateToolCode).join('');
      const toolsFileContent = `import { createTool } from "@mastra/core/tools";\nimport * as z from "zod";\n${allToolCode}`;
      await fs.writeFile(join(srcDir, 'tools', 'index.ts'), toolsFileContent);
      logs.push("✓ Generated tools/index.ts");

      // 5. Generate code files for agents
      const allAgentCode = agents.map(agent => generateAgentCode(agent)).join('');
      await fs.writeFile(join(srcDir, 'agents', 'index.ts'), allAgentCode);
      logs.push("✓ Generated agents/index.ts");
      
      // 6. Generate code files for workflows
      if (workflows && workflows.length > 0) {
          const allWorkflowCode = workflows.map(wf => generateWorkflowCode(wf)).join('');
          await fs.writeFile(join(srcDir, 'workflows', 'index.ts'), allWorkflowCode);
          logs.push("✓ Generated workflows/index.ts");
      } else {
          await fs.writeFile(join(srcDir, 'workflows', 'index.ts'), '// No workflows defined.');
          logs.push("✓ Generated empty workflows/index.ts");
      }

      // 7. Generate main index.ts
      const agentImports = agents.length > 0 ? `import { ${agents.map(a => a.name).join(', ')} } from './agents';` : '';
      const toolImports = tools.length > 0 ? `import { ${tools.map(t => t.name).join(', ')} } from './tools';` : '';
      const workflowImports = workflows && workflows.length > 0 ? `import { ${workflows.map(w => w.name).join(', ')} } from './workflows';` : '';

      const agentsRegistration = agents.length > 0 ? `agents: { ${agents.map(a => a.name).join(', ')} },` : '';
      const toolsRegistration = tools.length > 0 ? `tools: { ${tools.map(t => t.name).join(', ')} },` : '';
      const workflowsRegistration = workflows && workflows.length > 0 ? `workflows: { ${workflows.map(w => w.name).join(', ')} },` : '';

      const indexFileContent = `
import { Mastra } from "@mastra/core";
${agentImports}
${toolImports}
${workflowImports}

export const mastra = new Mastra({
    ${agentsRegistration}
    ${toolsRegistration}
    ${workflowsRegistration}
});

console.log("Mastra instance created for project: ${projectName}");
`;
      await fs.writeFile(join(srcDir, 'index.ts'), indexFileContent);
      logs.push("✓ Generated main index.ts");

      return {
        success: true,
        projectPath: projectDir,
        message: `Project '${projectName}' scaffolded successfully!`,
        logs,
      };

    } catch (error: any) {
      logs.push(`Scaffolding failed with error: ${error.message}`);
      return {
        success: false,
        projectPath: outputPath,
        message: `Scaffolding failed: ${error.message}`,
        logs,
      };
    }
  },
});

// Tool to check scaffolding status
export const checkScaffoldingStatusTool = createTool({
  id: 'check-scaffolding-status',
  description: 'Checks if a scaffolded project exists and is valid',
  inputSchema: z.object({
    projectName: z.string().describe('The name of the project to check'),
    outputPath: z.string().optional().describe('Optional output path, defaults to ./generated-agents/'),
  }),
  outputSchema: z.object({
    exists: z.boolean(),
    isValid: z.boolean(),
    path: z.string(),
    files: z.array(z.string()),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { projectName, outputPath = './generated-agents/' } = context;
    
    try {
      const fullOutputPath = join(process.cwd(), outputPath);
      const projectPath = join(fullOutputPath, projectName);
      
      // Check if project directory exists
      try {
        const stats = await fs.stat(projectPath);
        if (!stats.isDirectory()) {
          return {
            exists: false,
            isValid: false,
            path: projectPath,
            files: [],
            message: `Path exists but is not a directory: ${projectPath}`,
          };
        }
      } catch {
        return {
          exists: false,
          isValid: false,
          path: projectPath,
          files: [],
          message: `Project directory does not exist: ${projectPath}`,
        };
      }
      
      // List files in the project
      const files = await fs.readdir(projectPath, { recursive: true });
      const fileList = files.map(f => f.toString());
      
      // Check for essential files
      const hasPackageJson = fileList.includes('package.json');
      const hasTsConfig = fileList.includes('tsconfig.json');
      const hasMastraIndex = fileList.some(f => f.includes('src/mastra/index.ts'));
      
      const isValid = hasPackageJson && hasTsConfig && hasMastraIndex;
      
      return {
        exists: true,
        isValid,
        path: projectPath,
        files: fileList,
        message: isValid 
          ? `Project is valid and ready to use at: ${projectPath}`
          : `Project exists but missing essential files. Has package.json: ${hasPackageJson}, tsconfig.json: ${hasTsConfig}, mastra/index.ts: ${hasMastraIndex}`,
      };
      
    } catch (error) {
      return {
        exists: false,
        isValid: false,
        path: '',
        files: [],
        message: `Error checking project: ${error}`,
      };
    }
  },
}); 