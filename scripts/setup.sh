#!/bin/bash

# JuliusOS Setup Script
# Automated setup for development environment

set -e

echo "================================"
echo "JuliusOS Setup Script"
echo "================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "⚠️  Rust is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

echo "✅ Rust found: $(rustc --version)"

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm found: $(pnpm --version)"

# Create Python virtual environments and install dependencies
echo ""
echo "📦 Installing Python dependencies..."
echo "  → API service..."
cd services/api
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ../..

echo "  → Agent service..."
cd services/agents
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ../..

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
cd apps/desktop
pnpm install
cd ../..

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Make sure Ollama is installed and running:"
echo "     → Download from: https://ollama.ai"
echo "     → Pull a model: ollama pull llama3:8b"
echo ""
echo "  2. Initialize the database:"
echo "     → make db"
echo ""
echo "  3. Load seed data:"
echo "     → make seed"
echo ""
echo "  4. Start the development servers:"
echo "     → make dev"
echo ""
