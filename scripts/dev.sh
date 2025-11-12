#!/bin/bash

# Development script - starts all services

set -e

echo "🚀 Starting JuliusOS Development Environment..."
echo ""

# Trap to handle Ctrl+C and cleanup
trap 'kill $(jobs -p) 2>/dev/null; exit' INT TERM EXIT

# Start API server
echo "Starting API server on http://localhost:8000..."
cd services/api
source venv/bin/activate
python -m api.main &
API_PID=$!
cd ../..

# Wait a bit for API to start
sleep 2

# Start Agent service
echo "Starting Agent service on http://localhost:8001..."
cd services/agents
source venv/bin/activate
python -m agents.main &
AGENT_PID=$!
cd ../..

# Wait a bit for Agent service to start
sleep 2

# Start Tauri dev server
echo "Starting desktop app..."
cd apps/desktop
npm run tauri dev &
UI_PID=$!
cd ../..

echo ""
echo "✅ All services started!"
echo ""
echo "  → API: http://localhost:8000"
echo "  → Agent: http://localhost:8001"
echo "  → UI: Launching in Tauri window"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background jobs
wait
