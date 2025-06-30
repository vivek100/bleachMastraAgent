import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { orchestratorAgent } from './agents/orchestrator-agent';

export const mastra = new Mastra({
  agents: { orchestratorAgent },
  logger: new PinoLogger({
    name: 'Mastra Meta-Agent',
    level: 'info',
  }),
});