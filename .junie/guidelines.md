# Development Guidelines for Codevision Backend

This document provides essential information for developers working on the Codevision Backend project. It covers build instructions, testing procedures, and development best practices specific to this project.

## Build and Configuration Instructions

### Environment Setup

1. Make sure you have Node.js installed (the project uses TypeScript, Fastify, and Prisma)
2. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables by copying the example file:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your database credentials and other required settings.

### Database Setup

The project uses PostgreSQL with Prisma ORM:

1. Generate Prisma client:
   ```bash
   npm run prisma
   ```
2. To reset the database and open Prisma Studio for management:
   ```bash
   make db
   ```

### Building and Running

- **Development mode**:
  ```bash
  npm run dev
  ```

- **Production build**:
  ```bash
  npm run build
  npm run start
  ```
  
- **Quick build and run** (using Make):
  ```bash
  make run
  ```


## Testing Information

### Test Setup

The project uses Vitest for testing. Tests are configured to:
- Run sequentially (not in parallel)
- Use a Node.js environment
- Use database transactions that are automatically rolled back after each test

### Running Tests

- Run all tests:
  ```bash
  make test
  ```
  or
  ```bash
  vitest test
  ```

- Run specific tests:
  ```bash
  npx vitest run src/path/to/test.ts
  ```

- Run tests in watch mode:
  ```bash
  npx vitest watch
  ```

### Writing Tests

#### Test Structure

Tests are organized using Vitest's `describe` and `it` functions:

```typescript
import { describe, it, expect } from 'vitest'
import { yourFunction } from './your-module'

describe('Module Name', () => {
  describe('Function Name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'some input'
      
      // Act
      const result = yourFunction(input)
      
      // Assert
      expect(result).toBe('expected output')
    })
  })
})
```

#### Test Types

1. **Unit Tests**: Test individual functions or services in isolation
   - Located in the same directory as the code being tested
   - Named with `.test.ts` suffix

2. **Route Tests**: Test HTTP endpoints using Fastify's `inject` method
   - Test both response status codes and the actual data in the database

#### Test Data Factory

Use the test factory functions in `src/utils/test.factory.ts` to create test data:

```typescript
import { makeCustomer, makeOrder, makePosition } from '../../utils/test.factory'

// Create test data
const customer = await makeCustomer()
const order = await makeOrder(customer.id)
const position = await makePosition(order.id, { amount: 5 })
```

#### Example Test

Here's an example of a simple utility test:

```typescript
// src/utils/string-utils.test.ts
import { describe, it, expect } from 'vitest'
import { capitalizeWords } from './string-utils'

describe('String Utilities', () => {
  describe('capitalizeWords', () => {
    it('should capitalize the first letter of each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World')
    })
  })
})
```

## Code Style and Development Guidelines

### Project Structure

The project follows a feature-based structure:

- `src/modules/`: Contains feature modules (order, position, product, etc.)
  - Each module typically contains:
    - `*.routes.ts`: Fastify routes
    - `*.schema.ts`: Zod schemas for validation
    - `*.service.ts`: Business logic
    - `*.repo.ts`: Data access with Prisma (optional)
    - `*.test.ts`: Unit tests
- `src/plugins/`: Fastify plugins
- `src/utils/`: Utility functions
- `src/external/`: External system integrations

### Development Best Practices

1. **Separation of Concerns**:
   - Routes handle HTTP requests and responses
   - Schemas validate input and output
   - Services contain business logic
   - Repos handle data access (optional)

2. **Type Safety**:
   - Use TypeScript types for all parameters and return values
   - Leverage Prisma's generated types for database models

3. **Validation**:
   - Use Zod schemas in `*.schema.ts` files for request/response validation

4. **Testing**:
   - Write tests for all new functionality
   - Use the test factory functions for creating test data
   - Test both happy paths and edge cases

5. **Error Handling**:
   - Use proper error handling in services and routes
   - Return appropriate HTTP status codes

### Adding New Features

When adding a new feature:

1. Create a new module in `src/modules/` if needed
2. Follow the existing pattern of routes, schemas, services, and tests
3. Register the module in `src/modules/register-modules.ts`
4. Add appropriate tests
5. Update the Prisma schema if needed