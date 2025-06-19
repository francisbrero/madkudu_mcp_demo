import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { initializeMcpClient, clearMcpClient } from "../mcp-client";

interface MCPResponse {
  success: boolean;
  error?: string;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: boolean;
    $schema: string;
  };
}

interface MCPToolsResponse {
  tools: MCPTool[];
}

interface MCPToolResult {
  result: unknown;
}

// Zod schema for tool validation
const toolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.object({
    type: z.string(),
    properties: z.record(z.unknown()),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean(),
    $schema: z.string()
  })
});

// Zod schema for tools response
const toolsResponseSchema = z.object({
  tools: z.array(toolSchema)
});

export const mcpRouter = createTRPCRouter({
  validateKey: publicProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }): Promise<MCPResponse> => {
      try {
        // Clear any existing client
        clearMcpClient();
        
        // Try to initialize MCP client
        await initializeMcpClient(input.apiKey);
        return { success: true };
      } catch (error) {
        console.error("MCP Validation Error:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to connect to MCP server' 
        };
      }
    }),

  getTools: publicProcedure
    .query(async (): Promise<MCPToolsResponse> => {
      // Get API key from environment variable
      const apiKey = process.env.MADKUDU_API_KEY;
      if (!apiKey) {
        throw new Error('MADKUDU_API_KEY environment variable is not set');
      }

      // Initialize client if needed
      const client = await initializeMcpClient(apiKey);
      const rawTools = await client.listTools();
      
      // Parse and validate the response
      const parsed = toolsResponseSchema.parse(rawTools);
      
      // Return the tools directly since the format matches our interface
      return parsed;
    }),

  runTool: publicProcedure
    .input(z.object({
      name: z.string(),
      arguments: z.record(z.unknown())
    }))
    .mutation(async ({ input }): Promise<MCPToolResult> => {
      // Get API key from environment variable
      const apiKey = process.env.MADKUDU_API_KEY;
      if (!apiKey) {
        throw new Error('MADKUDU_API_KEY environment variable is not set');
      }

      // Initialize client if needed
      const client = await initializeMcpClient(apiKey);
      const result = await client.callTool({
        name: input.name,
        arguments: input.arguments
      });
      
      return { result };
    }),
}); 