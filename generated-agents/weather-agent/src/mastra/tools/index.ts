import { createTool } from "@mastra/core/tools";
import * as z from "zod";

export const weather-api = createTool({
    id: "weather-api",
    description: "Fetches current weather data for specified cities from an external weather service",
    inputSchema: z.object({ city: z.string().describe('City name to get weather for'), units: z.enum(['metric', 'imperial']).optional().describe('Temperature units') }),
    outputSchema: z.object({ temperature: z.number(), condition: z.string(), humidity: z.number(), city: z.string() }),
    
    execute: async ({ context }) => {
        // Mock implementation. Replace with your actual logic.
        console.log("Executing tool: weather-api with context:", context);
        try { const apiKey = process.env.OPENWEATHER_API_KEY; if (!apiKey) throw new Error('API key not configured'); const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&appid=' + apiKey + '&units=' + (units || 'metric')); if (!response.ok) throw new Error('Weather API error: ' + response.statusText); const data = await response.json(); return { temperature: data.main.temp, condition: data.weather[0].description, humidity: data.main.humidity, city: data.name }; } catch (error) { throw new Error('Failed to fetch weather: ' + error.message); }
    },
});
