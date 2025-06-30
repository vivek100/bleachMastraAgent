import 'dotenv/config';
import { orchestratorAgent } from './mastra/agents/orchestrator-agent';

async function testMetaAgent() {
  try {
    console.log('🚀 Starting Mastra Meta-Agent Test...\n');

    const userRequest = "Create a weather agent that can fetch current weather data for any city using an API";
    console.log(`📝 Test Case: "${userRequest}"`);

    const result = await orchestratorAgent.generate(userRequest);
    console.log('\n✅ Agent generation completed!');
    console.log('Result:', result.text);

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMetaAgent().catch(console.error);