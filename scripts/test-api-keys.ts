import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') });

const { MADKUDU_API_KEY, OPENAI_API_KEY } = process.env;

if (!MADKUDU_API_KEY || !OPENAI_API_KEY) {
  console.error('Error: MADKUDU_API_KEY and OPENAI_API_KEY must be set in .env file');
  process.exit(1);
}

type OpenAIResponse = {
  data?: Array<{ id: string }>;
  error?: {
    message: string;
  };
};

async function testMadKuduMCP(apiKey: string): Promise<boolean> {
  console.log('\nTesting MadKudu MCP...');
  
  const baseUrl = new URL(`https://mcp.madkudu.com/${apiKey}/mcp`);

  // Try modern transport first
  try {
    const client = new Client({
      name: 'madkudu-mcp-demo',
      version: '1.0.0'
    });
    
    console.log('Attempting Streamable HTTP connection...');
    const transport = new StreamableHTTPClientTransport(baseUrl);
    await client.connect(transport);
    console.log('✅ MadKudu MCP connected successfully (Streamable HTTP)');
    return true;
  } catch (error) {
    console.log('Streamable HTTP connection failed, trying SSE transport...');
    
    try {
      const client = new Client({
        name: 'madkudu-mcp-demo',
        version: '1.0.0'
      });
      
      const sseTransport = new SSEClientTransport(baseUrl);
      await client.connect(sseTransport);
      console.log('✅ MadKudu MCP connected successfully (SSE)');
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ MadKudu MCP connection failed:', error.message);
      } else {
        console.error('❌ MadKudu MCP connection failed:', String(error));
      }
      return false;
    }
  }
}

async function testOpenAIKey(apiKey: string) {
  console.log('\nTesting OpenAI API Key...');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await response.json() as OpenAIResponse;

    if (!response.ok || data.error) {
      throw new Error(data.error?.message ?? `HTTP Error ${response.status}`);
    }

    console.log('✅ OpenAI API Key is valid');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ OpenAI API Key validation failed:', error.message);
    } else {
      console.error('❌ OpenAI API Key validation failed:', String(error));
    }
    return false;
  }
}

async function main() {
  console.log('Testing API Keys...\n');
  
  // We already checked for undefined above, so we can safely use non-null assertion
  const mcpResult = await testMadKuduMCP(MADKUDU_API_KEY!);
  const openaiResult = await testOpenAIKey(OPENAI_API_KEY!);

  if (!mcpResult || !openaiResult) {
    console.error('\n❌ API Key validation failed');
    process.exit(1);
  }

  console.log('\n✅ All API Keys are valid');
}

main().catch(error => {
  if (error instanceof Error) {
    console.error('Unexpected error:', error.message);
  } else {
    console.error('Unexpected error:', String(error));
  }
  process.exit(1);
}); 