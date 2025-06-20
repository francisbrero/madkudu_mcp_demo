import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import OpenAI from "openai";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat";
import { initializeMcpClient, clearMcpClient } from "~/server/api/mcp-client";
import type { Tool } from "@modelcontextprotocol/sdk";
import { getDisplayName } from "@modelcontextprotocol/sdk/shared/metadataUtils.js";

interface OpenAIResponse {
  error?: {
    message: string;
  };
}

export const mcpRouter = createTRPCRouter({
  validateKey: publicProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        // We need to clear any previously cached client that might have been created
        // with a different (or invalid) key.
        clearMcpClient();
        await initializeMcpClient(input.apiKey);
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Validation failed";
        return { success: false, error: errorMessage };
      }
    }),

  validateOpenAIKey: publicProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${input.apiKey}`,
          },
        });
        const data = (await response.json()) as OpenAIResponse;
        if (!response.ok || data.error) {
          throw new Error(
            data.error?.message ?? `HTTP Error ${response.status}`,
          );
        }
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("OpenAI API Key validation failed:", message);
        return { success: false, error: "Validation failed" };
      }
    }),

  getTools: publicProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .query(async ({ input }): Promise<Tool[]> => {
      try {
        const client = await initializeMcpClient(input.apiKey);
        const toolList = await client.listTools();

        // Sort tools by display name
        const sortedTools = toolList.tools.sort((a, b) => {
          const aName = getDisplayName(a) ?? a.name;
          const bName = getDisplayName(b) ?? b.name;
          return aName.localeCompare(bName);
        });

        return sortedTools;
      } catch (error) {
        console.error("Detailed error in getTools:", error);
        const message =
          error instanceof Error ? error.message : "Failed to fetch MCP tools";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  runTool: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        toolId: z.string(),
        params: z.record(z.unknown()), // Accept any JSON object for params
      }),
    )
    .mutation(async ({ input }): Promise<unknown> => {
      try {
        const client = await initializeMcpClient(input.apiKey);
        const result = await client.callTool({
          name: input.toolId,
          arguments: input.params,
        });
        return result;
      } catch (error) {
        console.error("MCP Tool Execution Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to execute MCP tool",
        });
      }
    }),

  getChatResponse: publicProcedure
    .input(
      z.object({
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
        openAIApiKey: z.string(),
        madkuduApiKey: z.string(),
      }),
    )
    .mutation(async ({ input }): Promise<ChatCompletionMessageParam> => {
      if (!input.openAIApiKey) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'OpenAI API key is not set.',
        });
      }

      if (!input.madkuduApiKey) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'MadKudu API key is not set.',
        });
      }

      const openai = new OpenAI({ apiKey: input.openAIApiKey });
      const mcpClient = await initializeMcpClient(input.madkuduApiKey);

      try {
        const mcpTools = (await mcpClient.listTools()).tools;

        const openAiTools = mcpTools.map((tool) => {
          return {
            type: "function" as const,
            function: {
              name: tool.name,
              description: tool.description ?? "",
              parameters: tool.inputSchema ?? {},
            },
          };
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: input.messages as ChatCompletionMessageParam[],
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

        // Check if the model wants to use tools
        if (responseMessage.tool_calls) {
          const toolMessages: ChatCompletionMessageParam[] = [];

          for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            let functionArgs: Record<string, unknown> = {};
            try {
              functionArgs = JSON.parse(toolCall.function.arguments);
            } catch (error) {
              toolMessages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: `Error: Invalid arguments provided. Expected a valid JSON object string.`,
              });
              continue;
            }

            try {
              const result: unknown = await mcpClient.callTool({
                name: functionName,
                arguments: functionArgs,
              });
              toolMessages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(result as any),
              });
            } catch (runError) {
              const errorMessage =
                runError instanceof Error ? runError.message : "Unknown error";
              toolMessages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: `Error: ${errorMessage}`,
              });
            }
          }

          // Make a second API call with the tool results
          const secondCompletion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              ...(input.messages as ChatCompletionMessageParam[]),
              responseMessage,
              ...toolMessages,
            ],
          });

          return (
            secondCompletion.choices[0]?.message ?? {
              role: "assistant",
              content: "Error: No response from OpenAI after tool call.",
            }
          );
        }

        // If no tool calls, return the direct response
        return responseMessage;
      } catch (error) {
        console.error("Chat completion error:", error);
        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get chat response: ${message}`,
        });
      }
    }),

  summarizeJson: publicProcedure
    .input(
      z.object({
        jsonContent: z.string(),
        openAIApiKey: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.openAIApiKey) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "OpenAI API key is not set.",
        });
      }

      const openai = new OpenAI({ apiKey: input.openAIApiKey });

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert at summarizing JSON data. Your goal is to provide a clear, concise, and human-readable summary of the provided JSON content in Markdown format.",
            },
            {
              role: "user",
              content: `Please summarize the following JSON data. Focus on extracting the most important information and presenting it in a well-structured Markdown document:\n\n\`\`\`json\n${input.jsonContent}\n\`\`\``,
            },
          ],
          temperature: 0.2,
        });

        const summary = completion.choices[0]?.message?.content;

        if (!summary) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No summary from OpenAI",
          });
        }

        return { summary };
      } catch (error) {
        console.error("JSON summarization error:", error);
        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to summarize JSON: ${message}`,
        });
      }
    }),
}); 