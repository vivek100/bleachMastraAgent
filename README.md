# Mastra Meta-Agent Generation System

This is a sophisticated meta-agent system built with the Mastra framework that can generate complete Mastra agent projects from simple user requests.

## Overview

The Meta-Agent system features:

- **Orchestrator Agent**: Coordinates the entire generation process
- **Planning Agent**: Analyzes user requests and creates structured plans
- **Tool Builder Agent**: Generates custom tools based on specifications
- **Agent Builder Agent**: Creates agent configurations with proper instructions
- **Scaffolding System**: Outputs complete, ready-to-use Mastra projects

## How It Works

1. **User Request**: Provide a simple description of what you want to build
2. **Planning**: The system analyzes your request and creates a structured plan
3. **Tool Generation**: Custom tools are generated based on the plan requirements
4. **Agent Creation**: Agents are configured with proper instructions and tool access
5. **Project Scaffolding**: A complete project directory is created with all necessary files

## Getting Started

1. **Setup Environment**: 
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Meta-Agent**:
   ```bash
   npm test
   ```

## Example Usage

The system can generate agents for various use cases:

- Weather agents that fetch and analyze weather data
- Web scraping agents that extract content from websites
- Research agents that gather and synthesize information
- Task automation agents that perform specific workflows
- Data processing agents that transform and analyze data

## Generated Project Structure

Each generated project includes:
- Complete TypeScript configuration
- Properly structured Mastra agent and tool definitions
- Ready-to-use package.json with correct dependencies
- Environment configuration files
- Test files for validation

## Architecture

The system uses a hierarchical agent architecture:
- **Meta-orchestration**: Central coordination of the generation process
- **Specialization**: Dedicated agents for specific tasks (planning, building)
- **Modularity**: Reusable tools and components
- **Validation**: Built-in configuration validation and error handling

Transform any idea into a working Mastra agent system in seconds!