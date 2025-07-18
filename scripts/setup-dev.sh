#!/bin/bash

# Development setup script for Aivello project
# This script sets up the development environment

set -e

echo "🚀 Setting up Aivello development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your actual API keys"
fi

# Run type checking
echo "🔍 Running type check..."
npm run type-check

# Run linting
echo "🧹 Running linter..."
npm run lint

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate || echo "⚠️  Some vulnerabilities found. Check manually."

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.local with your API keys"
echo "2. Run 'npm start' to start development server"
echo "3. Open http://localhost:3000 in your browser"
