import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const agentBuilderAgentTool = {
  id: 'agent-builder-agent',
  description: 'Generates the configuration for a single Mastra agent based on a specification.',
  inputSchema: z.object({
    agentSpec: z.object({
      name: z.string(),
      role: z.string(),
      reasoning: z.string().optional(),
    }),
    availableTools: z.array(z.string()),
    context: z.string(),
  }),
  outputSchema: z.object({
    name: z.string(),
    instructions: z.string(),
    model: z.string(),
    tools: z.array(z.string()),
    description: z.string().optional(),
  }),
  execute: async ({ context }: { context: any }) => {
    const agent = new Agent({
      name: 'agent-builder-agent',
      description: 'Generates the configuration for a single Mastra agent based on a specification.',
      instructions: `
You are a Mastra Agent configuration generator.
Your task is to write the configuration for a single agent based on a given specification.

You will be given:
- The agent's name, role, and reasoning.
- A list of available tools.
- The overall context of the system being built.

You must generate:
- A clear, concise set of instructions for the agent.
- The appropriate model to use (default to 'openai(\'gpt-4o-mini\')').
- A list of tool names the agent should have access to.

Your final output must be a single JSON object containing the agent's \`name\`, \`instructions\`, \`model\`, and \`tools\` properties. Do not include any other text.
      `,
      model: openai('gpt-4o-mini'),
    });

    const { agentSpec, availableTools, context: systemContext } = context;

    const result = await agent.generate(`
Agent Specification:
- Name: ${agentSpec.name}
- Role: ${agentSpec.role}
- Reasoning: ${agentSpec.reasoning || 'Not provided'}

Available Tools: ${availableTools.join(', ')}
System Context: ${systemContext}

Please generate the agent configuration as a JSON object with this structure:

{
  "name": "${agentSpec.name}",
  "instructions": "Clear, detailed instructions for what this agent should do",
  "model": "openai('gpt-4o-mini')",
  "tools": ["list", "of", "relevant", "tools"],
  "description": "Optional description of the agent"
}

Only return the JSON object, no other text.
    `);

    try {
      return JSON.parse(result.text);
    } catch (error) {
      // Fallback configuration if JSON parsing fails
      return {
        name: agentSpec.name,
        instructions: `You are ${agentSpec.name}. ${agentSpec.role}. Use the available tools to help users with their requests.`,
        model: "openai('gpt-4o-mini')",
        tools: availableTools,
        description: agentSpec.role
      };
    }
  },
};