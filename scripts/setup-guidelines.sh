#!/bin/bash

# Setup script to apply development guidelines and configurations
# Run this script to set up all the recommended configurations

set -e

echo "🚀 Setting up development guidelines for Uptown Marketplace Frontend"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
  echo -e "${2}${1}${NC}"
}

print_step() {
  echo -e "${BLUE}📋 ${1}${NC}"
}

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
  print_status "❌ Error: package.json not found. Please run this script from the frontend directory." $RED
  exit 1
fi

print_step "Step 1: Setting up ESLint configuration"
if [ -f ".eslintrc.recommended.js" ]; then
  if [ ! -f ".eslintrc.js" ]; then
    cp .eslintrc.recommended.js .eslintrc.js
    print_status "✅ ESLint configuration applied" $GREEN
  else
    print_status "⚠️  .eslintrc.js already exists. Manual merge required." $YELLOW
    echo "   Compare with .eslintrc.recommended.js and merge manually."
  fi
else
  print_status "❌ .eslintrc.recommended.js not found" $RED
fi

# Set up .eslintignore if it doesn't exist
if [ -f ".eslintignore" ]; then
  print_status "✅ .eslintignore already exists" $GREEN
else
  print_status "⚠️  .eslintignore not found - template files may cause linting issues" $YELLOW
  echo "   Consider creating .eslintignore to exclude templates/ directory"
fi

print_step "Step 2: Setting up TypeScript strict configuration"
if [ -f "tsconfig.strict.json" ]; then
  print_status "✅ Strict TypeScript config available (tsconfig.strict.json)" $GREEN
  echo "   To use: Update your package.json scripts to use this config:"
  echo "   \"type-check\": \"tsc --noEmit --project tsconfig.strict.json\""
else
  print_status "❌ tsconfig.strict.json not found" $RED
fi

print_step "Step 3: Setting up VS Code configuration"
if [ -f ".vscode/settings.recommended.json" ]; then
  mkdir -p .vscode
  if [ ! -f ".vscode/settings.json" ]; then
    cp .vscode/settings.recommended.json .vscode/settings.json
    print_status "✅ VS Code settings applied" $GREEN
  else
    print_status "⚠️  .vscode/settings.json already exists. Manual merge required." $YELLOW
    echo "   Compare with .vscode/settings.recommended.json and merge manually."
  fi
else
  print_status "❌ .vscode/settings.recommended.json not found" $RED
fi

print_step "Step 4: Setting up pre-commit hooks"
if [ -f "scripts/pre-commit-checks.sh" ]; then
  chmod +x scripts/pre-commit-checks.sh
  print_status "✅ Pre-commit checks script made executable" $GREEN
  
  # Check if husky is installed
  if [ -d "node_modules/.bin" ] && [ -f "node_modules/.bin/husky" ]; then
    echo "Setting up husky pre-commit hook..."
    npx husky install
    npx husky add .husky/pre-commit "cd frontend && ./scripts/pre-commit-checks.sh"
    print_status "✅ Husky pre-commit hook installed" $GREEN
  else
    print_status "⚠️  Husky not found. Install with: npm install --save-dev husky" $YELLOW
  fi
else
  print_status "❌ scripts/pre-commit-checks.sh not found" $RED
fi

print_step "Step 5: Installing required dependencies"
echo "Checking for required packages..."

MISSING_PACKAGES=()

# Check for ESLint and TypeScript packages
REQUIRED_PACKAGES=(
  "@typescript-eslint/eslint-plugin"
  "@typescript-eslint/parser"
  "eslint"
  "typescript"
  "husky"
)

for package in "${REQUIRED_PACKAGES[@]}"; do
  if ! npm list "$package" > /dev/null 2>&1; then
    MISSING_PACKAGES+=("$package")
  fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
  print_status "⚠️  Missing packages detected. Installing..." $YELLOW
  npm install --save-dev "${MISSING_PACKAGES[@]}"
  print_status "✅ Missing packages installed" $GREEN
else
  print_status "✅ All required packages are installed" $GREEN
fi

print_step "Step 6: Updating package.json scripts"
# Check if package.json has the recommended scripts
RECOMMENDED_SCRIPTS=(
  "type-check"
  "lint"
  "lint:fix"
  "pre-commit"
)

echo "Checking package.json for recommended scripts..."
for script in "${RECOMMENDED_SCRIPTS[@]}"; do
  if grep -q "\"$script\":" package.json; then
    print_status "✅ $script script exists" $GREEN
  else
    print_status "⚠️  $script script missing" $YELLOW
  fi
done

print_step "Step 7: GitHub Actions setup"
if [ -f ".github/workflows/code-quality.yml" ]; then
  print_status "✅ GitHub Actions workflow ready" $GREEN
else
  print_status "⚠️  Create .github/workflows/ directory and copy code-quality.yml" $YELLOW
fi

print_step "Step 8: Running initial checks"
echo "Running type check..."
if npm run type-check > /dev/null 2>&1 || npx tsc --noEmit > /dev/null 2>&1; then
  print_status "✅ TypeScript compilation successful" $GREEN
else
  print_status "⚠️  TypeScript compilation has errors. Fix before proceeding." $YELLOW
fi

echo "Running linter..."
if npm run lint > /dev/null 2>&1 || npx eslint src --ext .ts,.tsx > /dev/null 2>&1; then
  print_status "✅ ESLint checks passed" $GREEN
else
  print_status "⚠️  ESLint found issues. Run 'npm run lint:fix' to auto-fix." $YELLOW
fi

echo ""
print_status "🎉 Setup complete!" $GREEN
echo ""
echo "📋 Next Steps:"
echo "1. Review DEVELOPMENT_GUIDELINES.md for detailed rules"
echo "2. Check templates/ directory for code templates"
echo "3. Update package.json scripts if needed:"
echo "   \"type-check\": \"tsc --noEmit\","
echo "   \"lint\": \"eslint src --ext .ts,.tsx\","
echo "   \"lint:fix\": \"eslint src --ext .ts,.tsx --fix\","
echo "   \"pre-commit\": \"./scripts/pre-commit-checks.sh\""
echo "4. Commit these changes to enable the guidelines for your team"
echo ""
echo "📖 Remember to follow the patterns in:"
echo "   - templates/service-template.ts for API services"
echo "   - templates/page-template.tsx for Next.js pages"
echo ""
print_status "Happy coding! 🚀" $GREEN