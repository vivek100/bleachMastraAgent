
import { Mastra } from "@mastra/core";
import { WeatherDataFetcherAgent } from './agents';
import { weather-api } from './tools';


export const mastra = new Mastra({
    agents: { WeatherDataFetcherAgent },
    tools: { weather-api },
    
});

console.log("Mastra instance created for project: weather-agent");
