.PHONY: help setup db seed dev test package clean

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "JuliusOS - Local-first Life Operating System"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Install all dependencies
	@echo "🔧 Setting up JuliusOS..."
	@echo "Installing Python dependencies..."
	cd services/api && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	cd services/agents && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	@echo "Installing Node.js dependencies..."
	cd apps/desktop && pnpm install || npm install
	@echo "Copying environment file..."
	cp .env.example .env
	@echo "✅ Setup complete!"

db: ## Run database migrations
	@echo "🗄️  Running database migrations..."
	cd services/api && . venv/bin/activate && alembic upgrade head
	@echo "✅ Migrations complete!"

seed: ## Load seed data
	@echo "🌱 Loading seed data..."
	cd services/api && . venv/bin/activate && cd ../../infra/seed && python seed_data.py
	@echo "✅ Seed data loaded!"

dev: ## Start all services in development mode
	@echo "🚀 Starting JuliusOS in development mode..."
	@echo "Starting API server on port 8000..."
	@cd services/api && . venv/bin/activate && PYTHONPATH=. uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
	@echo "Starting Agent service on port 8001..."
	@cd services/agents && . venv/bin/activate && PYTHONPATH=. uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
	@echo "Starting Tauri desktop app..."
	@cd apps/desktop && npm run tauri dev
	@echo "✅ All services started!"

dev-api: ## Start only the API server
	@echo "🚀 Starting API server..."
	cd services/api && . venv/bin/activate && PYTHONPATH=. uvicorn main:app --host 0.0.0.0 --port 8000 --reload

dev-agent: ## Start only the Agent service
	@echo "🚀 Starting Agent service..."
	cd services/agents && . venv/bin/activate && PYTHONPATH=. uvicorn main:app --host 0.0.0.0 --port 8001 --reload

dev-ui: ## Start only the UI
	@echo "🚀 Starting desktop app..."
	cd apps/desktop && npm run dev

run: ## Start services and launch mode selector
	@echo "🚀 Starting JuliusOS..."
	@nohup make dev-api > /tmp/api.log 2>&1 & \
	nohup make dev-agent > /tmp/agent.log 2>&1 & \
	sleep 3 && \
	python3 /home/julius/juliusos/opt/julios/mode-selector/mode-selector.py

test: ## Run all tests
	@echo "🧪 Running tests..."
	cd services/api && . venv/bin/activate && pytest tests/
	cd services/agents && . venv/bin/activate && pytest tests/
	@echo "✅ All tests passed!"

test-api: ## Run API tests
	@echo "🧪 Running API tests..."
	cd services/api && . venv/bin/activate && pytest tests/

test-agents: ## Run agent tests
	@echo "🧪 Running agent tests..."
	cd services/agents && . venv/bin/activate && pytest tests/

package: ## Build production app
	@echo "📦 Building production app..."
	cd apps/desktop && npm run build
	cd apps/desktop && npm run tauri build
	@echo "✅ Build complete! Check apps/desktop/src-tauri/target/release/"

clean: ## Clean build artifacts
	@echo "🧹 Cleaning..."
	rm -rf services/api/venv
	rm -rf services/agents/venv
	rm -rf apps/desktop/node_modules
	rm -rf apps/desktop/dist
	rm -rf apps/desktop/src-tauri/target
	rm -f juliusos.db juliusos.db-shm juliusos.db-wal
	@echo "✅ Clean complete!"

check-ollama: ## Check if Ollama is running
	@echo "🔍 Checking Ollama status..."
	@curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama is running" || echo "❌ Ollama is not running. Please start Ollama first."

install-deps-ubuntu: ## Install system dependencies on Ubuntu
	@echo "📦 Installing system dependencies for Ubuntu..."
	sudo apt-get update
	sudo apt-get install -y python3 python3-pip python3-venv nodejs npm curl build-essential libssl-dev pkg-config
	sudo npm install -g pnpm
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	@echo "✅ System dependencies installed!"

install-deps-mac: ## Install system dependencies on macOS
	@echo "📦 Installing system dependencies for macOS..."
	brew install python3 node pnpm rust
	@echo "✅ System dependencies installed!"

# ============================================
# OS Distribution Build Targets
# ============================================

build-distro: build-juinit build-jupm build-jush ## Build all OS distribution components
	@echo "✅ All distro components built!"

build-juinit: ## Build juinit init system
	@echo "🔨 Building juinit..."
	cd distro/juinit && cargo build --release
	@echo "✅ juinit built at distro/juinit/target/release/juinit"

build-jupm: ## Build jupm package manager
	@echo "🔨 Building jupm..."
	cd distro/jupm && cargo build --release
	@echo "✅ jupm built at distro/jupm/target/release/jupm"

build-jush: ## Build jush shell
	@echo "🔨 Building jush..."
	cd distro/jush && cargo build --release
	@echo "✅ jush built at distro/jush/target/release/jush"

test-distro: ## Test OS distribution components
	@echo "🧪 Testing distro components..."
	cd distro/juinit && cargo test
	cd distro/jupm && cargo test
	cd distro/jush && cargo test
	@echo "✅ All distro tests passed!"

clean-distro: ## Clean OS distribution build artifacts
	@echo "🧹 Cleaning distro builds..."
	rm -rf distro/juinit/target
	rm -rf distro/jupm/target
	rm -rf distro/jush/target
	@echo "✅ Distro clean complete!"

iso: ## Create bootable ISO (not yet implemented)
	@echo "📀 Creating bootable ISO..."
	@echo "❌ ISO creation not yet implemented"
	@echo "   This will create a bootable JuliOS ISO image"

test-vm: ## Test in QEMU (not yet implemented)
	@echo "🖥️  Testing in QEMU..."
	@echo "❌ VM testing not yet implemented"
	@echo "   This will boot JuliOS in QEMU for testing"

# ============================================
# Showcase OS Targets
# ============================================

mode-selector: ## Launch the JuliOS Mode Selector
	@echo "🚀 Launching JuliOS Mode Selector..."
	@python3 opt/julios/mode-selector/mode-selector.py

showcase: mode-selector ## Alias for mode-selector
