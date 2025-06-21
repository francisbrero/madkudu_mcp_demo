# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MadKudu MCP Demo application - a Next.js app showcasing MadKudu's Model-Context Provider (MCP) capabilities. It demonstrates how LLMs can leverage business context through structured tools.

**Tech Stack**: Next.js 15.2.3 (App Router), TypeScript, tRPC, Prisma (SQLite), Tailwind CSS, Zustand

## Essential Commands

### Development
```bash
pnpm dev          # Start development server (port 3000)
pnpm dev --turbo  # Start with Turbo mode
```

### Build & Production
```bash
pnpm build        # Build for production
pnpm start        # Start production server
pnpm preview      # Build and start production
```

### Database Management
```bash
pnpm db:push      # Push schema changes to dev DB
pnpm db:migrate   # Apply migrations to production
pnpm db:generate  # Generate Prisma client
pnpm db:studio    # Open Prisma Studio GUI
```

### Code Quality (ALWAYS run before committing)
```bash
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
pnpm check        # Run both lint and typecheck
```

### Testing
```bash
pnpm test-api-keys # Test MadKudu and OpenAI API keys
```

## Architecture & Code Structure

### High-Level Architecture
- **Frontend**: Next.js App Router with React components
- **API Layer**: tRPC for type-safe client-server communication
- **MCP Integration**: Server-side MCP client connects to MadKudu's MCP server
- **State Management**: Zustand for client state, tRPC/React Query for server state
- **Database**: SQLite with Prisma ORM

### Key Directories
- `src/app/`: Next.js pages and routes
  - `api/trpc/`: tRPC API endpoint
  - `_components/`: Shared UI components
  - Each route has its own directory with page.tsx
- `src/server/`: Server-side logic
  - `api/routers/`: tRPC routers (mcp.ts for MCP operations, agent.ts for CRUD)
  - `api/mcp-client.ts`: MCP client initialization and connection
- `src/stores/`: Zustand stores for client state
- `src/trpc/`: tRPC client configuration

### Critical Integration Points

1. **MCP Client Connection** (src/server/api/mcp-client.ts):
   - Connects to `https://mcp.madkudu.com/{apiKey}/mcp`
   - Supports StreamableHTTP with SSE fallback
   - Server-side only, accessed via tRPC procedures

2. **Tool Calling Flow**:
   - User sends message → tRPC procedure → OpenAI API with tools
   - OpenAI requests tool calls → Execute via MCP client → Return results
   - Tool results integrated into conversation → Final response

3. **Agent System**:
   - Agents stored in SQLite with prompt and tool preferences
   - Each agent has isolated chat interface at `/agents/[agentId]`
   - Prompts support Markdown and can reference specific MCP tools

### Environment Configuration
Required in `.env`:
- `DATABASE_URL`: SQLite file path (default: `file:./prisma/dev.db`)
- `OPENAI_API_KEY`: Server-side only for chat functionality

MadKudu API key is stored client-side in Zustand store (demo purposes).

### Type Safety Patterns
- All API calls go through tRPC with full type inference
- Zod schemas validate all inputs and outputs
- Environment variables validated with @t3-oss/env-nextjs
- Strict TypeScript configuration enforced

### Common Development Tasks

1. **Adding a new page**: Create directory in `src/app/` with `page.tsx`
2. **Adding API endpoint**: Create procedure in appropriate tRPC router
3. **Modifying database**: Update schema.prisma, run `pnpm db:push`
4. **Testing MCP tools**: Use `/playground` for isolated testing
5. **Creating agents**: Use `/agents/new` with Markdown prompts