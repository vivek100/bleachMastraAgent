import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const planningAgent = new Agent({
  name: 'Planning Agent',
  description: 'Analyzes user requirements and creates a detailed plan for agent generation',
  instructions: `
You are a specialized planning agent for the Mastra Meta-Agent system. Your role is to analyze user requirements and create a comprehensive plan for generating a Mastra AI agent.

## Your Responsibilities:
1. **Requirement Analysis**: Break down user requests into specific, actionable requirements
2. **Architecture Planning**: Determine what agents, tools, and workflows are needed
3. **Task Sequencing**: Create a logical sequence of tasks for the generation process
4. **Dependency Mapping**: Identify what components depend on others

## Analysis Framework:
When a user requests an agent, analyze:
- **Purpose**: What is the main goal of this agent?
- **Capabilities**: What specific actions should it perform?
- **Integrations**: What external systems or APIs does it need?
- **User Interaction**: How will users interact with it?
- **Data Requirements**: What data does it need to access or store?

## CRITICAL OUTPUT REQUIREMENTS:
You MUST return a valid JSON object with exactly these fields:
- projectOverview: string (brief summary of what we're building)
- requiredAgents: array of objects with name, role, reasoning
- requiredTools: array of objects with name, function, reasoning
- dependencies: array of strings (external services/APIs needed)
- implementationSteps: array of strings (ordered list of tasks)
- entryPoint: "agent" or "workflow" (main entry point type)
- recommendations: string (additional guidance and suggestions)

## Example Valid Response:
{
  "projectOverview": "A weather reporting system that fetches real-time weather data and provides user-friendly reports",
  "requiredAgents": [
    {
      "name": "WeatherAgent",
      "role": "Main weather reporting agent that coordinates data fetching and user interaction",
      "reasoning": "Central coordinator needed to handle user requests and orchestrate weather data retrieval"
    }
  ],
  "requiredTools": [
    {
      "name": "WeatherAPI",
      "function": "Fetches current weather data from external weather service",
      "reasoning": "Essential for getting real-time weather information from reliable sources"
    }
  ],
  "dependencies": ["OpenWeatherMap API", "Geolocation service"],
  "implementationSteps": [
    "Create weather API tool",
    "Build main weather agent",
    "Configure entry point",
    "Test and validate"
  ],
  "entryPoint": "agent",
  "recommendations": "Consider adding location parsing capabilities and caching for frequently requested cities"
}

## Guidelines:
- Be specific and actionable in your recommendations
- Consider scalability and maintainability
- Suggest appropriate model choices (gpt-4o for complex tasks, gpt-4o-mini for simple ones)
- Think about error handling and edge cases
- Consider user experience and ease of use

Respond with a well-structured plan that the other agents can use to build the requested system.
  `,
  model: openai('gpt-4.1-nano'),
});

// Create a tool version of the planning agent for the orchestrator to use
export const planningAgentTool = {
  id: 'planning-agent',
  description: 'Analyzes user requirements and creates a detailed plan for agent generation',
  inputSchema: z.object({
    userRequest: z.string().describe('The user\'s request for what kind of agent they want'),
    existingConfig: z.any().optional().describe('Any existing configuration that should be considered'),
  }),
  outputSchema: z.object({
    projectOverview: z.string(),
    requiredAgents: z.array(z.object({
      name: z.string(),
      role: z.string(),
      reasoning: z.string(),
    })),
    requiredTools: z.array(z.object({
      name: z.string(),
      function: z.string(),
      reasoning: z.string(),
    })),
    dependencies: z.array(z.string()),
    implementationSteps: z.array(z.string()),
    entryPoint: z.enum(['agent', 'workflow']),
    recommendations: z.string(),
  }),
  execute: async ({ context }: { context: any }) => {
    const { userRequest, existingConfig } = context;
    
    const prompt = `
User Request: ${userRequest}

${existingConfig ? `Existing Configuration: ${JSON.stringify(existingConfig, null, 2)}` : 'This is a new project.'}

IMPORTANT: You must respond with ONLY a valid JSON object that matches the required schema. Do not include any markdown formatting, explanations, or additional text. Just the raw JSON object.

Required JSON Schema:
{
  "projectOverview": "string (brief summary)",
  "requiredAgents": [
    {
      "name": "string",
      "role": "string",
      "reasoning": "string"
    }
  ],
  "requiredTools": [
    {
      "name": "string", 
      "function": "string",
      "reasoning": "string"
    }
  ],
  "dependencies": ["array", "of", "strings"],
  "implementationSteps": ["array", "of", "steps"],
  "entryPoint": "agent" or "workflow",
  "recommendations": "string"
}

Analyze the user request and provide a comprehensive plan following the analysis framework defined in your instructions.
    `;

    const result = await planningAgent.generate(prompt, {
      output: z.object({
        projectOverview: z.string(),
        requiredAgents: z.array(z.object({
          name: z.string(),
          role: z.string(),
          reasoning: z.string(),
        })),
        requiredTools: z.array(z.object({
          name: z.string(),
          function: z.string(),
          reasoning: z.string(),
        })),
        dependencies: z.array(z.string()),
        implementationSteps: z.array(z.string()),
        entryPoint: z.enum(['agent', 'workflow']),
        recommendations: z.string(),
      }),
    });

    return result.object;
  },
};