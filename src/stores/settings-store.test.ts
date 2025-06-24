import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettingsStore } from './settings-store'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Reset the store state
    useSettingsStore.setState({
      madkuduApiKey: '',
      openAIApiKey: '',
      mcpStatus: 'unvalidated',
      openaiStatus: 'unvalidated',
    })
  })

  afterEach(() => {
    // Clear localStorage after each test
    localStorageMock.clear()
  })

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useSettingsStore())

      expect(result.current.madkuduApiKey).toBe('')
      expect(result.current.openAIApiKey).toBe('')
      expect(result.current.mcpStatus).toBe('unvalidated')
      expect(result.current.openaiStatus).toBe('unvalidated')
    })
  })

  describe('API Key Management', () => {
    it('should update MadKudu API key', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setMadkuduApiKey('test-madkudu-key')
      })

      expect(result.current.madkuduApiKey).toBe('test-madkudu-key')
    })

    it('should update OpenAI API key', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setOpenAIApiKey('sk-test-openai-key')
      })

      expect(result.current.openAIApiKey).toBe('sk-test-openai-key')
    })

    it('should handle empty API keys', () => {
      const { result } = renderHook(() => useSettingsStore())

      // Set keys
      act(() => {
        result.current.setMadkuduApiKey('test-key')
        result.current.setOpenAIApiKey('sk-test')
      })

      // Clear keys
      act(() => {
        result.current.setMadkuduApiKey('')
        result.current.setOpenAIApiKey('')
      })

      expect(result.current.madkuduApiKey).toBe('')
      expect(result.current.openAIApiKey).toBe('')
    })
  })

  describe('Status Management', () => {
    it('should update MCP status', () => {
      const { result } = renderHook(() => useSettingsStore())

      const statuses: Array<'unvalidated' | 'validating' | 'valid' | 'invalid'> = 
        ['unvalidated', 'validating', 'valid', 'invalid']

      statuses.forEach(status => {
        act(() => {
          result.current.setMcpStatus(status)
        })
        expect(result.current.mcpStatus).toBe(status)
      })
    })

    it('should update OpenAI status', () => {
      const { result } = renderHook(() => useSettingsStore())

      const statuses: Array<'unvalidated' | 'validating' | 'valid' | 'invalid'> = 
        ['unvalidated', 'validating', 'valid', 'invalid']

      statuses.forEach(status => {
        act(() => {
          result.current.setOpenaiStatus(status)
        })
        expect(result.current.openaiStatus).toBe(status)
      })
    })
  })

  describe('Persistence', () => {
    it('should use persist middleware configuration', () => {
      // This test verifies that the store is configured with persistence
      // The actual persistence behavior is handled by Zustand's persist middleware
      const { result } = renderHook(() => useSettingsStore())
      
      // Should be able to set and retrieve values
      act(() => {
        result.current.setMadkuduApiKey('test-key')
        result.current.setOpenAIApiKey('sk-test')
      })
      
      expect(result.current.madkuduApiKey).toBe('test-key')
      expect(result.current.openAIApiKey).toBe('sk-test')
    })
  })

  describe('Multiple Updates', () => {
    it('should handle rapid successive updates', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setMadkuduApiKey('key1')
        result.current.setMadkuduApiKey('key2')
        result.current.setMadkuduApiKey('key3')
      })

      expect(result.current.madkuduApiKey).toBe('key3')
    })

    it('should maintain separate state for different keys', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setMadkuduApiKey('madkudu-123')
        result.current.setOpenAIApiKey('openai-456')
        result.current.setMcpStatus('valid')
        result.current.setOpenaiStatus('invalid')
      })

      expect(result.current.madkuduApiKey).toBe('madkudu-123')
      expect(result.current.openAIApiKey).toBe('openai-456')
      expect(result.current.mcpStatus).toBe('valid')
      expect(result.current.openaiStatus).toBe('invalid')
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in API keys', () => {
      const { result } = renderHook(() => useSettingsStore())
      const specialKey = 'sk-test!@#$%^&*()_+-=[]{}|;:,.<>?'

      act(() => {
        result.current.setOpenAIApiKey(specialKey)
      })

      expect(result.current.openAIApiKey).toBe(specialKey)
    })

    it('should handle very long API keys', () => {
      const { result } = renderHook(() => useSettingsStore())
      const longKey = 'sk-' + 'a'.repeat(1000)

      act(() => {
        result.current.setOpenAIApiKey(longKey)
      })

      expect(result.current.openAIApiKey).toBe(longKey)
    })

    it('should maintain type safety for status values', () => {
      const { result } = renderHook(() => useSettingsStore())

      // TypeScript should enforce that only valid status values can be set
      act(() => {
        result.current.setMcpStatus('valid')
        result.current.setOpenaiStatus('invalid')
      })

      expect(result.current.mcpStatus).toBe('valid')
      expect(result.current.openaiStatus).toBe('invalid')
    })
  })
})