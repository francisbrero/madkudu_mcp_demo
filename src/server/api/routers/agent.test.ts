import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { agentRouter } from './agent'
import { createTRPCContext } from '~/server/api/trpc'
import { db } from '~/server/db'

// Mock the MCP client
vi.mock('~/server/api/mcp-client', () => ({
  initializeMcpClient: vi.fn().mockResolvedValue({
    listTools: vi.fn().mockResolvedValue({
      tools: [
        {
          name: 'mcp_MadAPI_company_info',
          description: 'Get information about a company',
          inputSchema: {
            type: 'object',
            properties: {
              company_name: { type: 'string' }
            }
          }
        },
        {
          name: 'mcp_MadAPI_person_info',
          description: 'Get information about a person',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string' }
            }
          }
        }
      ]
    }),
    callTool: vi.fn().mockResolvedValue({
      success: true,
      data: { company: 'Test Company', revenue: 1000000 }
    })
  })
}))

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                role: 'assistant',
                content: 'Based on the company information, Test Company has a revenue of $1M.'
              }
            }]
          })
        }
      }
    }))
  }
})

describe('agentRouter', () => {
  let caller: ReturnType<typeof agentRouter.createCaller>

  beforeEach(async () => {
    // Clear the database
    await db.agent.deleteMany()
    
    const ctx = await createTRPCContext({
      headers: new Headers(),
    })
    caller = agentRouter.createCaller(ctx)
  })

  afterEach(async () => {
    // Clean up after each test
    await db.agent.deleteMany()
  })

  describe('create', () => {
    it('should create a new agent', async () => {
      const input = {
        name: 'Sales Assistant',
        description: 'An AI assistant for sales teams',
        prompt: 'You are a helpful sales assistant that uses mcp_MadAPI_company_info to gather insights.'
      }

      const agent = await caller.create(input)

      expect(agent).toMatchObject({
        name: input.name,
        description: input.description,
        prompt: input.prompt
      })
      expect(agent.id).toBeDefined()
      expect(agent.createdAt).toBeInstanceOf(Date)
      expect(agent.updatedAt).toBeInstanceOf(Date)

      // Verify it was saved to the database
      const savedAgent = await db.agent.findUnique({ where: { id: agent.id } })
      expect(savedAgent).toBeDefined()
      expect(savedAgent?.name).toBe(input.name)
    })

    it('should fail with empty name', async () => {
      const input = {
        name: '',
        description: 'An AI assistant',
        prompt: 'You are helpful'
      }

      await expect(caller.create(input)).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should return empty array when no agents exist', async () => {
      const agents = await caller.list()
      expect(agents).toEqual([])
    })

    it('should return all agents ordered by creation date', async () => {
      // Create multiple agents
      const agent1 = await caller.create({
        name: 'Agent 1',
        description: 'First agent',
        prompt: 'Prompt 1'
      })

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const agent2 = await caller.create({
        name: 'Agent 2',
        description: 'Second agent',
        prompt: 'Prompt 2'
      })

      const agents = await caller.list()

      expect(agents).toHaveLength(2)
      expect(agents[0]?.id).toBe(agent2.id) // Most recent first
      expect(agents[1]?.id).toBe(agent1.id)
    })
  })

  describe('getById', () => {
    it('should return agent by id', async () => {
      const created = await caller.create({
        name: 'Test Agent',
        description: 'Test description',
        prompt: 'Test prompt'
      })

      const agent = await caller.getById({ id: created.id })

      expect(agent).toMatchObject({
        id: created.id,
        name: created.name,
        description: created.description,
        prompt: created.prompt
      })
    })

    it('should throw NOT_FOUND error for non-existent agent', async () => {
      await expect(
        caller.getById({ id: 'non-existent-id' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Agent not found'
      })
    })
  })

  describe('getAgentChatResponse', () => {
    it('should process chat without tool calls', async () => {
      // Create an agent without tool references
      const agent = await caller.create({
        name: 'Simple Chat Agent',
        description: 'A simple conversational agent',
        prompt: 'You are a helpful assistant.'
      })

      const response = await caller.getAgentChatResponse({
        agentId: agent.id,
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        openAIApiKey: process.env.OPENAI_API_KEY ?? 'test-key',
        madkuduApiKey: 'test-madkudu-key',
        model: 'gpt-4o-mini'
      })

      expect(response.role).toBe('assistant')
      expect(response.content).toBeTruthy()
    })

    it('should handle tool calls when tools are mentioned in prompt', async () => {
      // Create an agent with tool references
      const agent = await caller.create({
        name: 'Sales Research Agent',
        description: 'An agent that researches companies',
        prompt: 'You are a sales research assistant. Use mcp_MadAPI_company_info to gather company insights.'
      })

      // Mock OpenAI to return a tool call
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
                  arguments: JSON.stringify({ company_name: 'Acme Corp' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Based on the data, Acme Corp has a revenue of $1M.'
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

      const response = await caller.getAgentChatResponse({
        agentId: agent.id,
        messages: [
          { role: 'user', content: 'Tell me about Acme Corp' }
        ],
        openAIApiKey: process.env.OPENAI_API_KEY ?? 'test-key',
        madkuduApiKey: 'test-madkudu-key',
        model: 'gpt-4o-mini'
      })

      expect(response.role).toBe('assistant')
      expect(response.content).toContain('Acme Corp')
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it('should throw error for non-existent agent', async () => {
      await expect(
        caller.getAgentChatResponse({
          agentId: 'non-existent-id',
          messages: [{ role: 'user', content: 'Hello' }],
          openAIApiKey: 'test-key',
          madkuduApiKey: 'test-madkudu-key',
          model: 'gpt-4o-mini'
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Agent not found'
      })
    })
  })
})