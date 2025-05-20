# MadKudu MCP Demo

A demonstration of MadKudu's Model Context Protocol (MCP) capabilities, showcasing how enrichment data enhances AI agent performance.
<img width="1511" alt="MadKudu_MCP_Demo" src="https://github.com/user-attachments/assets/71e7d1f7-29a4-499a-997e-6fb7e69adee1" />

## Overview

This demo provides a side-by-side comparison between standard GPT-4o responses and enhanced responses using MadKudu's context enrichment. It demonstrates how providing AI with rich company and contact data leads to more personalized, accurate, and effective outputs.

## Features

- **Side-by-side Comparison**: Compare standard GPT output with MadKudu-enhanced responses
- **Multiple Agent Types**: Test different use cases like executive outreach, account planning, and QBR preparation
- **Real-time Enrichment**: Visualize how MadKudu provides context during conversations
- **Modern UI**: Clean, professional interface following MadKudu's design guidelines

## Use Cases

- **Executive Outreach Writer**: Generate personalized executive outreach messages based on company data
- **Account Plan Generator**: Create tactical account plans for strategic sales targets with prioritized actions
- **QBR Manager**: Prepare for Quarterly Business Reviews with usage analytics and growth opportunities

## Technology Stack

- **Frontend**: React, Next.js, TailwindCSS
- **API Integration**: tRPC for type-safe API calls
- **AI Integration**: OpenAI API and MadKudu API

## Development

### Prerequisites

- Node.js 18+ and pnpm

### Running Locally

1. Clone this repository
2. Install dependencies:
   ```
   cd mcp-demo
   pnpm install
   ```
3. Configure environment variables in `.env`
4. Start the development server:
   ```
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contributing

This project is a demonstration of MadKudu capabilities. For feature requests or bug reports, please contact the MadKudu team.

## License

See the [LICENSE](LICENSE) file for more information.
