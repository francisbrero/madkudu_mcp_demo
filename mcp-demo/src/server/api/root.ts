import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { openaiRouter } from "~/server/api/routers/openai";
import { madkuduRouter } from "~/server/api/routers/madkudu";
import { agentRouter } from "~/server/api/routers/agent";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  openai: openaiRouter,
  madkudu: madkuduRouter,
  agent: agentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
