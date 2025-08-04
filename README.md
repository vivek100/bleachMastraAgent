# Mastra Meta-Agent

A sophisticated meta-agent system that can autonomously generate complete Mastra AI agent projects from natural language descriptions.

## 🌟 Features

- **Self-Calling Architecture**: Uses Mastra's `maxSteps` for autonomous, multi-step execution
- **Hierarchical Agent System**: Specialized sub-agents for planning, agent creation, and tool building
- **Complete Project Generation**: Creates full Mastra projects with agents, tools, and proper TypeScript structure
- **Configuration Management**: Handles both new project creation and existing project enhancement
- **Automated Scaffolding**: Integrates with existing scaffolders to generate actual project files

## 🏗 Architecture

```
┌─────────────────────────────────────┐
│         Orchestrator Agent          │
│      (Self-Calling, maxSteps)       │
└─────────────────┬───────────────────┘
                  │
          ┌───────┴───────┐
          │               │
    ┌─────▼─────┐   ┌─────▼─────┐
    │ Sub-Agents │   │   Tools   │
    │ (as Tools) │   │           │
    └───────────┘   └───────────┘
    │                │
    ├─ Planning      ├─ Config Mgmt
    ├─ Agent Builder ├─ Scaffolding  
    └─ Tool Builder  └─ Validation
```

### Core Components

1. **Orchestrator Agent**: Main controller that coordinates the entire process
2. **Planning Agent**: Analyzes requirements and creates implementation plans
3. **Agent Builder Agent**: Creates detailed agent configurations
4. **Tool Builder Agent**: Generates functional tool implementations
5. **Configuration Tools**: Manage JSON configuration state
6. **Scaffolding Tools**: Generate actual project files

## 🚀 Getting Started

### Prerequisites

- Node.js v20.9.0 or higher
- OpenAI API Key
- Access to the scaffolder (in parent directory structure)

### Installation

1. Clone and navigate to the project:
```bash
cd mastra-meta-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Basic Usage

#### Option 1: Using the Test Script

```bash
npm test
```

This will run a demo that creates a customer support agent system.

#### Option 2: Using the Mastra Dev Server

```bash
npm run dev
```

Then navigate to the Mastra playground and interact with the `orchestratorAgent`.

#### Option 3: Programmatic Usage

```typescript
import { mastra } from './src/mastra';

const orchestrator = mastra.getAgent('orchestratorAgent');

const response = await orchestrator.generate(`
I want to create a blog management agent that can:
1. Create and edit blog posts
2. Generate SEO-optimized titles and descriptions
3. Schedule posts for publication
4. Analyze post performance metrics
`);

console.log(response.text);
```

## 📝 Example Requests

### Creating a New Agent

```typescript
const request = `
Create a financial advisor agent that can:
1. Analyze stock portfolios
2. Provide investment recommendations
3. Calculate risk assessments
4. Generate financial reports
5. Connect to market data APIs

The agent should be professional, data-driven, and include proper risk disclaimers.
`;
```

### Enhancing an Existing Agent

```typescript
const request = `
I have an existing chatbot. Please enhance it by adding:
1. Sentiment analysis capabilities
2. Multi-language support
3. Integration with a customer database
4. Automated escalation for negative sentiment

Here's my current config: ${JSON.stringify(existingConfig)}
`;
```

## 🛠 Configuration Schema

The meta-agent generates configurations following this schema:

```typescript
interface FinalAgentConfig {
  projectName: string;
  description: string;
  dependencies: Record<string, string>;
  entryPoint: {
    type: 'agent' | 'workflow';
    name: string;
  };
  agents: Array<{
    name: string;
    instructions: string;
    model: string;
    tools: string[];
    description?: string;
  }>;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: string;
    outputSchema?: string;
    code: string;
  }>;
  workflows?: Array<{
    name: string;
    description: string;
    inputSchema: string;
    outputSchema: string;
    steps: any[];
  }>;
}
```

## 🔧 How It Works

### 1. Planning Phase
- Analyzes user requirements
- Creates detailed implementation plan
- Identifies needed agents, tools, and integrations

### 2. Configuration Creation
- Initializes project configuration
- Systematically builds the complete config

### 3. Agent Generation
- For each planned agent, generates:
  - Detailed instructions
  - Appropriate model selection
  - Tool requirements

### 4. Tool Generation
- Creates functional tools with:
  - Proper TypeScript code
  - Zod schemas for validation
  - Error handling and best practices

### 5. Validation & Scaffolding
- Validates the complete configuration
- Generates actual project files
- Verifies successful creation

## 🎯 Key Features

### Self-Calling Behavior
The orchestrator agent uses `maxSteps: 20` to autonomously work through the entire process without requiring user intervention at each step.

### Error Handling
- Graceful error recovery
- Automatic retries for failed operations
- Comprehensive validation

### Flexibility
- Works with both new projects and existing configurations
- Supports various agent types and complexity levels
- Extensible architecture for adding new capabilities

## 📁 Generated Project Structure

The meta-agent creates projects following Mastra conventions:

```
generated-project/
├── src/
│   └── mastra/
│       ├── agents/
│       │   ├── main-agent.ts
│       │   └── helper-agent.ts
│       ├── tools/
│       │   ├── api-tools.ts
│       │   └── utility-tools.ts
│       └── index.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## 🤝 Contributing

This project demonstrates advanced agentic patterns:
- Hierarchical agent coordination
- Self-calling autonomous behavior
- Structured output generation
- Tool composition patterns

Feel free to extend the system with additional sub-agents or capabilities!

## 📄 License

ISC

## 🔗 Related Projects

- [Mastra Framework](https://mastra.ai)
- [ADK Python Meta-Agent](../mainADKPython/bleachAgentBuilder/) - The inspiration for this project 