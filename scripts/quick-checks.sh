#!/bin/bash

# Quick pre-commit checks (without full build) for faster development workflow
# Make this file executable: chmod +x scripts/quick-checks.sh

set -e

echo "⚡ Running quick pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${2}${1}${NC}"
}

# Check 1: TypeScript compilation (fast check)
echo "📝 Checking TypeScript compilation (quick)..."
if npx tsc --noEmit --skipLibCheck; then
  print_status "✅ TypeScript compilation passed" $GREEN
else
  print_status "❌ TypeScript compilation failed" $RED
  echo "Please fix TypeScript errors before committing."
  exit 1
fi

# Check 2: ESLint (comprehensive check with zero warnings tolerance)
echo "🔍 Running ESLint with zero warnings tolerance..."
if npx eslint . --ext .ts,.tsx --max-warnings 0; then
  print_status "✅ ESLint checks passed" $GREEN
else
  print_status "❌ ESLint checks failed (warnings treated as errors)" $RED
  echo "Please fix all ESLint warnings and errors before committing."
  echo "Run 'npm run lint:fix' to automatically fix some issues."
  exit 1
fi

# Check 3: Format Check
echo "💅 Checking code formatting..."
if npm run format:check; then
  print_status "✅ Code formatting check passed" $GREEN
else
  print_status "❌ Code formatting check failed" $RED
  echo "Please run 'npm run format' to fix formatting issues before committing."
  exit 1
fi

print_status "⚡ Quick checks completed successfully!" $GREEN
echo "🎯 Ready for commit (full pre-commit hook will run additional checks)"