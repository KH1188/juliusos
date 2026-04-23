// API Client for JuliOS - connects to FastAPI backend

class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:8000';
        this.agentURL = 'http://localhost:8001';
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (response.ok) {
                this.updateStatus('api-status', '🟢 API Connected');
            } else {
                this.updateStatus('api-status', '🔴 API Error');
            }
        } catch (error) {
            this.updateStatus('api-status', '🔴 API Offline');
        }

        try {
            const response = await fetch(`${this.agentURL}/health`);
            if (response.ok) {
                this.updateStatus('agent-status', '🟢 Agent Ready');
            } else {
                this.updateStatus('agent-status', '🔴 Agent Error');
            }
        } catch (error) {
            this.updateStatus('agent-status', '🔴 Agent Offline');
        }
    }

    updateStatus(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = text;
    }

    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    async post(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    async runAgent(recipeName, params = {}) {
        const response = await fetch(`${this.agentURL}/recipes/${recipeName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 1, params })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    // Specific API methods
    async getTasks() {
        return await this.get('/tasks');
    }

    async createTask(task) {
        return await this.post('/tasks', task);
    }

    async getHabits() {
        return await this.get('/habits');
    }

    async getJournalEntries() {
        return await this.get('/journal');
    }

    async createJournalEntry(entry) {
        return await this.post('/journal', entry);
    }

    async getMeals() {
        return await this.get('/meals');
    }

    async getProjects() {
        return await this.get('/projects');
    }

    async getNotes() {
        return await this.get('/notes');
    }

    async getSettings() {
        return await this.get('/settings/1');
    }
}

const api = new APIClient();
