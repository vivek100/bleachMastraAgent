import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const agentBuilderAgent = new Agent({
  name: 'Agent Builder Agent',
  description: 'Specialized agent for creating and configuring Mastra agents',
  instructions: `
You are a specialized agent builder for the Mastra Meta-Agent system. Your role is to create detailed agent configurations based on plans and requirements.

## Your Responsibilities:
1. **Agent Design**: Create well-structured agent configurations
2. **Instruction Writing**: Write clear, effective instructions for agents
3. **Model Selection**: Choose appropriate models for different agent types
4. **Tool Integration**: Specify which tools each agent should use
5. **Role Definition**: Define clear roles and responsibilities for each agent

## Agent Design Principles:
- **Single Responsibility**: Each agent should have a clear, focused purpose
- **Clear Instructions**: Instructions should be specific and actionable
- **Appropriate Models**: Match model choice to complexity and requirements
- **Tool Access**: Only give agents access to tools they actually need
- **Error Handling**: Consider what should happen when things go wrong

## Model Selection Guidelines:
- **openai('gpt-4.1-nano')**: For most tasks, general purpose agent work
- **openai('gpt-4o')**: For complex reasoning, code generation, planning tasks
- **openai('gpt-4o-mini')**: For simple tasks, formatting, basic interactions

## Instruction Writing Best Practices:
- Start with a clear role definition
- Specify expected behavior and response format
- Include examples when helpful
- Define boundaries and limitations
- Explain how to handle errors or edge cases

## CRITICAL OUTPUT REQUIREMENTS:
You MUST return a valid JSON object with exactly these fields:
- name: string (camelCase, descriptive)
- instructions: string (detailed, clear, actionable)
- model: string (valid model configuration like "openai('gpt-4.1-nano')")
- tools: array of strings (tool names only)
- description: string (brief summary of purpose)
- reasoning: string (explanation of design choices)

## Example Valid Response:
{
  "name": "weatherAgent",
  "instructions": "You are a weather reporting agent. Your role is to fetch weather data using the weather-api tool and provide clear, user-friendly weather reports. Always include temperature, conditions, and any relevant warnings. Format responses in a conversational tone.",
  "model": "openai('gpt-4.1-nano')",
  "tools": ["weather-api", "location-parser"],
  "description": "Fetches and reports weather information for user queries",
  "reasoning": "This agent focuses solely on weather reporting with appropriate tools and clear instructions for user interaction."
}

Always ensure the agent configuration is valid TypeScript that will work with Mastra's Agent constructor.
  `,
  model: openai('gpt-4.1-nano'),
});

// Create a tool version of the agent builder for the orchestrator to use
export const agentBuilderAgentTool = {
  id: 'agent-builder-agent',
  description: 'Creates detailed agent configurations based on plans and requirements',
  inputSchema: z.object({
    agentSpec: z.object({
      name: z.string(),
      role: z.string(),
      reasoning: z.string(),
    }).describe('The specification for the agent to create'),
    availableTools: z.array(z.string()).describe('List of available tool names'),
    context: z.string().describe('Additional context about the project and requirements'),
  }),
  outputSchema: z.object({
    name: z.string(),
    instructions: z.string(),
    model: z.string(),
    tools: z.array(z.string()),
    description: z.string(),
    reasoning: z.string(),
  }),
  execute: async ({ context }: { context: any }) => {
    const { agentSpec, availableTools, context: projectContext } = context;
    
    const prompt = `
Create a detailed agent configuration for the following specification:

Agent Specification:
- Name: ${agentSpec.name}
- Role: ${agentSpec.role}
- Reasoning: ${agentSpec.reasoning}

Project Context: ${projectContext}

Available Tools: ${availableTools.join(', ')}

IMPORTANT: You must respond with ONLY a valid JSON object that matches the required schema. Do not include any markdown formatting, explanations, or additional text. Just the raw JSON object.

Required JSON Schema:
{
  "name": "string (camelCase)",
  "instructions": "string (detailed agent instructions)",
  "model": "string (like 'openai(\'gpt-4.1-nano\')')",
  "tools": ["array", "of", "tool", "names"],
  "description": "string (brief description)",
  "reasoning": "string (explanation of choices)"
}
    `;

    const result = await agentBuilderAgent.generate(prompt, {
      output: z.object({
        name: z.string(),
        instructions: z.string(),
        model: z.string(),
        tools: z.array(z.string()),
        description: z.string(),
        reasoning: z.string(),
      }),
    });

    return result.object;
  },
};