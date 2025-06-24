import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mcpRouter } from './mcp'
import { createTRPCContext } from '~/server/api/trpc'
import { TRPCError } from '@trpc/server'

// Create mock MCP client
const mockMcpClient = {
  listTools: vi.fn(),
  callTool: vi.fn()
}

// Mock the MCP client module
vi.mock('~/server/api/mcp-client', () => ({
  initializeMcpClient: vi.fn(() => Promise.resolve(mockMcpClient)),
  clearMcpClient: vi.fn()
}))

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  }
})

// Mock fetch for OpenAI key validation
global.fetch = vi.fn()

describe('mcpRouter', () => {
  let caller: ReturnType<typeof mcpRouter.createCaller>

  beforeEach(async () => {
    vi.clearAllMocks()
    const ctx = await createTRPCContext({
      headers: new Headers(),
    })
    caller = mcpRouter.createCaller(ctx)
    
    // Reset mock implementations
    mockMcpClient.listTools.mockResolvedValue({
      tools: [
        {
          name: 'mcp_MadAPI_company_info',
          description: 'Get company information',
          inputSchema: {
            type: 'object',
            properties: {
              company_name: { type: 'string', description: 'Name of the company' }
            },
            required: ['company_name']
          }
        },
        {
          name: 'mcp_MadAPI_person_info',
          description: 'Get person information',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Email of the person' }
            },
            required: ['email']
          }
        }
      ]
    })
  })

  describe('validateKey', () => {
    it('should validate a valid MadKudu API key', async () => {
      const result = await caller.validateKey({ apiKey: 'test-valid-key' })
      expect(result.success).toBe(true)
    })

    it('should handle invalid MadKudu API key', async () => {
      const { initializeMcpClient } = await import('~/server/api/mcp-client')
      vi.mocked(initializeMcpClient).mockRejectedValueOnce(new Error('Invalid API key'))

      const result = await caller.validateKey({ apiKey: 'invalid-key' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })
  })

  describe('validateOpenAIKey', () => {
    it('should validate a valid OpenAI API key', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      } as Response)

      const result = await caller.validateOpenAIKey({ apiKey: 'sk-valid-key' })
      expect(result.success).toBe(true)
    })

    it('should handle invalid OpenAI API key', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      } as Response)

      const result = await caller.validateOpenAIKey({ apiKey: 'invalid-key' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
    })
  })

  describe('getTools', () => {
    it('should return sorted list of tools', async () => {
      const tools = await caller.getTools({ apiKey: 'test-key' })
      
      expect(tools).toHaveLength(2)
      expect(tools[0]).toMatchObject({
        name: 'mcp_MadAPI_company_info',
        description: 'Get company information'
      })
      expect(tools[1]).toMatchObject({
        name: 'mcp_MadAPI_person_info',
        description: 'Get person information'
      })
    })

    it('should handle MCP client errors', async () => {
      mockMcpClient.listTools.mockRejectedValueOnce(new Error('MCP connection failed'))

      await expect(
        caller.getTools({ apiKey: 'test-key' })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('runTool', () => {
    it('should execute MCP tool successfully', async () => {
      const mockResult = {
        company: 'Acme Corp',
        revenue: 5000000,
        employees: 50
      }
      mockMcpClient.callTool.mockResolvedValueOnce(mockResult)

      const result = await caller.runTool({
        apiKey: 'test-key',
        toolId: 'mcp_MadAPI_company_info',
        params: { company_name: 'Acme Corp' }
      })

      expect(result).toEqual(mockResult)
      expect(mockMcpClient.callTool).toHaveBeenCalledWith({
        name: 'mcp_MadAPI_company_info',
        arguments: { company_name: 'Acme Corp' }
      })
    })

    it('should handle tool execution errors', async () => {
      mockMcpClient.callTool.mockRejectedValueOnce(new Error('Tool execution failed'))

      await expect(
        caller.runTool({
          apiKey: 'test-key',
          toolId: 'mcp_MadAPI_company_info',
          params: { company_name: 'Invalid Corp' }
        })
      ).rejects.toThrow('Tool execution failed')
    })
  })

  describe('getChatResponse', () => {
    it('should handle chat without tool calls', async () => {
      const OpenAI = (await import('openai')).default
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
          }
        }]
      })

      vi.mocked(OpenAI).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }) as unknown as InstanceType<typeof OpenAI>)

      const response = await caller.getChatResponse({
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        openAIApiKey: 'sk-test',
        madkuduApiKey: 'mk-test',
        model: 'gpt-4o-mini'
      })

      expect(response.role).toBe('assistant')
      expect(response.content).toBe('Hello! How can I help you today?')
    })

    it('should handle chat with tool calls', async () => {
      const OpenAI = (await import('openai')).default
      const mockCreate = vi.fn()
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'mcp_MadAPI_company_info',
                  arguments: JSON.stringify({ company_name: 'TechCorp' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: 'TechCorp is a technology company with 100 employees and $10M in revenue.'
            }
          }]
        })

      vi.mocked(OpenAI).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }) as unknown as InstanceType<typeof OpenAI>)

      mockMcpClient.callTool.mockResolvedValueOnce({
        company: 'TechCorp',
        employees: 100,
        revenue: 10000000
      })

      const response = await caller.getChatResponse({
        messages: [
          { role: 'user', content: 'Tell me about TechCorp' }
        ],
        openAIApiKey: 'sk-test',
        madkuduApiKey: 'mk-test',
        model: 'gpt-4o-mini'
      })

      expect(response.role).toBe('assistant')
      expect(response.content).toContain('TechCorp')
      expect(mockCreate).toHaveBeenCalledTimes(2)
      expect(mockMcpClient.callTool).toHaveBeenCalledWith({
        name: 'mcp_MadAPI_company_info',
        arguments: { company_name: 'TechCorp' }
      })
    })

    it('should throw error when API keys are missing', async () => {
      await expect(
        caller.getChatResponse({
          messages: [{ role: 'user', content: 'Hello' }],
          openAIApiKey: '',
          madkuduApiKey: 'mk-test',
          model: 'gpt-4o-mini'
        })
      ).rejects.toThrow('OpenAI API key is not set')

      await expect(
        caller.getChatResponse({
          messages: [{ role: 'user', content: 'Hello' }],
          openAIApiKey: 'sk-test',
          madkuduApiKey: '',
          model: 'gpt-4o-mini'
        })
      ).rejects.toThrow('MadKudu API key is not set')
    })
  })

  describe('summarizeJson', () => {
    it('should summarize JSON content', async () => {
      const OpenAI = (await import('openai')).default
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: {
            content: '## Summary\n\nThis JSON contains company data for Acme Corp.'
          }
        }]
      })

      vi.mocked(OpenAI).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }) as unknown as InstanceType<typeof OpenAI>)

      const result = await caller.summarizeJson({
        jsonContent: JSON.stringify({ company: 'Acme Corp', revenue: 1000000 }),
        openAIApiKey: 'sk-test'
      })

      expect(result.summary).toContain('Acme Corp')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.2
        })
      )
    })

    it('should throw error when OpenAI key is missing', async () => {
      await expect(
        caller.summarizeJson({
          jsonContent: '{"test": "data"}',
          openAIApiKey: ''
        })
      ).rejects.toThrow('OpenAI API key is not set')
    })
  })
})