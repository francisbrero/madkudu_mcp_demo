import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const agentRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async () => {
      const agents = await db.agent.findMany({
        orderBy: { updatedAt: "desc" },
      });
      return agents;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const agent = await db.agent.findUnique({
        where: { id: input.id },
      });
      return agent;
    }),

  getActive: publicProcedure
    .query(async () => {
      const activeAgents = await db.agent.findMany({
        where: { active: true },
        orderBy: { updatedAt: "desc" },
      });
      return activeAgents;
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string(),
      systemPrompt: z.string(),
      allowedApis: z.string(),
      inputType: z.string(),
      outputFormat: z.string(),
      active: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.agent.create({
        data: input,
      });
      return agent;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      systemPrompt: z.string(),
      allowedApis: z.string(),
      inputType: z.string(),
      outputFormat: z.string(),
      active: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const agent = await db.agent.update({
        where: { id },
        data,
      });
      return agent;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.agent.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
}); 