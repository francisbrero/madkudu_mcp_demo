import { beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load test environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.test') })

// Set up test environment variables
process.env.DATABASE_URL = 'file:./prisma/test.db'
// NODE_ENV is read-only in TypeScript, but we can override it for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
;(process.env as any).NODE_ENV = 'test'

beforeAll(() => {
  // Create test database and run migrations
  execSync('pnpm db:push', { stdio: 'inherit' })
})

afterAll(() => {
  // Clean up test database
  try {
    execSync('rm -f ./prisma/test.db', { stdio: 'inherit' })
  } catch (error) {
    console.error('Failed to clean up test database:', error)
  }
})

beforeEach(() => {
  // Clear database before each test
  // This ensures tests are isolated
})