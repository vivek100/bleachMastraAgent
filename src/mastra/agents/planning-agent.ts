import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const planningAgentTool = {
  id: 'planning-agent',
  description: 'Analyzes a user request and creates a structured plan for building a Mastra agent.',
  inputSchema: z.object({
    userRequest: z.string().describe('The user\'s request for a new agent'),
    existingConfig: z.any().optional().describe('Optional existing configuration to extend'),
  }),
  outputSchema: z.object({
    projectType: z.string(),
    projectName: z.string(),
    description: z.string(),
    requiredTools: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      inputType: z.string(),
      outputType: z.string(),
    })),
    requiredAgents: z.array(z.object({
      name: z.string(),
      role: z.string(),
      toolsNeeded: z.array(z.string()),
    })),
    suggestedWorkflow: z.any().optional(),
  }),
  execute: async ({ context }: { context: any }) => {
    const agent = new Agent({
      name: 'planning-agent',
      description: 'Analyzes a user request and creates a structured plan for building a Mastra agent.',
      instructions: `
You are a planning agent. Your task is to analyze a user's request for a new Mastra agent and break it down into a structured plan.

Based on the user's request, you must identify:
1.  **Required Tools:** What specific functions does the agent need? (e.g., 'fetch-weather-api', 'search-web'). For each tool, describe its purpose, expected input, and output.
2.  **Required Agents:** What roles are needed? (e.g., a 'main-agent' to handle user interaction, a 'research-agent' to use tools). For each agent, describe its role and which tools it will need.
3.  **Workflows:** Is there a multi-step process that needs to be defined as a workflow? Describe the sequence of steps.

Generate a project name based on the request (use kebab-case, e.g., "weather-agent", "web-scraper-bot").
Generate a clear description of what the system does.

Your final output must be a single JSON object containing the plan. Do not add any other text.
      `,
      model: openai('gpt-4o-mini'),
    });

    const result = await agent.generate(`
User Request: ${context.userRequest}

Please analyze this request and create a structured plan. Return only a JSON object with the following structure:

{
  "projectType": "agent",
  "projectName": "kebab-case-name",
  "description": "Clear description of what this system does",
  "requiredTools": [
    {
      "name": "toolName",
      "purpose": "What this tool does",
      "inputType": "What input it expects",
      "outputType": "What output it provides"
    }
  ],
  "requiredAgents": [
    {
      "name": "agentName",
      "role": "What role this agent plays",
      "toolsNeeded": ["list", "of", "tool", "names"]
    }
  ],
  "suggestedWorkflow": null
}
    `);

    try {
      return JSON.parse(result.text);
    } catch (error) {
      // Fallback plan if JSON parsing fails
      return {
        projectType: "agent",
        projectName: "custom-agent",
        description: "A custom Mastra agent",
        requiredTools: [
          {
            name: "customTool",
            purpose: "Performs custom functionality",
            inputType: "user input",
            outputType: "processed result"
          }
        ],
        requiredAgents: [
          {
            name: "mainAgent",
            role: "Main agent for handling user requests",
            toolsNeeded: ["customTool"]
          }
        ],
        suggestedWorkflow: null
      };
    }
  },
};