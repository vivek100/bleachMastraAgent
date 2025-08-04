import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const toolBuilderAgent = new Agent({
  name: 'Tool Builder Agent',
  description: 'Specialized agent for creating and coding Mastra tools',
  instructions: `
You are a specialized tool builder for the Mastra Meta-Agent system. Your role is to create functional tools with proper schemas and executable code.

## Your Responsibilities:
1. **Tool Design**: Create well-structured tool specifications
2. **Schema Definition**: Write proper Zod schemas for inputs and outputs
3. **Code Generation**: Write functional TypeScript code for tool execution
4. **API Integration**: Implement proper API calls and error handling
5. **Documentation**: Provide clear descriptions and parameter explanations

## Tool Design Principles:
- **Single Purpose**: Each tool should do one thing well
- **Type Safety**: Use proper TypeScript types and Zod schemas
- **Error Handling**: Handle errors gracefully with meaningful messages
- **Async/Await**: Use proper async patterns for I/O operations
- **Input Validation**: Validate all inputs with descriptive schemas
- **Clear Naming**: Use descriptive names for tools and parameters

## Schema Writing Guidelines:
- Use z.string().describe() for clear parameter descriptions
- Mark optional parameters with .optional()
- Use appropriate Zod types (z.number(), z.boolean(), z.array(), etc.)
- Provide default values where appropriate
- Include format validation for emails, URLs, etc.

## Code Generation Best Practices:
- Write clean, readable TypeScript code
- Use proper error handling with try/catch blocks
- Return meaningful error messages
- Use appropriate HTTP methods for API calls
- Include proper headers and authentication
- Validate responses before returning

## Common Tool Patterns:
- **API Tools**: Fetch data from external APIs
- **Data Processing**: Transform and manipulate data
- **File Operations**: Read, write, or manipulate files
- **Utility Tools**: Perform calculations or formatting
- **Integration Tools**: Connect to specific services

## CRITICAL OUTPUT REQUIREMENTS:
You MUST return a valid JSON object with exactly these fields:
- name: string (kebab-case, descriptive)
- description: string (clear explanation of what the tool does)
- inputSchema: string (valid Zod schema as string)
- outputSchema: string (optional, valid Zod schema as string)
- code: string (functional TypeScript code for execute function body)
- dependencies: array of strings (optional, npm package names)
- reasoning: string (explanation of design choices)

## Example Valid Response:
{
  "name": "weather-api",
  "description": "Fetches current weather data from OpenWeatherMap API for a given city",
  "inputSchema": "z.object({ city: z.string().describe('City name to get weather for'), units: z.enum(['metric', 'imperial']).optional().describe('Temperature units') })",
  "outputSchema": "z.object({ temperature: z.number(), condition: z.string(), humidity: z.number(), city: z.string() })",
  "code": "try { const apiKey = process.env.OPENWEATHER_API_KEY; if (!apiKey) throw new Error('API key not configured'); const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&appid=' + apiKey + '&units=' + (units || 'metric')); if (!response.ok) throw new Error('Weather API error: ' + response.statusText); const data = await response.json(); return { temperature: data.main.temp, condition: data.weather[0].description, humidity: data.main.humidity, city: data.name }; } catch (error) { throw new Error('Failed to fetch weather: ' + error.message); }",
  "dependencies": [],
  "reasoning": "This tool provides essential weather data functionality with proper error handling and type safety."
}

Always ensure the generated code is production-ready and follows Mastra conventions.
  `,
  model: openai('gpt-4.1-nano'),
});

// Create a tool version of the tool builder for the orchestrator to use
export const toolBuilderAgentTool = {
  id: 'tool-builder-agent',
  description: 'Creates functional tools with proper schemas and executable code',
  inputSchema: z.object({
    toolSpec: z.object({
      name: z.string(),
      function: z.string(),
      reasoning: z.string(),
    }).describe('The specification for the tool to create'),
    context: z.string().describe('Additional context about the project and requirements'),
    existingTools: z.array(z.string()).optional().describe('List of existing tool names to avoid conflicts'),
  }),
  outputSchema: z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.string(),
    outputSchema: z.string().optional(),
    code: z.string(),
    dependencies: z.array(z.string()).optional(),
    reasoning: z.string(),
  }),
  execute: async ({ context }: { context: any }) => {
    const { toolSpec, context: projectContext, existingTools = [] } = context;
    
    const prompt = `
Create a functional tool implementation for the following specification:

Tool Specification:
- Name: ${toolSpec.name}
- Function: ${toolSpec.function}
- Reasoning: ${toolSpec.reasoning}

Project Context: ${projectContext}

Existing Tools (avoid conflicts): ${existingTools.join(', ')}

IMPORTANT: You must respond with ONLY a valid JSON object that matches the required schema. Do not include any markdown formatting, explanations, or additional text. Just the raw JSON object.

Required JSON Schema:
{
  "name": "string (kebab-case)",
  "description": "string (what the tool does)",
  "inputSchema": "string (Zod schema)",
  "outputSchema": "string (optional Zod schema)",
  "code": "string (TypeScript code for execute function)",
  "dependencies": ["array", "of", "npm", "packages"],
  "reasoning": "string (explanation of choices)"
}

The inputSchema should be a valid Zod schema string like:
"z.object({ city: z.string().describe('City name') })"

The code should be the body of an async function that uses the context parameter.
    `;

    const result = await toolBuilderAgent.generate(prompt, {
      output: z.object({
        name: z.string(),
        description: z.string(),
        inputSchema: z.string(),
        outputSchema: z.string().optional(),
        code: z.string(),
        dependencies: z.array(z.string()).optional(),
        reasoning: z.string(),
      }),
    });

    return result.object;
  },
};