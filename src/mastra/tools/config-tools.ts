import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define the configuration schema with proper validation
const AgentConfigSchema = z.object({
  name: z.string(),
  instructions: z.string(),
  model: z.string(),
  tools: z.array(z.string()),
  description: z.string().optional(),
});

const ToolConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.string(),
  outputSchema: z.string().optional(),
  code: z.string(),
});

// Fix the workflow schema with proper step definition
const WorkflowStepSchema = z.object({
  id: z.string(),
  type: z.string(),
  config: z.record(z.any()).optional(),
});

const WorkflowConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.string(),
  outputSchema: z.string(),
  steps: z.array(WorkflowStepSchema),
});

const FinalAgentConfigSchema = z.object({
  projectName: z.string(),
  description: z.string(),
  dependencies: z.record(z.string()),
  entryPoint: z.object({
    type: z.enum(['agent', 'workflow']),
    name: z.string(),
  }),
  agents: z.array(AgentConfigSchema),
  tools: z.array(ToolConfigSchema),
  workflows: z.array(WorkflowConfigSchema),
});

// Initialize a new config
export const initializeConfigTool = createTool({
  id: 'initialize-config',
  description: 'Creates a new basic configuration skeleton for a Mastra agent project',
  inputSchema: z.object({
    projectName: z.string().describe('The name of the project'),
    description: z.string().describe('A brief description of what the agent does'),
    entryPointType: z.enum(['agent', 'workflow']).describe('Whether to use an agent or workflow as entry point'),
    dependencies: z.record(z.string()).optional().describe('Project dependencies (optional, will use defaults if not provided)'),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { projectName, description, entryPointType, dependencies } = context;
    
    const config = {
      projectName,
      description,
      dependencies: dependencies || {
        "@mastra/core": "latest",
        "@ai-sdk/openai": "latest",
        "zod": "latest"
      },
      entryPoint: {
        type: entryPointType,
        name: entryPointType === 'agent' ? 'mainAgent' : 'mainWorkflow'
      },
      agents: [],
      tools: [],
      workflows: []
    };

    return config;
  },
});

// Add an agent to the config
export const addAgentTool = createTool({
  id: 'add-agent',
  description: 'Adds a new agent to the configuration',
  inputSchema: z.object({
    config: FinalAgentConfigSchema.describe('The current configuration'),
    name: z.string().describe('The name of the agent'),
    instructions: z.string().describe('The instructions for the agent'),
    model: z.string().describe('The model configuration (e.g., "openai(\'gpt-4o\')")'),
    tools: z.array(z.string()).describe('Array of tool names this agent can use'),
    description: z.string().optional().describe('Optional description of the agent'),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { config, name, instructions, model, tools, description } = context;
    
    const newAgent = {
      name,
      instructions,
      model,
      tools,
      ...(description && { description })
    };

    const updatedConfig = {
      ...config,
      agents: [...config.agents, newAgent],
      dependencies: config.dependencies || {},
      workflows: Array.isArray(config.workflows) ? config.workflows : [],
    };

    return updatedConfig;
  },
});

// Add a tool to the config
export const addToolTool = createTool({
  id: 'add-tool',
  description: 'Adds a new tool to the configuration and merges its dependencies.',
  inputSchema: z.object({
    config: FinalAgentConfigSchema.describe('The current configuration object'),
    name: z.string().describe('The name of the tool'),
    description: z.string().describe('What the tool does'),
    inputSchema: z.string().describe('Zod schema for the tool input as a string'),
    outputSchema: z.string().optional().describe('Zod schema for the tool output as a string'),
    code: z.string().describe('The TypeScript code for the tool execution function body'),
    dependencies: z.array(z.string()).optional().describe('Any npm packages this tool depends on (e.g., ["node-fetch"])'),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { config, name, description, inputSchema, outputSchema, code, dependencies } = context;
    
    const newTool = {
      name,
      description,
      inputSchema,
      code,
      ...(outputSchema && { outputSchema })
    };

    // Merge tool-specific dependencies into the main config dependencies
    const updatedDependencies = { ...config.dependencies };
    if (dependencies) {
      for (const dep of dependencies) {
        updatedDependencies[dep] = "latest";
      }
    }

    const updatedConfig = {
      ...config,
      tools: [...config.tools, newTool],
      dependencies: updatedDependencies,
      workflows: Array.isArray(config.workflows) ? config.workflows : [],
    };

    return updatedConfig;
  },
});

// Update the entry point
export const updateEntryPointTool = createTool({
  id: 'update-entry-point',
  description: 'Updates the entry point of the configuration',
  inputSchema: z.object({
    config: FinalAgentConfigSchema.describe('The current configuration'),
    type: z.enum(['agent', 'workflow']).describe('The type of entry point'),
    name: z.string().describe('The name of the agent or workflow to use as entry point'),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { config, type, name } = context;
    
    const updatedConfig = {
      ...config,
      entryPoint: { type, name }
    };

    return updatedConfig;
  },
});

// Read an existing config (for editing mode)
export const loadConfigTool = createTool({
  id: 'load-config',
  description: 'Loads an existing configuration from JSON string for editing',
  inputSchema: z.object({
    configJson: z.string().describe('The JSON string of an existing configuration'),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { configJson } = context;
    
    try {
      const config = JSON.parse(configJson);
      // Validate the config against our schema
      const validatedConfig = FinalAgentConfigSchema.parse(config);
      return validatedConfig;
    } catch (error) {
      throw new Error(`Invalid configuration: ${error}`);
    }
  },
});

// Validate and finalize config
export const validateConfigTool = createTool({
  id: 'validate-config',
  description: 'Validates a configuration and prepares it for scaffolding',
  inputSchema: z.object({
    config: FinalAgentConfigSchema.describe('The configuration to validate'),
  }),
  outputSchema: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    config: FinalAgentConfigSchema,
  }),
  execute: async ({ context }) => {
    const { config } = context;
    const errors: string[] = [];

    // Check if entry point exists
    if (config.entryPoint.type === 'agent') {
      const entryAgent = config.agents.find(a => a.name === config.entryPoint.name);
      if (!entryAgent) {
        errors.push(`Entry point agent '${config.entryPoint.name}' not found in agents list`);
      }
    } else if (config.entryPoint.type === 'workflow') {
      const entryWorkflow = config.workflows?.find(w => w.name === config.entryPoint.name);
      if (!entryWorkflow) {
        errors.push(`Entry point workflow '${config.entryPoint.name}' not found in workflows list`);
      }
    }

    // Check if all agent tools exist
    for (const agent of config.agents) {
      for (const toolName of agent.tools) {
        const toolExists = config.tools.find(t => t.name === toolName);
        if (!toolExists) {
          errors.push(`Tool '${toolName}' used by agent '${agent.name}' not found in tools list`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      config
    };
  },
}); 