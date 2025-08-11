# Frontend Coding Standards & Best Practices

## 🎯 Overview
This document outlines the coding standards and best practices for the Uptown Marketplace frontend to prevent common errors and maintain code quality.

## 📋 Pre-Development Checklist

Before starting any new feature:
1. Run `npm run type-check` to ensure no existing type errors
2. Run `npm run lint` to check for linting issues
3. Pull latest changes from main branch
4. Create a feature branch with descriptive name

## 🔒 TypeScript Best Practices

### 1. **Never Use `any` Type**
```typescript
// ❌ Bad
const data: any = await fetchData();

// ✅ Good
interface DataResponse {
  id: string;
  name: string;
  // ... other properties
}
const data: DataResponse = await fetchData();
```

### 2. **Define Interfaces for All API Responses**
```typescript
// Create separate interfaces for backend (snake_case) and frontend (camelCase)
interface BackendUserResponse {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface User {
  userId: string;
  firstName: string;
  lastName: string;
}

// Map between them explicitly
const mapUser = (backend: BackendUserResponse): User => ({
  userId: backend.user_id,
  firstName: backend.first_name,
  lastName: backend.last_name,
});
```

### 3. **Avoid Unused Variables**
```typescript
// ❌ Bad
const [user, setUser] = useState();
// user is never used

// ✅ Good - Remove if not needed
// Or prefix with underscore if intentionally unused
const [_user, setUser] = useState();
```

## ⚛️ React & Hooks Best Practices

### 1. **Declare Functions Before Using in Hooks**
```typescript
// ❌ Bad - Using function before declaration
const Component = () => {
  useEffect(() => {
    loadData();
  }, [loadData]); // Error: loadData used before declaration
  
  const loadData = useCallback(() => {
    // ...
  }, []);
};

// ✅ Good - Declare before use
const Component = () => {
  const loadData = useCallback(() => {
    // ...
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
};
```

### 2. **Handle useEffect Dependencies Properly**
```typescript
// ✅ Option 1: Include all dependencies
const loadData = useCallback(async () => {
  // fetch data
}, [dependency1, dependency2]);

useEffect(() => {
  loadData();
}, [loadData]);

// ✅ Option 2: Use eslint-disable when intentional
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Intentionally run once on mount
```

### 3. **Wrap Functions in useCallback When Used as Dependencies**
```typescript
// ❌ Bad
const handleClick = () => {
  console.log('clicked');
};

useEffect(() => {
  // This will cause infinite re-renders
}, [handleClick]);

// ✅ Good
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

useEffect(() => {
  // Now stable reference
}, [handleClick]);
```

## 🖼️ Next.js Specific Rules

### 1. **Always Use Next.js Image Component**
```typescript
// ❌ Bad
<img src="/logo.png" alt="Logo" />

// ✅ Good
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

### 2. **Use Proper Imports for Client Components**
```typescript
// Always add 'use client' directive for client-side components
'use client';

import { useState } from 'react';
// ... rest of component
```

## 📦 Import/Export Best Practices

### 1. **No Anonymous Default Exports**
```typescript
// ❌ Bad
export default new MyService();

// ✅ Good
const myService = new MyService();
export default myService;
```

### 2. **Use Named Exports for Better Tree Shaking**
```typescript
// ✅ Preferred
export const userService = new UserService();
export const authService = new AuthService();

// Import specific services
import { userService } from '@/services';
```

## 🧹 Code Quality Rules

### 1. **Console Logs**
- Remove all `console.log` before committing
- Use `console.warn` or `console.error` for important messages
- Use proper logging service in production

### 2. **Error Handling**
```typescript
// ✅ Always handle errors properly
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Failed to fetch data:', error);
  toast.error('Failed to load data');
  // Set error state if needed
  setError(error instanceof Error ? error.message : 'An error occurred');
}
```

### 3. **Loading States**
```typescript
// ✅ Always show loading states
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await api.getData();
    setData(data);
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

## 🔧 Development Workflow

### Before Committing Code

1. **Run Type Check**
   ```bash
   npm run type-check
   ```

2. **Run Linting**
   ```bash
   npm run lint
   # Auto-fix issues
   npm run lint:fix
   ```

3. **Format Code**
   ```bash
   npm run format
   ```

4. **Build Check**
   ```bash
   npm run build
   ```

### Useful Commands

- `npm run dev` - Start development server
- `npm run lint:fix` - Auto-fix linting issues
- `npm run type-check:watch` - Watch for type errors
- `npm run format` - Format all files with Prettier
- `npm run clean` - Clean build cache
- `npm run analyze` - Analyze bundle size

## 🚫 Common Pitfalls to Avoid

1. **Using `any` type** - Always define proper types
2. **Missing error handling** - Always use try-catch for async operations
3. **Unused imports/variables** - Remove before committing
4. **Functions used before declaration** - Declare functions before using them
5. **Missing dependencies in hooks** - Include all or use eslint-disable intentionally
6. **Anonymous default exports** - Always name your exports
7. **Using `<img>` instead of Next.js `<Image>`** - Use Next.js Image component
8. **Console.logs in production code** - Remove or use proper logging

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Hooks Rules](https://react.dev/reference/react/hooks#rules-of-hooks)
- [Next.js Documentation](https://nextjs.org/docs)
- [ESLint Rules](https://eslint.org/docs/rules/)

## 🤝 Contributing

1. Follow all standards outlined in this document
2. Run pre-commit checks: `npm run pre-commit`
3. Write meaningful commit messages
4. Request code review from team members
5. Update this document if you identify new patterns to avoid

---

*Last Updated: [Current Date]*
*Version: 1.0.0*