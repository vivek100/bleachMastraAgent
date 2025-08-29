import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';

// Import all agents
import { orchestratorAgent } from './agents/orchestrator-agent';
import { planningAgent } from './agents/planning-agent';
import { agentBuilderAgent } from './agents/agent-builder-agent';
import { toolBuilderAgent } from './agents/tool-builder-agent';

export const mastra = new Mastra({
  agents: { 
    orchestratorAgent, 
    planningAgent, 
    agentBuilderAgent, 
    toolBuilderAgent 
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra Meta-Agent',
    level: 'info',
  }),
});
