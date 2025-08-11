# Git Hooks Guide

This project has Git pre-commit hooks configured to ensure code quality by blocking commits with lint or build errors.

## What happens when you commit?

When you run `git commit`, the pre-commit hook will automatically:

1. ✅ **TypeScript Compilation Check** - Ensures all TypeScript code compiles without errors
2. ✅ **ESLint Check** - Runs linting with zero tolerance for warnings (treats warnings as errors)
3. ✅ **Code Format Check** - Ensures consistent code formatting with Prettier
4. ✅ **Custom Rule Checks** - Validates project-specific code patterns
5. ✅ **Tests** - Runs the test suite (if tests exist)

## If your commit is blocked

If the pre-commit hook blocks your commit, you'll see clear error messages about what needs to be fixed.

### Quick fixes:

```bash
# Fix lint issues automatically
npm run lint:fix

# Fix formatting issues automatically
npm run format

# Check TypeScript issues
npm run type-check

# Run all checks manually (before committing)
npm run pre-commit:full

# Run quick checks (faster, skips some slower checks)
npm run pre-commit:quick
```

## Manual Testing

You can run the same checks manually before committing:

```bash
# Run the full pre-commit check suite
./scripts/pre-commit-checks.sh

# Or use npm script
npm run pre-commit:full

# For faster development workflow
npm run pre-commit:quick
```

## Bypassing the hook (NOT RECOMMENDED)

⚠️ **Only use in emergencies** - this bypasses all quality checks:

```bash
git commit --no-verify -m "Emergency commit message"
```

## Hook Configuration

The pre-commit hook is located at:

- `.git/hooks/pre-commit` - The Git hook itself
- `scripts/pre-commit-checks.sh` - The comprehensive check script
- `scripts/quick-checks.sh` - A faster version for development

## Benefits

✅ **Prevents broken code** from entering the repository
✅ **Maintains consistent code quality** across the team  
✅ **Catches errors early** before they reach CI/CD
✅ **Enforces coding standards** automatically
✅ **Reduces review time** by ensuring basic quality

## Troubleshooting

### "Permission denied" errors

```bash
chmod +x scripts/pre-commit-checks.sh
chmod +x scripts/quick-checks.sh
chmod +x .git/hooks/pre-commit
```

### "Command not found" errors

Make sure you're in the frontend directory and have run `npm install`.

### Hook not running

Check if the hook file exists and is executable:

```bash
ls -la .git/hooks/pre-commit
```

If it doesn't exist, the hook setup may have failed. Contact the team for help.
