import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

let mcpClient: Client | undefined;

export async function initializeMcpClient(apiKey: string): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  const baseUrl = new URL(`https://mcp.madkudu.com/${apiKey}/mcp`);
  
  // Try modern transport first
  try {
    mcpClient = new Client({
      name: 'madkudu-mcp-demo',
      version: '1.0.0'
    });
    const transport = new StreamableHTTPClientTransport(baseUrl);
    await mcpClient.connect(transport);
    return mcpClient;
  } catch (error) {
    // If modern transport fails, try legacy SSE transport
    mcpClient = new Client({
      name: 'madkudu-mcp-demo',
      version: '1.0.0'
    });
    const sseTransport = new SSEClientTransport(baseUrl);
    await mcpClient.connect(sseTransport);
    return mcpClient;
  }
}

export function getMcpClient(): Client | undefined {
  return mcpClient;
}

export function clearMcpClient(): void {
  mcpClient = undefined;
} 