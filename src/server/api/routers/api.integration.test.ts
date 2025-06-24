import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { agentRouter } from './agent'
import { mcpRouter } from './mcp'
import { createTRPCContext } from '~/server/api/trpc'
import { db } from '~/server/db'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load test environment
dotenv.config({ path: resolve(process.cwd(), '.env.test') })

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const MADKUDU_API_KEY = process.env.MADKUDU_API_KEY

// Skip tests if API keys are not provided
const skipIfNoKeys = OPENAI_API_KEY && MADKUDU_API_KEY ? it : it.skip

describe('API Integration Tests with Real Calls', () => {
  let agentCaller: ReturnType<typeof agentRouter.createCaller>
  let mcpCaller: ReturnType<typeof mcpRouter.createCaller>

  beforeAll(() => {
    if (!OPENAI_API_KEY || !MADKUDU_API_KEY) {
      console.warn('⚠️  Skipping API integration tests: API keys not found in .env.test')
    }
  })

  beforeEach(async () => {
    await db.agent.deleteMany()
    const ctx = await createTRPCContext({ headers: new Headers() })
    agentCaller = agentRouter.createCaller(ctx)
    mcpCaller = mcpRouter.createCaller(ctx)
  })

  describe('MCP Router Integration', () => {
    skipIfNoKeys('should validate real MadKudu API key', async () => {
      const result = await mcpCaller.validateKey({ apiKey: MADKUDU_API_KEY! })
      expect(result.success).toBe(true)
    })

    skipIfNoKeys('should validate real OpenAI API key', async () => {
      const result = await mcpCaller.validateOpenAIKey({ apiKey: OPENAI_API_KEY! })
      expect(result.success).toBe(true)
    })

    skipIfNoKeys('should get real MCP tools', async () => {
      const tools = await mcpCaller.getTools({ apiKey: MADKUDU_API_KEY! })
      
      expect(tools).toBeDefined()
      expect(Array.isArray(tools)).toBe(true)
      expect(tools.length).toBeGreaterThan(0)
      
      // Verify tool structure
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name')
        expect(tool).toHaveProperty('description')
        expect(typeof tool.name).toBe('string')
      })
    })

    skipIfNoKeys('should execute real MCP tool', async () => {
      // First get available tools
      const tools = await mcpCaller.getTools({ apiKey: MADKUDU_API_KEY! })
      const companyTool = tools.find(t => 
        t.name.toLowerCase().includes('company')
      )
      
      if (!companyTool) {
        console.warn('Company tool not found')
        return
      }

      const result = await mcpCaller.runTool({
        apiKey: MADKUDU_API_KEY!,
        toolId: companyTool.name,
        params: { company_name: 'Salesforce' }
      })
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    skipIfNoKeys('should handle real chat completion without tools', async () => {
      const response = await mcpCaller.getChatResponse({
        messages: [
          { role: 'user', content: 'What is 2+2?' }
        ],
        openAIApiKey: OPENAI_API_KEY!,
        madkuduApiKey: MADKUDU_API_KEY!,
        model: 'gpt-4o-mini'
      })
      
      expect(response.role).toBe('assistant')
      expect(response.content).toBeTruthy()
      expect(typeof response.content === 'string' ? response.content : '').toMatch(/4|four/i)
    })

    skipIfNoKeys('should handle real chat completion with MCP tools', async () => {
      const response = await mcpCaller.getChatResponse({
        messages: [
          { 
            role: 'user', 
            content: 'Can you look up information about Google company using the available tools?' 
          }
        ],
        openAIApiKey: OPENAI_API_KEY!,
        madkuduApiKey: MADKUDU_API_KEY!,
        model: 'gpt-4o-mini'
      })
      
      expect(response.role).toBe('assistant')
      expect(response.content).toBeTruthy()
      // Should contain information about Google
      expect(typeof response.content === 'string' ? response.content.toLowerCase() : '').toContain('google')
    }, 30000) // 30 second timeout for this test

    skipIfNoKeys('should summarize JSON with real OpenAI', async () => {
      const testData = {
        company: 'Test Corp',
        revenue: 5000000,
        employees: 100,
        founded: 2020,
        products: ['Product A', 'Product B']
      }

      const result = await mcpCaller.summarizeJson({
        jsonContent: JSON.stringify(testData),
        openAIApiKey: OPENAI_API_KEY!
      })
      
      expect(result.summary).toBeTruthy()
      expect(result.summary).toContain('Test Corp')
      expect(result.summary.length).toBeGreaterThan(50)
    })
  })

  describe('Agent Router Integration', () => {
    skipIfNoKeys('should create agent and use it for real chat', async () => {
      // Create an agent with MCP tool references
      const agent = await agentCaller.create({
        name: 'Company Research Agent',
        description: 'Researches company information',
        prompt: `You are a company research assistant. When asked about companies, 
                use the mcp_MadAPI_company_info tool to get detailed information. 
                Always provide comprehensive insights based on the data retrieved.`
      })

      // Use the agent for a real chat
      const response = await agentCaller.getAgentChatResponse({
        agentId: agent.id,
        messages: [
          { role: 'user', content: 'Tell me about Amazon company' }
        ],
        openAIApiKey: OPENAI_API_KEY!,
        madkuduApiKey: MADKUDU_API_KEY!,
        model: 'gpt-4o-mini'
      })

      expect(response.role).toBe('assistant')
      expect(response.content).toBeTruthy()
      expect(typeof response.content === 'string' ? response.content.toLowerCase() : '').toContain('amazon')
    })

    skipIfNoKeys('should handle agent without tools in real chat', async () => {
      // Create a simple conversational agent
      const agent = await agentCaller.create({
        name: 'Simple Assistant',
        description: 'A helpful assistant',
        prompt: 'You are a helpful, friendly assistant. Answer questions concisely.'
      })

      const response = await agentCaller.getAgentChatResponse({
        agentId: agent.id,
        messages: [
          { role: 'user', content: 'What is the capital of France?' }
        ],
        openAIApiKey: OPENAI_API_KEY!,
        madkuduApiKey: MADKUDU_API_KEY!,
        model: 'gpt-4o-mini'
      })

      expect(response.role).toBe('assistant')
      expect(response.content).toBeTruthy()
      expect(typeof response.content === 'string' ? response.content.toLowerCase() : '').toContain('paris')
    })

    skipIfNoKeys('should handle multi-turn conversation with tools', async () => {
      const agent = await agentCaller.create({
        name: 'Sales Intelligence Agent',
        description: 'Provides sales intelligence',
        prompt: `You are a sales intelligence assistant. Use mcp_MadAPI_company_info 
                to gather company data when needed. Be conversational and helpful.`
      })

      // First message
      const response1 = await agentCaller.getAgentChatResponse({
        agentId: agent.id,
        messages: [
          { role: 'user', content: 'Hi, I need help researching a potential client.' }
        ],
        openAIApiKey: OPENAI_API_KEY!,
        madkuduApiKey: MADKUDU_API_KEY!,
        model: 'gpt-4o-mini'
      })

      expect(response1.content).toBeTruthy()

      // Follow-up with specific company request
      const response2 = await agentCaller.getAgentChatResponse({
        agentId: agent.id,
        messages: [
          { role: 'user', content: 'Hi, I need help researching a potential client.' },
          { role: response1.role as 'assistant', content: typeof response1.content === 'string' ? response1.content : '' },
          { role: 'user', content: 'Can you look up information about Microsoft?' }
        ],
        openAIApiKey: OPENAI_API_KEY!,
        madkuduApiKey: MADKUDU_API_KEY!,
        model: 'gpt-4o-mini'
      })

      expect(response2.content).toBeTruthy()
      expect(typeof response2.content === 'string' ? response2.content.toLowerCase() : '').toContain('microsoft')
    })
  })

  describe('Error Handling with Real APIs', () => {
    it('should handle invalid API keys gracefully', async () => {
      await expect(
        mcpCaller.getChatResponse({
          messages: [{ role: 'user', content: 'Test' }],
          openAIApiKey: 'invalid-key',
          madkuduApiKey: MADKUDU_API_KEY ?? 'test',
          model: 'gpt-4o-mini'
        })
      ).rejects.toThrow()
    })

    skipIfNoKeys('should handle malformed tool arguments', async () => {
      const tools = await mcpCaller.getTools({ apiKey: MADKUDU_API_KEY! })
      const tool = tools[0]
      
      if (!tool) return

      // Call with intentionally wrong parameters
      await expect(
        mcpCaller.runTool({
          apiKey: MADKUDU_API_KEY!,
          toolId: tool.name,
          params: { wrong_param: 'value' }
        })
      ).rejects.toThrow()
    })
  })
})