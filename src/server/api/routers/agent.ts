import { z } from "zod";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index.js";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { initializeMcpClient } from "~/server/api/mcp-client";

export const agentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.db.agent.create({
        data: {
          name: input.name,
          description: input.description,
          prompt: input.prompt,
        },
      });
      return agent;
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    const agents = await ctx.db.agent.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return agents;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.db.agent.findUnique({
        where: { id: input.id },
      });
      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }
      return agent;
    }),

  getAgentChatResponse: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system", "tool"]),
            content: z.string(),
            name: z.string().optional(),
            tool_calls: z
              .array(
                z.object({
                  id: z.string(),
                  type: z.literal("function"),
                  function: z.object({
                    name: z.string(),
                    arguments: z.string(),
                  }),
                }),
              )
              .optional(),
            tool_call_id: z.string().optional(),
          }),
        ),
        openAIApiKey: z.string().min(1),
        madkuduApiKey: z.string().min(1),
        model: z.enum(["gpt-4o-mini", "gpt-4o", "o3-mini", "o3"]),
      }),
    )
    .mutation(async ({ input }): Promise<ChatCompletionMessageParam> => {
      const {
        agentId,
        messages,
        openAIApiKey,
        madkuduApiKey,
        model,
      } = input;

      const agent = await db.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      const openai = new OpenAI({ apiKey: openAIApiKey });
      const mcpClient = await initializeMcpClient(madkuduApiKey);

      // 1. Parse agent prompt for tool names (e.g., `mcp_MadAPI_...`)
      const toolNameRegex = /mcp_[\w-]+/g;
      const mentionedToolNames = agent.prompt.match(toolNameRegex) ?? [];
      const uniqueToolNames = [...new Set(mentionedToolNames)];

      // 2. Fetch all tools and filter for the ones mentioned in the prompt
      const allTools = (await mcpClient.listTools()).tools;
      const availableTools = allTools.filter((tool) =>
        uniqueToolNames.includes(tool.name),
      );

      const openAiTools = availableTools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description ?? "",
          parameters: tool.inputSchema ?? {},
        },
      }));

      // 3. Prepend the agent's master prompt as the system message
      const messagesWithSystemPrompt: ChatCompletionMessageParam[] = [
        { role: "system", content: agent.prompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.name && { name: msg.name }),
          ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
          ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
        }) as ChatCompletionMessageParam),
      ];

      // 4. Call OpenAI with the filtered tools
      const completion = await openai.chat.completions.create({
        model: model,
        messages: messagesWithSystemPrompt,
        tools: openAiTools.length > 0 ? openAiTools : undefined,
        tool_choice: openAiTools.length > 0 ? "auto" : undefined,
      });

      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No response from OpenAI",
        });
      }

      // 5. Handle tool calls if the model requests them
      if (responseMessage.tool_calls) {
        const toolMessages: ChatCompletionMessageParam[] = [];

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          let functionArgs: Record<string, unknown> = {};
          try {
            functionArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          } catch {
            toolMessages.push({
              tool_call_id: toolCall.id,
              role: "tool" as const,
              content: `Error: Invalid JSON in arguments.`,
            } as ChatCompletionMessageParam);
            continue;
          }

          try {
            const result: unknown = await mcpClient.callTool({
              name: functionName,
              arguments: functionArgs,
            });
            toolMessages.push({
              tool_call_id: toolCall.id,
              role: "tool" as const,
              content: JSON.stringify(result),
            } as ChatCompletionMessageParam);
          } catch (runError) {
            const errorMessage =
              runError instanceof Error ? runError.message : "Unknown error";
            toolMessages.push({
              tool_call_id: toolCall.id,
              role: "tool" as const,
              content: `Error: ${errorMessage}`,
            } as ChatCompletionMessageParam);
          }
        }

        const secondCompletion = await openai.chat.completions.create({
          model: model,
          messages: [...messagesWithSystemPrompt, responseMessage, ...toolMessages],
        });

        const finalMessage = secondCompletion.choices[0]?.message;
        if (finalMessage) return finalMessage;
        
        return { role: 'assistant', content: 'Error: No response from OpenAI after tool call.' };
      }

      return responseMessage;
    }),
}); 