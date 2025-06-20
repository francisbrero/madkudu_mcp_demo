import { createTRPCRouter } from "~/server/api/trpc";
import { mcpRouter } from "./routers/mcp";
import { agentRouter } from "./routers/agent";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  mcp: mcpRouter,
  agent: agentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
