import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { initializeMcpClient, clearMcpClient } from "../mcp-client";

type OpenAIErrorResponse = {
  error?: {
    message: string;
  };
};

export const mcpRouter = createTRPCRouter({
  validateKey: publicProcedure
    .input(z.object({ 
      apiKey: z.string().min(1),
      openaiApiKey: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      try {
        // Clear any existing client
        clearMcpClient();
        
        // Attempt to initialize MCP client
        await initializeMcpClient(input.apiKey);

        // Now validate OpenAI API Key
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${input.openaiApiKey}`
          }
        });

        if (!openaiResponse.ok) {
          const openaiData = await openaiResponse.json() as OpenAIErrorResponse;
          return { success: false, error: `Invalid OpenAI API Key: ${openaiData.error?.message ?? openaiResponse.statusText}` };
        }

        return { success: true };
      } catch (error) {
        console.error("Validation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { 
          success: false, 
          error: errorMessage.includes('HTTP 400') ? 
            'Invalid MadKudu API Key: The provided key is not valid or has insufficient permissions' : 
            errorMessage 
        };
      }
    }),

  getTools: publicProcedure
    .query(async () => {
      const client = await initializeMcpClient(process.env.MADKUDU_API_KEY!);
      return client.listTools();
    }),

  runTool: publicProcedure
    .input(z.object({
      name: z.string(),
      arguments: z.record(z.unknown())
    }))
    .mutation(async ({ input }) => {
      const client = await initializeMcpClient(process.env.MADKUDU_API_KEY!);
      return client.callTool(input);
    })
}); 