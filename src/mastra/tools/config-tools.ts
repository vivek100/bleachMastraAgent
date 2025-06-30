import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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

// Tool implementations...
export const initializeConfigTool = createTool({
  id: 'initialize-config',
  description: 'Creates a new basic configuration skeleton.',
  inputSchema: z.object({
    projectName: z.string(),
    description: z.string(),
    entryPointType: z.enum(['agent', 'workflow']),
    dependencies: z.record(z.string()).optional(),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { projectName, description, entryPointType, dependencies } = context;
    return {
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
  },
});

export const addAgentTool = createTool({
  id: 'add-agent',
  description: 'Adds a new agent to the configuration.',
  inputSchema: z.object({
    config: FinalAgentConfigSchema,
    name: z.string(),
    instructions: z.string(),
    model: z.string(),
    tools: z.array(z.string()),
    description: z.string().optional(),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { config, ...newAgent } = context;
    return {
      ...config,
      agents: [...config.agents, newAgent],
    };
  },
});

export const addToolTool = createTool({
  id: 'add-tool',
  description: 'Adds a new tool to the configuration.',
  inputSchema: z.object({
    config: FinalAgentConfigSchema,
    name: z.string(),
    description: z.string(),
    inputSchema: z.string(),
    outputSchema: z.string().optional(),
    code: z.string(),
    dependencies: z.array(z.string()).optional(),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { config, dependencies, ...newTool } = context;
    const updatedDependencies = { ...config.dependencies };
    if (dependencies) {
      for (const dep of dependencies) {
        updatedDependencies[dep] = "latest";
      }
    }
    return {
      ...config,
      tools: [...config.tools, newTool],
      dependencies: updatedDependencies,
    };
  },
});

export const updateEntryPointTool = createTool({
  id: 'update-entry-point',
  description: 'Updates the entry point of the configuration.',
  inputSchema: z.object({
    config: FinalAgentConfigSchema,
    type: z.enum(['agent', 'workflow']),
    name: z.string(),
  }),
  outputSchema: FinalAgentConfigSchema,
  execute: async ({ context }) => {
    const { config, type, name } = context;
    return {
      ...config,
      entryPoint: { type, name }
    };
  },
});

export const loadConfigTool = createTool({
    id: 'load-config',
    description: 'Loads an existing configuration from a JSON string.',
    inputSchema: z.object({ configJson: z.string() }),
    outputSchema: FinalAgentConfigSchema,
    execute: async ({ context }) => JSON.parse(context.configJson),
});

export const validateConfigTool = createTool({
  id: 'validate-config',
  description: 'Validates a configuration.',
  inputSchema: z.object({ config: FinalAgentConfigSchema }),
  outputSchema: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { config } = context;
    const result = FinalAgentConfigSchema.safeParse(config);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  },
});