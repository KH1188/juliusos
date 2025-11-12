#!/bin/sh
# Post-installation script for julios-api

echo "Installing Python dependencies..."
pip3 install -r /julios/services/api/requirements.txt

echo "Setting up database..."
cd /julios/services/api
python3 -m alembic upgrade head || echo "Database migration will run on first start"

echo "Creating julios user if not exists..."
id -u julios &>/dev/null || useradd -r -s /bin/false julios

echo "Setting permissions..."
chown -R julios:julios /julios/data
chmod 755 /julios/services/api

echo "✓ julios-api installed successfully"
echo "  Start with: juinit start julios-api"
echo "  API will be available at: http://localhost:8000"
