# Development Guidelines Setup

This directory contains comprehensive development guidelines and configurations to prevent common TypeScript and Next.js errors in the Uptown Marketplace frontend.

## Quick Setup

```bash
# Make setup script executable and run it
chmod +x scripts/setup-guidelines.sh
./scripts/setup-guidelines.sh
```

## Files Created

### 📋 Main Guidelines

- **`DEVELOPMENT_GUIDELINES.md`** - Complete development rules and patterns
- **`GUIDELINES_README.md`** - This file (setup instructions)

### 🔧 Configuration Files

- **`.eslintrc.recommended.js`** - Strict ESLint rules to prevent errors
- **`tsconfig.strict.json`** - Enhanced TypeScript configuration
- **`.vscode/settings.recommended.json`** - VS Code settings for better DX

### 📝 Templates

- **`templates/service-template.ts`** - Template for API service files
- **`templates/page-template.tsx`** - Template for Next.js pages with useSearchParams

### 🤖 Automation

- **`scripts/pre-commit-checks.sh`** - Pre-commit validation script
- **`.github/workflows/code-quality.yml`** - GitHub Actions workflow

## What These Guidelines Prevent

### ✅ TypeScript Errors Fixed

1. **`error.response` property access on `unknown` type**
   - Solution: Always use `isAxiosError(error)` type guard

2. **Property access on `unknown` types**
   - Solution: Proper type checking and assertions

3. **Unsafe object key iteration**
   - Solution: Type-safe parameter building patterns

### ✅ Next.js Errors Fixed

1. **useSearchParams() CSR bailout errors**
   - Solution: Always wrap in `<Suspense>` boundary

2. **Missing loading states**
   - Solution: Proper loading components and error handling

## Manual Setup (if script fails)

### 1. ESLint Configuration

```bash
cp .eslintrc.recommended.js .eslintrc.js
```

### 2. TypeScript Configuration

```bash
# Update package.json scripts:
"type-check": "tsc --noEmit --project tsconfig.strict.json"
```

### 3. VS Code Settings

```bash
mkdir -p .vscode
cp .vscode/settings.recommended.json .vscode/settings.json
```

### 4. Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky

# Setup pre-commit hooks
chmod +x scripts/pre-commit-checks.sh
npx husky install
npx husky add .husky/pre-commit "cd frontend && ./scripts/pre-commit-checks.sh"
```

### 5. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "pre-commit": "./scripts/pre-commit-checks.sh"
  }
}
```

## Required Dependencies

Install these dev dependencies:

```bash
npm install --save-dev \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  typescript \
  husky
```

## Usage Examples

### ✅ Correct Error Handling Pattern

```typescript
import { isAxiosError } from 'axios';

try {
  const response = await api.get('/endpoint');
  // Handle response
} catch (error) {
  if (isAxiosError(error) && error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  throw new Error(error instanceof Error ? error.message : 'Unknown error');
}
```

### ✅ Correct useSearchParams Pattern

```typescript
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PageContent() {
  const searchParams = useSearchParams();
  // Component logic
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PageContent />
    </Suspense>
  );
}
```

## Code Review Checklist

Before submitting PRs, ensure:

- [ ] All `useSearchParams()` usage is wrapped in `<Suspense>`
- [ ] All API service methods import `isAxiosError` from axios
- [ ] All catch blocks use proper type guards
- [ ] No direct property access on `unknown` types
- [ ] TypeScript compilation passes without errors
- [ ] ESLint rules pass without errors

## VS Code Extensions

Install these recommended extensions:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Error Lens
- Tailwind CSS IntelliSense

## Troubleshooting

### TypeScript Errors

```bash
# Check types
npm run type-check

# Fix with strict config
npx tsc --noEmit --project tsconfig.strict.json
```

### ESLint Errors

```bash
# Check linting
npm run lint

# Auto-fix
npm run lint:fix
```

### Pre-commit Hook Issues

```bash
# Run checks manually
./scripts/pre-commit-checks.sh

# Reinstall husky
npx husky install
```

## Contributing

When adding new rules:

1. Update `DEVELOPMENT_GUIDELINES.md`
2. Add checks to `scripts/pre-commit-checks.sh`
3. Update `.eslintrc.recommended.js` if needed
4. Create examples in templates/
5. Update this README

## Support

For questions about these guidelines:

1. Check `DEVELOPMENT_GUIDELINES.md` for detailed explanations
2. Review templates/ for working examples
3. Run the pre-commit checks to identify specific issues

---

**Remember**: These guidelines exist to catch errors early and improve code reliability. Following them will save debugging time and prevent production issues.
