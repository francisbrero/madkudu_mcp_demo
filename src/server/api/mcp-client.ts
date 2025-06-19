import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

let mcpClient: Client | null = null;

export function clearMcpClient(): void {
  mcpClient = null;
}

export async function initializeMcpClient(apiKey: string): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  const baseUrl = new URL(`https://mcp.madkudu.com/${apiKey}/mcp`);
  const client = new Client({
    name: 'madkudu-mcp-demo',
    version: '1.0.0'
  });

  try {
    // Try modern transport first
    const transport = new StreamableHTTPClientTransport(baseUrl);
    await client.connect(transport);
    console.log('✅ MadKudu MCP connected successfully (Streamable HTTP)');
    mcpClient = client;
    return client;
  } catch {
    // Fallback to SSE transport
    console.log('Streamable HTTP connection failed, trying SSE transport...');
    
    try {
      const sseTransport = new SSEClientTransport(baseUrl);
      await client.connect(sseTransport);
      console.log('✅ MadKudu MCP connected successfully (SSE)');
      mcpClient = client;
      return client;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('❌ Failed to connect to MadKudu MCP:', message);
      throw new Error('Failed to connect to MadKudu MCP');
    }
  }
}

export function getMcpClient(): Client {
  if (!mcpClient) {
    throw new Error('MCP client not initialized');
  }
  return mcpClient;
} 