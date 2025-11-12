#!/bin/sh
# Post-installation script for julios-agent

echo "Installing Python dependencies..."
pip3 install -r /julios/services/agents/requirements.txt

echo "Checking Ollama installation..."
if command -v ollama >/dev/null 2>&1; then
    echo "✓ Ollama found"

    # Pull default model if not present
    ollama list | grep -q llama3 || {
        echo "Pulling llama3:8b model (this may take a while)..."
        ollama pull llama3:8b
    }
else
    echo "⚠ Ollama not found!"
    echo "  Install from: https://ollama.ai"
    echo "  Or run: curl https://ollama.ai/install.sh | sh"
fi

echo "Creating julios user if not exists..."
id -u julios &>/dev/null || useradd -r -s /bin/false julios

echo "Setting permissions..."
chown -R julios:julios /julios/services/agents

echo "✓ julios-agent installed successfully"
echo "  Requires: Ollama running on localhost:11434"
echo "  Start with: juinit start julios-agent"
echo "  Test with: ask 'Hello, what can you do?'"
