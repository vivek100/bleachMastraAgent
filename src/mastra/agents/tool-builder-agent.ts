import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const toolBuilderAgentTool = {
  id: 'tool-builder-agent',
  description: 'Generates the configuration for a single Mastra tool based on a specification.',
  inputSchema: z.object({
    toolSpec: z.object({
      name: z.string(),
      purpose: z.string(),
      inputType: z.string(),
      outputType: z.string(),
    }),
    context: z.string(),
    existingTools: z.array(z.string()),
  }),
  outputSchema: z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.string(),
    outputSchema: z.string().optional(),
    code: z.string(),
    dependencies: z.array(z.string()).optional(),
  }),
  execute: async ({ context }: { context: any }) => {
    const agent = new Agent({
      name: 'tool-builder-agent',
      description: 'Generates the configuration for a single Mastra tool based on a specification.',
      instructions: `
You are a Mastra Tool configuration generator.
Your task is to write the configuration for a single tool based on a given specification.

You will be given:
- The tool's name, purpose, input type, and output type.
- The overall context of the system being built.

You must generate:
- A clear, concise description for the tool.
- A valid Zod schema for the tool's input as a string (e.g., "z.object({ city: z.string() })").
- A valid Zod schema for the tool's output as a string (optional).
- The TypeScript code for the tool's execution logic. The code should be a mock implementation that returns a realistic example value.
- A list of any npm package dependencies the tool's code requires (e.g., ["node-fetch"]).

Your final output must be a single JSON object containing the tool's \`name\`, \`description\`, \`inputSchema\`, \`outputSchema\`, \`code\`, and \`dependencies\`. Do not include any other text.
      `,
      model: openai('gpt-4o-mini'),
    });

    const { toolSpec, context: systemContext, existingTools } = context;

    const result = await agent.generate(`
Tool Specification:
- Name: ${toolSpec.name}
- Purpose: ${toolSpec.purpose}
- Input Type: ${toolSpec.inputType}
- Output Type: ${toolSpec.outputType}

System Context: ${systemContext}
Existing Tools: ${existingTools.join(', ')}

Please generate the tool configuration as a JSON object with this structure:

{
  "name": "${toolSpec.name}",
  "description": "Clear description of what this tool does",
  "inputSchema": "z.object({ paramName: z.string().describe('Parameter description') })",
  "outputSchema": "z.object({ resultName: z.string() })",
  "code": "// Mock implementation\\nconsole.log('Executing ${toolSpec.name}:', context);\\nreturn { resultName: 'example result' };",
  "dependencies": ["package-name"]
}

Make sure the inputSchema and outputSchema are valid Zod schema strings.
The code should be a simple mock implementation that logs the input and returns an example result.
Only include dependencies if the tool actually needs external packages.

Only return the JSON object, no other text.
    `);

    try {
      return JSON.parse(result.text);
    } catch (error) {
      // Fallback configuration if JSON parsing fails
      return {
        name: toolSpec.name,
        description: toolSpec.purpose,
        inputSchema: `z.object({ input: z.string().describe('${toolSpec.inputType}') })`,
        outputSchema: `z.object({ output: z.string().describe('${toolSpec.outputType}') })`,
        code: `console.log('Executing ${toolSpec.name}:', context);\nreturn { output: 'example ${toolSpec.outputType}' };`,
        dependencies: []
      };
    }
  },
};