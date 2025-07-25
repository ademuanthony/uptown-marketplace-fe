# Development Guidelines

This document outlines coding standards, patterns, and rules to prevent common errors and maintain code quality in the Uptown Marketplace frontend.

## Table of Contents

1. [TypeScript Error Handling](#typescript-error-handling)
2. [Next.js Development Rules](#nextjs-development-rules)
3. [API Service Patterns](#api-service-patterns)
4. [Code Review Checklist](#code-review-checklist)
5. [ESLint Configuration](#eslint-configuration)

## TypeScript Error Handling

### Rule 1: Always Use Type Guards for Error Handling

❌ **Bad:**
```typescript
catch (error) {
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
}
```

✅ **Good:**
```typescript
import { isAxiosError } from 'axios';

catch (error) {
  if (isAxiosError(error) && error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  throw new Error(error instanceof Error ? error.message : 'Unknown error');
}
```

### Rule 2: Always Import isAxiosError for API Services

**Required imports for all service files:**
```typescript
import { isAxiosError } from 'axios';
```

### Rule 3: Proper Error Type Handling

❌ **Bad:**
```typescript
catch (error: unknown) {
  console.error('Error:', error.message); // Error: Property 'message' does not exist
}
```

✅ **Good:**
```typescript
catch (error: unknown) {
  console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
}
```

### Rule 4: Type Assertions Must Be Safe

❌ **Bad:**
```typescript
const data = response.data as MyType;
data.someProperty; // Could be undefined
```

✅ **Good:**
```typescript
const data = response.data as MyType;
if (data && typeof data === 'object' && 'someProperty' in data) {
  data.someProperty;
}
```

### Rule 5: Always Handle API Response Structure

```typescript
// Standard API response handling pattern
if (!response.data || !response.data.success || !response.data.data) {
  throw new Error(response.data?.error || response.data?.message || 'API request failed');
}
```

## Next.js Development Rules

### Rule 1: Always Wrap useSearchParams in Suspense

❌ **Bad:**
```typescript
export default function MyPage() {
  const searchParams = useSearchParams(); // Will cause CSR bailout error
  // ... component logic
}
```

✅ **Good:**
```typescript
import { Suspense } from 'react';

function PageContent() {
  const searchParams = useSearchParams();
  // ... component logic
}

export default function MyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PageContent />
    </Suspense>
  );
}
```

### Rule 2: Always Create Loading Components for Suspense

```typescript
// Create consistent loading components
const PageLoading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);
```

### Rule 3: Use Dynamic Imports for Client-Only Components

```typescript
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
);
```

## API Service Patterns

### Rule 1: Consistent Service Structure

```typescript
import api from './api';
import { isAxiosError } from 'axios';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class MyService {
  async myMethod(): Promise<MyType> {
    try {
      const response = await api.get<ApiResponse<MyType>>('/endpoint');
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Request failed');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('My method error:', error);
      
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
```

### Rule 2: Handle Different Error Types

```typescript
catch (error) {
  console.error('Operation error:', error);
  
  // Handle Axios errors
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      // Handle auth errors
      throw new Error('Authentication required');
    }
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
  }
  
  // Handle generic errors
  throw new Error(error instanceof Error ? error.message : 'Operation failed');
}
```

### Rule 3: Type-Safe URL Parameter Building

❌ **Bad:**
```typescript
Object.keys(filters).forEach(key => {
  if (filters[key]) params.append(key, filters[key]); // Type error
});
```

✅ **Good:**
```typescript
(Object.keys(filters) as Array<keyof typeof filters>).forEach(key => {
  const value = filters[key];
  if (value !== undefined && value !== null) {
    params.append(key, String(value));
  }
});
```

## Code Review Checklist

### Before Submitting PR

- [ ] All `useSearchParams()` usage is wrapped in `<Suspense>`
- [ ] All API service methods import `isAxiosError` from axios
- [ ] All catch blocks use proper type guards
- [ ] No direct property access on `unknown` types
- [ ] All API responses follow the standard error handling pattern
- [ ] TypeScript compilation passes without errors
- [ ] ESLint rules pass without errors

### Specific Checks

#### Error Handling
- [ ] `isAxiosError(error)` before accessing `error.response`
- [ ] Fallback error messages for all catch blocks
- [ ] Proper type checking with `instanceof Error`

#### Next.js Patterns
- [ ] Client components use `'use client'` directive
- [ ] Dynamic imports for SSR-incompatible components
- [ ] Proper loading states for async operations

#### Type Safety
- [ ] No `any` types without justification
- [ ] Type assertions are safe and necessary
- [ ] Interface definitions match API contracts

## ESLint Configuration

Add these rules to your `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    // Prevent accessing properties on unknown types
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    
    // Require proper error handling
    '@typescript-eslint/no-throw-literal': 'error',
    
    // Prevent improper type assertions
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }
    ],
    
    // Require proper async/await usage
    '@typescript-eslint/await-thenable': 'error',
    
    // Custom rules for our patterns
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['src/services/**/*.ts'],
      rules: {
        // Require axios error handling import
        'import/no-unresolved': ['error', { ignore: ['axios'] }],
      }
    }
  ]
};
```

## Pre-commit Hooks

Set up pre-commit hooks in `package.json`:

```json
{
  "scripts": {
    "pre-commit": "npm run type-check && npm run lint && npm run test",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx --fix",
    "test": "jest --passWithNoTests"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run pre-commit"
    }
  }
}
```

## VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "typescript.preferences.strictFunctionTypes": true,
  "typescript.preferences.strictNullChecks": true,
  "typescript.preferences.strictPropertyInitialization": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

## Common Patterns Quick Reference

### Error Handling Template
```typescript
try {
  // API call
} catch (error) {
  console.error('Operation error:', error);
  
  if (isAxiosError(error) && error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  
  throw new Error(error instanceof Error ? error.message : 'Operation failed');
}
```

### Suspense Template
```typescript
function Content() {
  const searchParams = useSearchParams();
  // Component logic
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}
```

### Type-Safe Filter Building
```typescript
const processedFilters = { ...filters };
(Object.keys(processedFilters) as Array<keyof typeof processedFilters>).forEach(key => {
  const value = processedFilters[key];
  if (value !== undefined && value !== null) {
    params.append(key, String(value));
  }
});
```

---

**Remember**: These rules exist to prevent runtime errors and improve code reliability. Always prefer explicit type checking over assumptions about data structure.