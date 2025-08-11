#!/bin/bash

# Pre-commit checks to enforce development guidelines
# Make this file executable: chmod +x scripts/pre-commit-checks.sh

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${2}${1}${NC}"
}

# Check 1: TypeScript compilation
echo "📝 Checking TypeScript compilation..."
if npx tsc --noEmit; then
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

# Check 3: Check for useSearchParams without Suspense
echo "🔄 Checking for useSearchParams without Suspense..."
if grep -r "useSearchParams" src/app --include="*.tsx" | grep -v "Suspense"; then
  # Check if the files using useSearchParams have Suspense
  FILES_WITH_SEARCH_PARAMS=$(grep -l "useSearchParams" src/app/**/*.tsx 2>/dev/null || true)
  
  if [ ! -z "$FILES_WITH_SEARCH_PARAMS" ]; then
    for file in $FILES_WITH_SEARCH_PARAMS; do
      if ! grep -q "Suspense" "$file"; then
        print_status "❌ Found useSearchParams without Suspense in $file" $RED
        echo "Please wrap useSearchParams usage in Suspense boundary."
        exit 1
      fi
    done
  fi
fi
print_status "✅ useSearchParams Suspense check passed" $GREEN

# Check 4: Check for error.response without isAxiosError
echo "🚨 Checking for unsafe error.response usage..."
if grep -r "error\.response" src/services --include="*.ts" | grep -v "isAxiosError"; then
  FILES_WITH_ERROR_RESPONSE=$(grep -l "error\.response" src/services/**/*.ts 2>/dev/null || true)
  
  if [ ! -z "$FILES_WITH_ERROR_RESPONSE" ]; then
    for file in $FILES_WITH_ERROR_RESPONSE; do
      if grep -q "error\.response" "$file" && ! grep -q "isAxiosError" "$file"; then
        print_status "❌ Found unsafe error.response usage in $file" $RED
        echo "Please import and use isAxiosError before accessing error.response."
        exit 1
      fi
    done
  fi
fi
print_status "✅ Error handling check passed" $GREEN

# Check 5: Check for missing isAxiosError import in service files
echo "📦 Checking for missing isAxiosError imports..."
SERVICE_FILES=$(find src/services -name "*.ts" -not -name "*.d.ts" 2>/dev/null || true)

if [ ! -z "$SERVICE_FILES" ]; then
  for file in $SERVICE_FILES; do
    if grep -q "catch.*error" "$file" && ! grep -q "import.*isAxiosError" "$file"; then
      print_status "⚠️  Missing isAxiosError import in $file" $YELLOW
      echo "Consider importing isAxiosError from axios for proper error handling."
    fi
  done
fi

# Check 6: Check for any type usage
echo "🔍 Checking for 'any' type usage..."
ANY_USAGE=$(grep -r ": any\|<any>" src --include="*.ts" --include="*.tsx" | grep -v "// @ts-ignore" | grep -v "templates/" || true)

if [ ! -z "$ANY_USAGE" ]; then
  print_status "⚠️  Found 'any' type usage:" $YELLOW
  echo "$ANY_USAGE"
  echo "Consider using specific types instead of 'any' for better type safety."
fi

# Check 7: Format Check
echo "💅 Checking code formatting..."
if npm run format:check; then
  print_status "✅ Code formatting check passed" $GREEN
else
  print_status "❌ Code formatting check failed" $RED
  echo "Please run 'npm run format' to fix formatting issues before committing."
  exit 1
fi

# Check 8: Run tests if they exist
if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
  echo "🧪 Running tests..."
  if npm test -- --passWithNoTests --watchAll=false; then
    print_status "✅ Tests passed" $GREEN
  else
    print_status "❌ Tests failed" $RED
    echo "Please fix failing tests before committing."
    exit 1
  fi
fi

print_status "🎉 All pre-commit checks passed!" $GREEN
echo "Ready to commit! 🚀"