# Test Suite Documentation

This project uses Vitest for unit and integration testing. The test suite includes comprehensive coverage for tRPC routers, MCP client functionality, API integrations, and Zustand stores.

## Setup

1. **Install dependencies** (if not already done):
   ```bash
   pnpm install
   ```

2. **Configure test environment**:
   Create a `.env.test` file in the root directory with your API keys:
   ```env
   # Test Environment Variables
   DATABASE_URL="file:./prisma/test.db"
   OPENAI_API_KEY="your-openai-api-key-here"
   MADKUDU_API_KEY="your-madkudu-api-key-here"
   ```

   ⚠️ **Important**: Replace the placeholder API keys with real ones for integration tests to work properly.

## Running Tests

### Run all tests:
```bash
pnpm test
```

### Run tests in watch mode:
```bash
pnpm test
```

### Run tests with UI:
```bash
pnpm test:ui
```

### Run tests with coverage:
```bash
pnpm test:coverage
```

## Test Structure

### Unit Tests
- **`src/server/api/routers/agent.test.ts`**: Tests for agent CRUD operations and chat functionality
- **`src/server/api/routers/mcp.test.ts`**: Tests for MCP tool discovery, execution, and chat integration
- **`src/stores/settings-store.test.ts`**: Tests for Zustand store state management and persistence

### Integration Tests
- **`src/server/api/mcp-client.integration.test.ts`**: Tests MCP client with real API calls
- **`src/server/api/routers/api.integration.test.ts`**: End-to-end tests for API endpoints with real services

## Test Categories

### 1. Agent Router Tests
- Creating, listing, and retrieving agents
- Agent-based chat with and without MCP tools
- Error handling for invalid agents

### 2. MCP Router Tests
- API key validation (MadKudu and OpenAI)
- Tool discovery and listing
- Tool execution with parameters
- Chat completion with tool integration
- JSON summarization

### 3. MCP Client Integration Tests
- Real connection to MadKudu MCP server
- Tool listing and execution
- Concurrent requests and rate limiting
- Error handling and validation

### 4. API Integration Tests
- Full end-to-end chat flows
- Multi-turn conversations
- Tool usage in real scenarios
- Error handling with invalid keys

### 5. Settings Store Tests
- State management for API keys
- Status tracking for validations
- localStorage persistence
- Edge cases and type safety

## Environment Considerations

### Test Database
- Tests use a separate SQLite database at `./prisma/test.db`
- Database is automatically created before tests and cleaned up after
- Each test suite clears relevant data to ensure isolation

### API Keys
- Integration tests require valid API keys in `.env.test`
- Tests that require API keys are automatically skipped if keys are not provided
- Unit tests use mocked API calls and don't require real keys

### Browser Environment
- Tests run in Happy DOM environment for React components
- localStorage is mocked for persistence tests
- Network requests in integration tests run in Node.js environment

## Common Issues and Solutions

### Issue: Integration tests are skipped
**Solution**: Ensure you have valid API keys in `.env.test`

### Issue: CORS errors in tests
**Solution**: This is expected when running MCP client tests in the test environment. The real application runs these on the server where CORS is not an issue.

### Issue: Database errors
**Solution**: Try deleting `./prisma/test.db` and running tests again. The database will be recreated.

### Issue: Test timeout
**Solution**: Some integration tests may take longer with real API calls. You can increase timeout in specific tests:
```typescript
it('should handle complex operations', async () => {
  // test code
}, { timeout: 10000 }) // 10 seconds
```

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('Component/Function Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = myFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### Integration Test Template
```typescript
import { describe, it, expect } from 'vitest'

const skipIfNoKeys = process.env.API_KEY ? it : it.skip

describe('Integration Test', () => {
  skipIfNoKeys('should work with real API', async () => {
    // Make real API call
    const result = await realApiCall()
    
    // Assert real response
    expect(result).toBeDefined()
  })
})
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Mocking**: Use mocks for external dependencies in unit tests
3. **Real Calls**: Integration tests should make real API calls for confidence
4. **Cleanup**: Always clean up test data after tests
5. **Descriptive Names**: Use clear, descriptive test names
6. **Error Cases**: Test both success and failure scenarios
7. **Skip Gracefully**: Skip tests that require unavailable resources rather than failing

## Continuous Integration

To run tests in CI:
1. Set up environment variables as secrets
2. Run `pnpm install`
3. Run `pnpm test:coverage`
4. Optionally upload coverage reports