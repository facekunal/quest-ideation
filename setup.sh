#!/bin/bash
set -e  # Exit on any error

echo "🚀 Setting up quest-ideation project..."

# Check Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

echo "✓ Node.js $(node --version) found"

# Check pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found, installing globally..."
    npm install -g pnpm
fi

echo "✓ pnpm $(pnpm --version) found"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --silent

# Verify .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   The application requires a .env file with Snag API credentials"
    if [ -f .env.example ]; then
        echo "   You can copy .env.example to .env and configure it"
    fi
else
    echo "✓ .env file found"
fi

# Run TypeScript type checking
echo "🔍 Checking TypeScript types..."
pnpm run type-check --silent

echo "✅ Setup complete! Project is ready for development."
echo ""
echo "Available commands:"
echo "  pnpm run dev     - Start development server"
echo "  pnpm run build   - Build for production"
echo "  pnpm start       - Run production server"
