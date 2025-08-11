#!/bin/bash

# Setup script for Git hooks
# Run this script to ensure pre-commit hooks are properly configured

set -e

echo "🔧 Setting up Git hooks for frontend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${2}${1}${NC}"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  print_status "❌ Not in a git repository root directory" $RED
  echo "Please run this script from the frontend directory (where .git folder exists)"
  exit 1
fi

# Check if we have the hooks directory
if [ ! -d ".git/hooks" ]; then
  print_status "❌ Git hooks directory not found" $RED
  echo "Something is wrong with your git repository"
  exit 1
fi

# Make sure our scripts exist and are executable
print_status "📋 Checking pre-commit scripts..." $BLUE

if [ ! -f "scripts/pre-commit-checks.sh" ]; then
  print_status "❌ Pre-commit checks script not found" $RED
  echo "Expected: scripts/pre-commit-checks.sh"
  exit 1
fi

if [ ! -f "scripts/quick-checks.sh" ]; then
  print_status "❌ Quick checks script not found" $RED
  echo "Expected: scripts/quick-checks.sh"
  exit 1
fi

# Make scripts executable
print_status "🔧 Making scripts executable..." $BLUE
chmod +x scripts/pre-commit-checks.sh
chmod +x scripts/quick-checks.sh

# Create/update the pre-commit hook
print_status "⚙️  Installing pre-commit hook..." $BLUE

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook to run lint and build checks
# This hook prevents commits if there are lint/build errors

set -e

echo "🔄 Running pre-commit hook..."

# Change to the frontend directory (in case hook is called from parent directory)
cd "$(git rev-parse --show-toplevel)"

# Check if we're in the frontend directory, if not, find it
if [ ! -f "package.json" ]; then
  if [ -d "frontend" ]; then
    cd frontend
  else
    echo "❌ Could not find frontend directory or package.json"
    exit 1
  fi
fi

echo "📍 Working directory: $(pwd)"

# Check if the pre-commit checks script exists
if [ ! -f "scripts/pre-commit-checks.sh" ]; then
  echo "❌ Pre-commit checks script not found at scripts/pre-commit-checks.sh"
  exit 1
fi

# Make sure the script is executable
chmod +x scripts/pre-commit-checks.sh

# Run the pre-commit checks
echo "🚀 Running pre-commit checks..."
./scripts/pre-commit-checks.sh

# If we get here, all checks passed
echo "✅ Pre-commit hook completed successfully"
echo "📦 Proceeding with commit..."

exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

print_status "✅ Pre-commit hook installed successfully" $GREEN

# Test the setup
print_status "🧪 Testing hook setup..." $BLUE

if [ -x .git/hooks/pre-commit ]; then
  print_status "✅ Pre-commit hook is executable" $GREEN
else
  print_status "❌ Pre-commit hook is not executable" $RED
  exit 1
fi

if [ -x scripts/pre-commit-checks.sh ]; then
  print_status "✅ Pre-commit checks script is executable" $GREEN
else
  print_status "❌ Pre-commit checks script is not executable" $RED
  exit 1
fi

if [ -x scripts/quick-checks.sh ]; then
  print_status "✅ Quick checks script is executable" $GREEN
else
  print_status "❌ Quick checks script is not executable" $RED
  exit 1
fi

print_status "🎉 Git hooks setup completed successfully!" $GREEN
echo ""
print_status "📖 Next steps:" $BLUE
echo "  • Your commits will now be automatically checked for:"
echo "    - TypeScript compilation errors"
echo "    - ESLint errors and warnings"  
echo "    - Code formatting issues"
echo "    - Custom code pattern violations"
echo "    - Test failures"
echo ""
echo "  • Run 'npm run pre-commit:quick' to test before committing"
echo "  • See GIT_HOOKS_GUIDE.md for more details"
echo ""
print_status "⚡ Happy coding!" $GREEN