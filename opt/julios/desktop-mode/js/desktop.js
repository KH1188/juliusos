// JuliOS Desktop - Main application logic

console.log('🚀 JuliOS Desktop starting...');
console.log('Window Manager:', typeof wm !== 'undefined' ? 'loaded' : 'NOT LOADED');
console.log('API Client:', typeof api !== 'undefined' ? 'loaded' : 'NOT LOADED');

// Update clock
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('clock').textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// Load visitor count
function loadVisitorCount() {
    // Read from localStorage or default to 1
    let count = parseInt(localStorage.getItem('julios_visitors') || '1');
    document.getElementById('visitor-count').textContent = `Visitor #${count}`;
}
loadVisitorCount();

// Desktop icon click handlers
console.log('Setting up desktop icon handlers...');
const icons = document.querySelectorAll('.desktop-icon');
console.log('Found', icons.length, 'desktop icons');

icons.forEach(icon => {
    icon.addEventListener('dblclick', () => {
        const app = icon.dataset.app;
        console.log('Double-clicked app:', app);
        openApp(app);
    });

    // Single click to select
    icon.addEventListener('click', (e) => {
        console.log('Clicked icon:', icon.dataset.app);
        if (!e.detail || e.detail === 1) {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        }
    });
});

console.log('✅ Desktop icons setup complete');

// App launchers
async function openApp(appName) {
    console.log(`Opening ${appName}...`);

    switch(appName) {
        case 'daily-digest':
            await openDailyDigest();
            break;
        case 'chat':
            openChatAssistant();
            break;
        case 'tasks':
            await openTasks();
            break;
        case 'habits':
            await openHabits();
            break;
        case 'journal':
            await openJournal();
            break;
        case 'health':
            openHealth();
            break;
        case 'bible':
            openBibleStudy();
            break;
        case 'finances':
            openFinances();
            break;
        case 'projects':
            await openProjects();
            break;
        case 'notes':
            await openNotes();
            break;
        case 'settings':
            openSettings();
            break;
        case 'terminal':
            openTerminal();
            break;
        case 'files':
            openFileManager();
            break;
        case 'calculator':
            openCalculator();
            break;
        case 'system-monitor':
            openSystemMonitor();
            break;
        case 'email':
            openEmail();
            break;
        case 'calendar':
            openCalendar();
            break;
        case 'text-editor':
            openTextEditor();
            break;
        case 'music':
            openMusicPlayer();
            break;
        case 'video':
            openVideoPlayer();
            break;
        case 'photos':
            openPhotoViewer();
            break;
        case 'browser':
            openWebBrowser();
            break;
        case 'transfer':
            openFileTransfer();
            break;
        default:
            openPlaceholder(appName);
    }

    console.log('App opened successfully');
}

// AI-powered Daily Digest
async function openDailyDigest() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>📊 Daily Digest</h2>
        <p>Generating your personalized daily digest...</p>
        <div class="loading"></div>
    `;

    const win = wm.createWindow('Daily Digest', content, { width: '700px', height: '500px' });

    try {
        const digest = await api.runAgent('daily_digest');

        let html = '<h2>📊 Daily Digest</h2><div class="ai-response">';

        // Today's Plan
        if (digest.plan && digest.plan.length > 0) {
            html += '<h3>📋 Today\'s Priorities</h3><ul>';
            digest.plan.forEach(item => {
                html += `<li><strong>${item.title}</strong> - ${item.reason}</li>`;
            });
            html += '</ul>';
        }

        // Time Blocks
        if (digest.blocks && digest.blocks.length > 0) {
            html += '<h3>⏰ Suggested Schedule</h3><ul>';
            digest.blocks.forEach(block => {
                html += `<li>${block.start} - ${block.end}: ${block.label}</li>`;
            });
            html += '</ul>';
        }

        // Health
        if (digest.health) {
            html += '<h3>💪 Health Notes</h3><ul>';
            if (digest.health.macro_delta) html += `<li>${digest.health.macro_delta}</li>`;
            if (digest.health.workout_suggestion) html += `<li>Workout: ${digest.health.workout_suggestion}</li>`;
            if (digest.health.sleep_note) html += `<li>Sleep: ${digest.health.sleep_note}</li>`;
            html += '</ul>';
        }

        // Bible & Journal
        if (digest.bible) {
            html += `<h3>📖 Bible Reading</h3><p>${digest.bible.next_passage}</p>`;
        }
        if (digest.journal_prompt) {
            html += `<h3>📔 Journal Prompt</h3><p>${digest.journal_prompt}</p>`;
        }

        html += '</div><button onclick="this.closest(\'.window\').querySelector(\'.close\').click()">Close</button>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `
            <h2>📊 Daily Digest</h2>
            <p style="color: red;">Error: ${error.message}</p>
            <p>Make sure the API and Agent services are running:</p>
            <pre>make dev-api
make dev-agent</pre>
            <button onclick="this.closest('.window').querySelector('.close').click()">Close</button>
        `;
    }
}

// Chat Assistant
function openChatAssistant() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>💬 Chat Assistant</h2>
        <div class="chat-messages" id="chat-messages"></div>
        <div style="display: flex; gap: 8px;">
            <input type="text" id="chat-input" placeholder="Ask me anything..." style="flex: 1;">
            <button id="chat-send">Send</button>
        </div>
    `;

    wm.createWindow('Chat Assistant', content, { width: '650px', height: '550px' });

    // Chat functionality
    const chatMessages = content.querySelector('#chat-messages');
    const chatInput = content.querySelector('#chat-input');
    const chatSend = content.querySelector('#chat-send');

    function addMessage(text, isUser = false) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${isUser ? 'user' : 'ai'}`;
        msg.innerHTML = `
            <div class="chat-message-label">${isUser ? 'You' : 'AI'}</div>
            <div>${text}</div>
        `;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        chatInput.value = '';

        addMessage('<span class="ai-thinking">Thinking...</span>', false);

        try {
            const result = await api.runAgent('chat_assistant', { message });
            chatMessages.lastChild.querySelector('div:last-child').textContent =
                result.response || result.result || result.output || 'Response received';
        } catch (error) {
            chatMessages.lastChild.querySelector('div:last-child').innerHTML =
                `<span style="color: #ef4444;">Error: ${error.message}</span>`;
        }
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    addMessage('Hello! I can help you with tasks, habits, journaling, and more. What would you like to know?', false);
}

// Tasks Manager
async function openTasks() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>✓ Tasks</h2>
        <p>Loading tasks...</p>
        <div class="loading"></div>
    `;

    wm.createWindow('Tasks', content, { width: '700px', height: '600px' });

    try {
        const tasks = await api.getTasks();

        let html = `
            <h2>✓ Tasks</h2>
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <input type="text" id="new-task-input" placeholder="What needs to be done?" style="flex: 1;">
                <button id="add-task-btn">Add Task</button>
            </div>
            <div class="task-list" id="task-list">
        `;

        if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
                html += `
                    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                        <span class="task-text">${task.title}</span>
                        <div class="task-actions">
                            <button class="secondary" onclick="deleteTask(${task.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<p style="text-align: center; opacity: 0.6; padding: 40px;">No tasks yet. Add your first task above!</p>';
        }

        html += '</div>';
        content.innerHTML = html;

        // Add task functionality
        const addBtn = content.querySelector('#add-task-btn');
        const input = content.querySelector('#new-task-input');

        async function addTask() {
            const title = input.value.trim();
            if (!title) return;

            try {
                await api.createTask({ title, completed: false });
                input.value = '';
                // Refresh
                wm.closeWindow(wm.activeWindow);
                openTasks();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        addBtn.addEventListener('click', addTask);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Checkbox toggle
        content.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const taskId = e.target.dataset.id;
                try {
                    await api.post(`/tasks/${taskId}`, { completed: e.target.checked });
                    const taskItem = e.target.closest('.task-item');
                    if (e.target.checked) {
                        taskItem.classList.add('completed');
                    } else {
                        taskItem.classList.remove('completed');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                    e.target.checked = !e.target.checked;
                }
            });
        });

        // Delete task function (global for onclick)
        window.deleteTask = async (taskId) => {
            if (!confirm('Delete this task?')) return;
            try {
                await fetch(`${api.baseURL}/tasks/${taskId}`, { method: 'DELETE' });
                wm.closeWindow(wm.activeWindow);
                openTasks();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };

    } catch (error) {
        content.innerHTML = `
            <h2>✓ Tasks</h2>
            <p style="color: #ef4444;">Error loading tasks: ${error.message}</p>
            <p>Make sure the API service is running:</p>
            <pre style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px;">make dev-api</pre>
        `;
    }
}

// Habits Tracker
async function openHabits() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>🔄 Habits</h2>
        <p>Loading habits...</p>
        <div class="loading"></div>
    `;

    wm.createWindow('Habits', content, { width: '700px', height: '600px' });

    try {
        const habits = await api.getHabits();

        let html = `
            <h2>🔄 Habits</h2>
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <input type="text" id="new-habit-name" placeholder="Habit name (e.g., Morning Run)" style="flex: 1;">
                <select id="new-habit-freq" style="padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                <button id="add-habit-btn">Add Habit</button>
            </div>
            <div class="task-list" id="habit-list">
        `;

        if (habits && habits.length > 0) {
            habits.forEach(habit => {
                html += `
                    <div class="habit-card" data-id="${habit.id}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="font-size: 16px;">${habit.name}</strong><br>
                                <small style="opacity: 0.7;">${habit.frequency || 'daily'}</small>
                                ${habit.streak ? `<span style="color: #ff8800;"> 🔥 ${habit.streak} day streak</span>` : ''}
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="secondary" onclick="checkInHabit(${habit.id})">✓ Check In</button>
                                <button class="secondary" onclick="deleteHabit(${habit.id})">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<p style="text-align: center; opacity: 0.6; padding: 40px;">No habits yet. Create your first habit above!</p>';
        }

        html += '</div>';
        content.innerHTML = html;

        // Add habit functionality
        const addBtn = content.querySelector('#add-habit-btn');
        const nameInput = content.querySelector('#new-habit-name');
        const freqSelect = content.querySelector('#new-habit-freq');

        async function addHabit() {
            const name = nameInput.value.trim();
            if (!name) return;

            try {
                await api.post('/habits', {
                    name,
                    cadence_json: { frequency: freqSelect.value }
                });
                wm.closeWindow(wm.activeWindow);
                openHabits();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        addBtn.addEventListener('click', addHabit);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addHabit();
        });

        // Global functions for buttons
        window.checkInHabit = async (habitId) => {
            try {
                await api.post(`/habits/${habitId}/check-in`, {});
                alert('✓ Checked in!');
                wm.closeWindow(wm.activeWindow);
                openHabits();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };

        window.deleteHabit = async (habitId) => {
            if (!confirm('Delete this habit?')) return;
            try {
                await fetch(`${api.baseURL}/habits/${habitId}`, { method: 'DELETE' });
                wm.closeWindow(wm.activeWindow);
                openHabits();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };
    } catch (error) {
        content.innerHTML = `
            <h2>🔄 Habits</h2>
            <p style="color: red;">Error: ${error.message}</p>
        `;
    }
}

// Journal
async function openJournal() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>📔 Journal</h2>
        <p>Loading...</p>
    `;

    wm.createWindow('Journal', content, { width: '800px', height: '650px' });

    try {
        const entries = await api.getJournalEntries();

        let html = `
            <h2>📔 Journal</h2>
            <div style="margin-bottom: 20px;">
                <textarea id="journal-entry" rows="8" placeholder="Write your thoughts for today..." style="width: 100%; padding: 12px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; font-size: 14px; line-height: 1.6; resize: vertical;"></textarea>
                <div style="margin-top: 8px; text-align: right;">
                    <button id="save-journal" style="padding: 10px 24px;">💾 Save Entry</button>
                </div>
            </div>
            <h3 style="margin: 20px 0 12px 0; font-size: 16px; opacity: 0.8;">📖 Recent Entries</h3>
            <div id="journal-list" style="max-height: 300px; overflow-y: auto;">
        `;

        if (entries && entries.length > 0) {
            entries.slice(0, 10).forEach(entry => {
                const date = entry.dt ? new Date(entry.dt).toLocaleDateString('en-US', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                }) : 'Unknown date';
                html += `
                    <div class="habit-card" style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong style="color: #8b5cf6;">${date}</strong>
                            <button class="secondary" onclick="deleteJournalEntry(${entry.id})" style="padding: 4px 12px; font-size: 12px;">Delete</button>
                        </div>
                        <p style="margin: 0; line-height: 1.6; opacity: 0.9;">${entry.content_md || entry.content || ''}</p>
                    </div>
                `;
            });
        } else {
            html += '<p style="text-align: center; opacity: 0.6; padding: 40px;">No journal entries yet. Write your first entry above!</p>';
        }

        html += '</div>';
        content.innerHTML = html;

        // Save functionality
        const saveBtn = content.querySelector('#save-journal');
        const textarea = content.querySelector('#journal-entry');

        saveBtn.addEventListener('click', async () => {
            const text = textarea.value.trim();
            if (!text) {
                alert('Please write something first!');
                return;
            }

            try {
                await api.createJournalEntry({
                    content_md: text,
                    dt: new Date().toISOString()
                });
                textarea.value = '';
                alert('✓ Journal entry saved!');
                wm.closeWindow(wm.activeWindow);
                openJournal();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        // Delete function
        window.deleteJournalEntry = async (entryId) => {
            if (!confirm('Delete this journal entry?')) return;
            try {
                await fetch(`${api.baseURL}/journal/${entryId}`, { method: 'DELETE' });
                wm.closeWindow(wm.activeWindow);
                openJournal();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };

    } catch (error) {
        content.innerHTML = `
            <h2>📔 Journal</h2>
            <p style="color: #ef4444;">Error loading journal: ${error.message}</p>
        `;
    }
}

// Placeholder apps (not yet fully implemented)
function openHealth() {
    openPlaceholder('Health Tracker', 'Track meals, workouts, and sleep. Integration coming soon!');
}

// Helper function to fetch real Bible text from API
async function fetchBiblePassage(book, chapter, verse = null) {
    try {
        const bookMap = {
            '1 Samuel': '1sam', '2 Samuel': '2sam', '1 Kings': '1kings', '2 Kings': '2kings',
            '1 Corinthians': '1cor', '2 Corinthians': '2cor', '1 Thessalonians': '1thess',
            '2 Thessalonians': '2thess', '1 Timothy': '1tim', '2 Timothy': '2tim',
            '1 Peter': '1pet', '2 Peter': '2pet', '1 John': '1john'
        };

        const bookCode = bookMap[book] || book.toLowerCase();
        const verseRef = verse ? `:${verse}` : '';
        const reference = `${bookCode} ${chapter}${verseRef}`;

        const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
        if (!response.ok) throw new Error('Failed to fetch passage');

        const data = await response.json();
        return {
            reference: data.reference,
            text: data.text,
            verses: data.verses || []
        };
    } catch (error) {
        console.error('Bible API error:', error);
        return {
            reference: `${book} ${chapter}${verse ? ':' + verse : ''}`,
            text: 'Failed to load passage. Please check your internet connection or try again.',
            verses: []
        };
    }
}

async function openBibleStudy() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>📖 Bible Study</h2>
        <p>Loading...</p>
    `;

    wm.createWindow('Bible Study', content, { width: '1000px', height: '700px' });

    try {
        // Use notes endpoint for bible notes
        let readings = [];
        try {
            const allNotes = await api.getNotes();
            readings = allNotes.filter(n => n.title && n.title.includes(':'));
        } catch (e) {
            console.log('No bible notes yet');
        }

        let html = `
            <h2>📖 Bible Study Platform</h2>

            <!-- Bible Study Navigation -->
            <div style="display: flex; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid rgba(139,92,246,0.3); padding-bottom: 12px;">
                <button class="bible-tab active" data-tab="reader" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer; font-weight: 600;">📚 Reader</button>
                <button class="bible-tab" data-tab="notes" style="padding: 8px 16px; background: transparent; border: none; border-radius: 6px; color: #e0e0e0; cursor: pointer;">📝 Study Notes</button>
                <button class="bible-tab" data-tab="plan" style="padding: 8px 16px; background: transparent; border: none; border-radius: 6px; color: #e0e0e0; cursor: pointer;">📅 Reading Plan</button>
                <button class="bible-tab" data-tab="insights" style="padding: 8px 16px; background: transparent; border: none; border-radius: 6px; color: #e0e0e0; cursor: pointer;">✨ AI Insights</button>
            </div>

            <!-- Reader Tab -->
            <div id="bible-reader" class="bible-tab-content">
                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <select id="bible-book" style="padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; flex: 1;">
                        <option value="">Select Book</option>
                        <optgroup label="Old Testament">
                            <option value="Genesis">Genesis</option>
                            <option value="Exodus">Exodus</option>
                            <option value="Leviticus">Leviticus</option>
                            <option value="Numbers">Numbers</option>
                            <option value="Deuteronomy">Deuteronomy</option>
                            <option value="Joshua">Joshua</option>
                            <option value="Judges">Judges</option>
                            <option value="Ruth">Ruth</option>
                            <option value="1 Samuel">1 Samuel</option>
                            <option value="2 Samuel">2 Samuel</option>
                            <option value="1 Kings">1 Kings</option>
                            <option value="2 Kings">2 Kings</option>
                            <option value="Psalms">Psalms</option>
                            <option value="Proverbs">Proverbs</option>
                            <option value="Isaiah">Isaiah</option>
                            <option value="Jeremiah">Jeremiah</option>
                            <option value="Daniel">Daniel</option>
                        </optgroup>
                        <optgroup label="New Testament">
                            <option value="Matthew">Matthew</option>
                            <option value="Mark">Mark</option>
                            <option value="Luke">Luke</option>
                            <option value="John" selected>John</option>
                            <option value="Acts">Acts</option>
                            <option value="Romans">Romans</option>
                            <option value="1 Corinthians">1 Corinthians</option>
                            <option value="2 Corinthians">2 Corinthians</option>
                            <option value="Galatians">Galatians</option>
                            <option value="Ephesians">Ephesians</option>
                            <option value="Philippians">Philippians</option>
                            <option value="Colossians">Colossians</option>
                            <option value="1 Thessalonians">1 Thessalonians</option>
                            <option value="2 Thessalonians">2 Thessalonians</option>
                            <option value="1 Timothy">1 Timothy</option>
                            <option value="2 Timothy">2 Timothy</option>
                            <option value="Hebrews">Hebrews</option>
                            <option value="James">James</option>
                            <option value="1 Peter">1 Peter</option>
                            <option value="2 Peter">2 Peter</option>
                            <option value="1 John">1 John</option>
                            <option value="Revelation">Revelation</option>
                        </optgroup>
                    </select>
                    <input type="number" id="bible-chapter" placeholder="Ch" min="1" value="3" style="width: 60px; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                    <input type="number" id="bible-verse-start" placeholder="V" min="1" value="16" style="width: 60px; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                    <button id="load-passage" style="padding: 8px 20px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">Load</button>
                </div>

                <div id="passage-display" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px; line-height: 2; font-size: 15px; max-height: 400px; overflow-y: auto;">
                    <p style="text-align: center; opacity: 0.6; padding: 40px;">Select a passage to begin your study</p>
                </div>

                <div style="margin-top: 16px; display: flex; gap: 8px;">
                    <button id="add-highlight" style="padding: 8px 16px; background: rgba(251,191,36,0.2); border: 1px solid #fbbf24; border-radius: 6px; color: #fbbf24; cursor: pointer;">🖍️ Highlight</button>
                    <button id="add-bible-note" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; border-radius: 6px; color: #8b5cf6; cursor: pointer;">📝 Add Note</button>
                    <button id="get-cross-refs" style="padding: 8px 16px; background: rgba(34,197,94,0.2); border: 1px solid #22c55e; border-radius: 6px; color: #22c55e; cursor: pointer;">🔗 Cross References</button>
                </div>
            </div>

            <!-- Study Notes Tab -->
            <div id="bible-notes" class="bible-tab-content" style="display: none;">
                <div style="margin-bottom: 16px;">
                    <input type="text" id="note-verse-ref" placeholder="Verse Reference (e.g., John 3:16)" style="flex: 1; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; width: 100%; margin-bottom: 8px;">
                    <textarea id="note-content" placeholder="Your study notes..." rows="4" style="width: 100%; padding: 12px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; line-height: 1.6; resize: vertical;"></textarea>
                    <button id="save-bible-note" style="padding: 10px 24px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600; margin-top: 8px;">💾 Save Note</button>
                </div>
                <div id="notes-list" style="max-height: 400px; overflow-y: auto;">
                    ${readings && readings.length > 0 ? readings.map(r => `
                        <div class="habit-card" style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <strong style="color: #8b5cf6;">${r.title || 'Unknown passage'}</strong>
                                <button class="secondary" onclick="deleteBibleNote(${r.id})" style="padding: 4px 12px; font-size: 12px;">Delete</button>
                            </div>
                            <p style="margin: 0; line-height: 1.6; opacity: 0.9;">${r.content_md || r.content || ''}</p>
                        </div>
                    `).join('') : '<p style="text-align: center; opacity: 0.6; padding: 40px;">No study notes yet. Add your insights above!</p>'}
                </div>
            </div>

            <!-- Reading Plan Tab -->
            <div id="bible-plan" class="bible-tab-content" style="display: none;">
                <h3 style="margin: 0 0 16px 0;">📅 Create Reading Plan</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; opacity: 0.8; font-size: 13px;">Plan Type</label>
                        <select id="plan-type" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                            <option value="gospels">Read the Gospels (4 books)</option>
                            <option value="paul">Paul's Epistles (13 books)</option>
                            <option value="ot-law">Old Testament Law (5 books)</option>
                            <option value="wisdom">Wisdom Literature (5 books)</option>
                            <option value="whole">Whole Bible (66 books)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; opacity: 0.8; font-size: 13px;">Duration</label>
                        <select id="plan-duration" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                            <option value="30">30 days</option>
                            <option value="90">90 days</option>
                            <option value="180">6 months</option>
                            <option value="365">1 year</option>
                        </select>
                    </div>
                </div>
                <button id="generate-plan" style="padding: 12px 28px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600; font-size: 14px;">✨ Generate Reading Plan</button>

                <div id="plan-output" style="margin-top: 24px; background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px; max-height: 350px; overflow-y: auto;">
                    <p style="text-align: center; opacity: 0.6; padding: 40px;">Generate a reading plan to see your schedule</p>
                </div>
            </div>

            <!-- AI Insights Tab -->
            <div id="bible-insights" class="bible-tab-content" style="display: none;">
                <h3 style="margin: 0 0 16px 0;">✨ Study Helper</h3>

                <div class="habit-card" style="margin-bottom: 16px; background: rgba(139,92,246,0.1);">
                    <h4 style="margin: 0 0 8px 0; color: #8b5cf6;">💡 How to use this feature</h4>
                    <p style="margin: 0; opacity: 0.9; line-height: 1.6;">
                        This tool helps you reflect on scripture you're studying.
                        Copy the passage text from the Reader tab, paste it below along with the reference,
                        and the AI will help you understand and apply it.
                    </p>
                </div>

                <div style="margin-bottom: 16px;">
                    <input type="text" id="insight-passage" placeholder="Passage Reference (e.g., John 3:16-21)" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; margin-bottom: 8px;">

                    <textarea id="insight-text" placeholder="Paste the passage text here..." rows="6" style="width: 100%; padding: 12px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; line-height: 1.6; resize: vertical; margin-bottom: 8px;"></textarea>

                    <select id="insight-type" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; margin-bottom: 8px;">
                        <option value="questions">Generate Study Questions</option>
                        <option value="application">Life Application Ideas</option>
                        <option value="summary">Summarize Key Points</option>
                        <option value="prayer">Prayer Points</option>
                    </select>

                    <button id="generate-insight" style="padding: 12px 28px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">🤖 Generate Study Help</button>
                </div>

                <div id="insight-output" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px; line-height: 1.8; max-height: 400px; overflow-y: auto;">
                    <p style="text-align: center; opacity: 0.6; padding: 40px;">AI study insights will appear here</p>
                </div>
            </div>
        `;

        content.innerHTML = html;

        // Tab switching
        content.querySelectorAll('.bible-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs
                content.querySelectorAll('.bible-tab').forEach(t => {
                    t.classList.remove('active');
                    t.style.background = 'transparent';
                    t.style.color = '#e0e0e0';
                });

                // Hide all tab contents
                content.querySelectorAll('.bible-tab-content').forEach(tc => {
                    tc.style.display = 'none';
                });

                // Show selected tab
                tab.classList.add('active');
                tab.style.background = 'rgba(139,92,246,0.2)';
                tab.style.color = '#8b5cf6';
                const tabName = tab.dataset.tab;
                content.querySelector(`#bible-${tabName}`).style.display = 'block';
            });
        });

        // Load passage functionality
        content.querySelector('#load-passage').addEventListener('click', async () => {
            const book = content.querySelector('#bible-book').value;
            const chapter = content.querySelector('#bible-chapter').value;
            const verse = content.querySelector('#bible-verse-start').value;

            if (!book || !chapter) {
                alert('Please select a book and chapter');
                return;
            }

            const passageRef = verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`;
            content.querySelector('#passage-display').innerHTML = `<p style="text-align: center; opacity: 0.6;">Loading ${passageRef}...</p>`;

            // Fetch real Bible text from API
            const passage = await fetchBiblePassage(book, chapter, verse || null);
            content.querySelector('#passage-display').innerHTML = `
                <div style="margin-bottom: 12px; font-weight: 600; color: #8b5cf6; font-size: 16px;">${passage.reference}</div>
                <div style="line-height: 2; white-space: pre-wrap;">${passage.text}</div>
            `;
        });

        // Save bible note
        content.querySelector('#save-bible-note').addEventListener('click', async () => {
            const passage = content.querySelector('#note-verse-ref').value.trim();
            const notes = content.querySelector('#note-content').value.trim();

            if (!passage || !notes) {
                alert('Please enter both passage reference and notes');
                return;
            }

            try {
                await api.post('/notes', { title: passage, content_md: notes });
                alert('✓ Study note saved!');
                wm.closeWindow(wm.activeWindow);
                openBibleStudy();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        // Generate reading plan
        content.querySelector('#generate-plan').addEventListener('click', () => {
            const planType = content.querySelector('#plan-type').value;
            const duration = content.querySelector('#plan-duration').value;

            const planHtml = generateReadingPlan(planType, parseInt(duration));
            content.querySelector('#plan-output').innerHTML = planHtml;
        });

        // Generate AI insights with actual passage text
        content.querySelector('#generate-insight').addEventListener('click', async () => {
            const reference = content.querySelector('#insight-passage').value.trim();
            const passageText = content.querySelector('#insight-text').value.trim();
            const insightType = content.querySelector('#insight-type').value;

            if (!reference || !passageText) {
                alert('Please provide both the passage reference and the passage text');
                return;
            }

            content.querySelector('#insight-output').innerHTML = '<p style="text-align: center;"><span class="ai-thinking">Analyzing passage...</span></p>';

            try {
                // Create a detailed prompt with the actual passage text
                let prompt = `You are a thoughtful Bible study helper. Here is the scripture passage:\n\n`;
                prompt += `Reference: ${reference}\n\n`;
                prompt += `Text: ${passageText}\n\n`;

                switch(insightType) {
                    case 'questions':
                        prompt += 'Generate 5 thoughtful study questions that help understand this passage deeply. Focus on meaning, context, and application.';
                        break;
                    case 'application':
                        prompt += 'Provide 3-5 practical ways this passage can be applied to daily life today. Be specific and actionable.';
                        break;
                    case 'summary':
                        prompt += 'Summarize the key theological points and main messages of this passage in 3-4 concise bullet points.';
                        break;
                    case 'prayer':
                        prompt += 'Based on this passage, suggest 4-5 prayer points that align with the themes and teachings.';
                        break;
                }

                // Use the chat assistant for better context
                const result = await api.runAgent('chat_assistant', { message: prompt });

                let insightHtml = `<h4 style="margin: 0 0 12px 0; color: #8b5cf6;">${reference}</h4>`;
                insightHtml += `<div style="white-space: pre-wrap; line-height: 1.8;">${result.response || 'No response generated'}</div>`;

                content.querySelector('#insight-output').innerHTML = insightHtml;
            } catch (error) {
                content.querySelector('#insight-output').innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
            }
        });

        // Delete note function
        window.deleteBibleNote = async (noteId) => {
            if (!confirm('Delete this study note?')) return;
            try {
                await fetch(`${api.baseURL}/notes/${noteId}`, { method: 'DELETE' });
                wm.closeWindow(wm.activeWindow);
                openBibleStudy();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };

    } catch (error) {
        content.innerHTML = `
            <h2>📖 Bible Study</h2>
            <p style="color: #ef4444;">Error loading: ${error.message}</p>
        `;
    }
}

// Helper function for sample passages
function getSamplePassage(book, chapter, verse) {
    const samples = {
        'John': {
            '3': {
                '16': '<sup>16</sup> For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. <sup>17</sup> For God did not send his Son into the world to condemn the world, but to save the world through him.'
            }
        }
    };

    return samples[book]?.[chapter]?.[verse] || `<p style="opacity: 0.6;">Passage text for ${book} ${chapter}:${verse || '1'} would appear here. In production, this would connect to a Bible API like ESV API or Bible.org API.</p>`;
}

// Helper function for reading plans
function generateReadingPlan(planType, days) {
    const plans = {
        'gospels': ['Matthew', 'Mark', 'Luke', 'John'],
        'paul': ['Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon'],
        'ot-law': ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
        'wisdom': ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon']
    };

    const books = plans[planType] || ['Whole Bible - 66 books'];
    const daysPerBook = Math.floor(days / books.length);

    let html = '<h4 style="margin: 0 0 16px 0; color: #8b5cf6;">Your ' + days + '-Day Reading Plan</h4>';
    html += '<div style="display: grid; gap: 12px;">';

    books.forEach((book, index) => {
        const startDay = index * daysPerBook + 1;
        const endDay = Math.min(startDay + daysPerBook - 1, days);
        html += `
            <div class="habit-card" style="padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 15px;">${book}</strong><br>
                        <small style="opacity: 0.7;">Days ${startDay}-${endDay}</small>
                    </div>
                    <span style="padding: 4px 12px; background: rgba(139,92,246,0.2); border-radius: 12px; font-size: 12px; color: #8b5cf6;">📖 ${daysPerBook} days</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

function openFinances() {
    openPlaceholder('Finances', 'Budget tracking and expense management. Coming soon!');
}

async function openProjects() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>🚀 Projects</h2>
        <p>Loading projects...</p>
    `;

    wm.createWindow('Projects', content, { width: '800px', height: '650px' });

    try {
        const projects = await api.getProjects();

        let html = `
            <h2>🚀 Projects</h2>
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <input type="text" id="new-project-name" placeholder="Project name" style="flex: 1;">
                <input type="text" id="new-project-desc" placeholder="Description" style="flex: 2;">
                <button id="add-project-btn">Add Project</button>
            </div>
            <div id="project-list">
        `;

        if (projects && projects.length > 0) {
            projects.forEach(project => {
                const statusColor = project.status === 'active' ? '#10b981' : project.status === 'completed' ? '#6b7280' : '#8b5cf6';
                html += `
                    <div class="habit-card" style="border-left: 4px solid ${statusColor};">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 8px 0; font-size: 18px;">${project.name}</h3>
                                <p style="margin: 0; opacity: 0.8;">${project.description || 'No description'}</p>
                                <small style="opacity: 0.6; margin-top: 8px; display: block;">Status: ${project.status || 'active'}</small>
                            </div>
                            <button class="secondary" onclick="deleteProject(${project.id})" style="padding: 6px 12px;">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<p style="text-align: center; opacity: 0.6; padding: 40px;">No projects yet. Create your first project above!</p>';
        }

        html += '</div>';
        content.innerHTML = html;

        // Add project functionality
        const addBtn = content.querySelector('#add-project-btn');
        const nameInput = content.querySelector('#new-project-name');
        const descInput = content.querySelector('#new-project-desc');

        async function addProject() {
            const name = nameInput.value.trim();
            if (!name) return;

            try {
                await api.post('/projects', {
                    name,
                    description: descInput.value.trim(),
                    status: 'active'
                });
                wm.closeWindow(wm.activeWindow);
                openProjects();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        addBtn.addEventListener('click', addProject);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addProject();
        });

        window.deleteProject = async (projectId) => {
            if (!confirm('Delete this project?')) return;
            try {
                await fetch(`${api.baseURL}/projects/${projectId}`, { method: 'DELETE' });
                wm.closeWindow(wm.activeWindow);
                openProjects();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };

    } catch (error) {
        content.innerHTML = `<h2>🚀 Projects</h2><p style="color: #ef4444;">Error: ${error.message}</p>`;
    }
}

async function openNotes() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h2>📝 Notes</h2>
        <p>Loading notes...</p>
    `;

    wm.createWindow('Notes', content, { width: '800px', height: '650px' });

    try {
        const notes = await api.getNotes();

        let html = `
            <h2>📝 Notes</h2>
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <input type="text" id="new-note-title" placeholder="Note title" style="flex: 1;">
                <input type="text" id="new-note-content" placeholder="Note content" style="flex: 2;">
                <button id="add-note-btn">Add Note</button>
            </div>
            <div id="notes-list">
        `;

        if (notes && notes.length > 0) {
            notes.forEach(note => {
                html += `
                    <div class="habit-card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #8b5cf6;">${note.title}</h3>
                                <p style="margin: 0; line-height: 1.6; opacity: 0.9;">${note.content_md || note.content || ''}</p>
                            </div>
                            <button class="secondary" onclick="deleteNote(${note.id})" style="padding: 6px 12px;">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<p style="text-align: center; opacity: 0.6; padding: 40px;">No notes yet. Create your first note above!</p>';
        }

        html += '</div>';
        content.innerHTML = html;

        // Add note functionality
        const addBtn = content.querySelector('#add-note-btn');
        const titleInput = content.querySelector('#new-note-title');
        const contentInput = content.querySelector('#new-note-content');

        async function addNote() {
            const title = titleInput.value.trim();
            const noteContent = contentInput.value.trim();
            if (!title) return;

            try {
                await api.post('/notes', {
                    title,
                    content_md: noteContent
                });
                wm.closeWindow(wm.activeWindow);
                openNotes();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        addBtn.addEventListener('click', addNote);
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNote();
        });

        window.deleteNote = async (noteId) => {
            if (!confirm('Delete this note?')) return;
            try {
                await fetch(`${api.baseURL}/notes/${noteId}`, { method: 'DELETE' });
                wm.closeWindow(wm.activeWindow);
                openNotes();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };

    } catch (error) {
        content.innerHTML = `<h2>📝 Notes</h2><p style="color: #ef4444;">Error: ${error.message}</p>`;
    }
}

async function openSettings() {
    const content = document.createElement('div');

    // Load current settings from localStorage
    const settings = {
        theme: localStorage.getItem('julios_theme') || 'amiga',
        fontSize: localStorage.getItem('julios_fontSize') || 'medium',
        animations: localStorage.getItem('julios_animations') !== 'false',
        notifications: localStorage.getItem('julios_notifications') !== 'false',
        autoSave: localStorage.getItem('julios_autoSave') !== 'false',
        showHidden: localStorage.getItem('julios_showHidden') === 'true'
    };

    content.innerHTML = `
        <h2>⚙️ Settings</h2>
        <div style="display: grid; gap: 20px;">
            <!-- Appearance Section -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 16px 0; color: #8b5cf6;">🎨 Appearance</h3>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Theme</label>
                    <select id="theme-select" style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                        <option value="amiga" ${settings.theme === 'amiga' ? 'selected' : ''}>Amiga (Purple)</option>
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                    </select>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Font Size</label>
                    <select id="font-size-select" style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                        <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" id="animations-check" ${settings.animations ? 'checked' : ''} style="cursor: pointer;">
                    <label for="animations-check" style="cursor: pointer;">Enable animations</label>
                </div>
            </div>

            <!-- System Section -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 16px 0; color: #8b5cf6;">💻 System</h3>

                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <input type="checkbox" id="notifications-check" ${settings.notifications ? 'checked' : ''} style="cursor: pointer;">
                    <label for="notifications-check" style="cursor: pointer;">Enable notifications</label>
                </div>

                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <input type="checkbox" id="autosave-check" ${settings.autoSave ? 'checked' : ''} style="cursor: pointer;">
                    <label for="autosave-check" style="cursor: pointer;">Auto-save changes</label>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" id="showhidden-check" ${settings.showHidden ? 'checked' : ''} style="cursor: pointer;">
                    <label for="showhidden-check" style="cursor: pointer;">Show hidden files</label>
                </div>
            </div>

            <!-- About Section -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 16px 0; color: #8b5cf6;">ℹ️ About</h3>

                <div style="display: grid; gap: 8px; opacity: 0.8;">
                    <div><strong>OS:</strong> JuliOS 1.0</div>
                    <div><strong>Version:</strong> Alpha 2025.11.12</div>
                    <div><strong>Desktop Mode:</strong> Amiga-inspired</div>
                    <div><strong>API:</strong> Connected</div>
                    <div><strong>Agent:</strong> Active</div>
                </div>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="reset-settings" style="padding: 12px 24px; background: rgba(239,68,68,0.2); border: none; border-radius: 6px; color: #ef4444; cursor: pointer; font-weight: 600;">Reset to Defaults</button>
                <button id="save-settings" style="padding: 12px 24px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">Save Changes</button>
            </div>
        </div>
    `;

    wm.createWindow('Settings', content, { width: '600px', height: '700px' });

    // Save settings
    content.querySelector('#save-settings').addEventListener('click', () => {
        const newSettings = {
            theme: content.querySelector('#theme-select').value,
            fontSize: content.querySelector('#font-size-select').value,
            animations: content.querySelector('#animations-check').checked,
            notifications: content.querySelector('#notifications-check').checked,
            autoSave: content.querySelector('#autosave-check').checked,
            showHidden: content.querySelector('#showhidden-check').checked
        };

        // Save to localStorage
        localStorage.setItem('julios_theme', newSettings.theme);
        localStorage.setItem('julios_fontSize', newSettings.fontSize);
        localStorage.setItem('julios_animations', newSettings.animations);
        localStorage.setItem('julios_notifications', newSettings.notifications);
        localStorage.setItem('julios_autoSave', newSettings.autoSave);
        localStorage.setItem('julios_showHidden', newSettings.showHidden);

        // Apply settings
        applySettings(newSettings);

        alert('Settings saved successfully!');
    });

    // Reset settings
    content.querySelector('#reset-settings').addEventListener('click', () => {
        if (confirm('Reset all settings to defaults?')) {
            localStorage.removeItem('julios_theme');
            localStorage.removeItem('julios_fontSize');
            localStorage.removeItem('julios_animations');
            localStorage.removeItem('julios_notifications');
            localStorage.removeItem('julios_autoSave');
            localStorage.removeItem('julios_showHidden');

            const defaults = {
                theme: 'amiga',
                fontSize: 'medium',
                animations: true,
                notifications: true,
                autoSave: true,
                showHidden: false
            };

            applySettings(defaults);

            alert('Settings reset to defaults. Please reload the page.');
        }
    });
}

function applySettings(settings) {
    // Apply font size
    const fontSizes = { small: '13px', medium: '15px', large: '17px' };
    document.body.style.fontSize = fontSizes[settings.fontSize] || '15px';

    // Apply animations (could disable transitions)
    if (!settings.animations) {
        document.body.style.setProperty('--transition-speed', '0s');
    } else {
        document.body.style.setProperty('--transition-speed', '0.2s');
    }

    // Theme would require reloading CSS or switching stylesheets
    // For now, just log it
    console.log('Settings applied:', settings);
}

async function openTerminal() {
    const content = document.createElement('div');
    let cwd = '/home/julius';
    let commandHistory = [];
    let historyIndex = -1;

    content.innerHTML = `
        <h2>⌨️ Terminal</h2>
        <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 16px; font-family: 'Courier New', monospace; height: 500px; display: flex; flex-direction: column;">
            <div id="terminal-output" style="flex: 1; overflow-y: auto; margin-bottom: 12px; color: #22c55e; line-height: 1.6; font-size: 14px;"></div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #8b5cf6; font-weight: 600;">$</span>
                <input type="text" id="terminal-input"
                       placeholder="Enter command..."
                       style="flex: 1; background: transparent; border: none; color: #e0e0e0; outline: none; font-family: 'Courier New', monospace; font-size: 14px;"
                       autocomplete="off">
            </div>
        </div>
        <div style="margin-top: 8px; opacity: 0.6; font-size: 12px;">
            Tip: Use ↑/↓ for command history, Ctrl+C to cancel, Ctrl+L to clear
        </div>
    `;

    wm.createWindow('Terminal', content, { width: '800px', height: '650px' });

    const output = content.querySelector('#terminal-output');
    const input = content.querySelector('#terminal-input');

    function addOutput(text, type = 'normal') {
        const colors = {
            normal: '#e0e0e0',
            success: '#22c55e',
            error: '#ef4444',
            command: '#8b5cf6'
        };

        const line = document.createElement('div');
        line.style.color = colors[type];
        line.style.whiteSpace = 'pre-wrap';
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    async function executeCommand(cmd) {
        if (!cmd.trim()) return;

        commandHistory.push(cmd);
        historyIndex = commandHistory.length;

        // Display command
        addOutput(`$ ${cmd}`, 'command');

        // Handle built-in commands
        if (cmd.trim() === 'clear') {
            output.innerHTML = '';
            return;
        }

        if (cmd.trim().startsWith('cd ')) {
            const newDir = cmd.trim().substring(3).trim();
            // For cd, we'll update cwd but won't actually execute
            addOutput(`Changed directory to ${newDir}`, 'success');
            cwd = newDir;
            return;
        }

        try {
            const response = await fetch(`${api.baseURL}/terminal/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd, cwd: cwd })
            });

            if (!response.ok) {
                const error = await response.json();
                addOutput(`Error: ${error.detail || 'Command failed'}`, 'error');
                return;
            }

            const result = await response.json();

            if (result.stdout) {
                addOutput(result.stdout, 'normal');
            }

            if (result.stderr) {
                addOutput(result.stderr, 'error');
            }

            if (!result.stdout && !result.stderr && result.exit_code === 0) {
                // Command succeeded but produced no output
                addOutput('', 'normal');
            }

            cwd = result.cwd;

        } catch (error) {
            addOutput(`Error: ${error.message}`, 'error');
        }
    }

    // Handle input
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value;
            input.value = '';
            await executeCommand(cmd);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex] || '';
            } else {
                historyIndex = commandHistory.length;
                input.value = '';
            }
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            output.innerHTML = '';
        }
    });

    // Welcome message
    addOutput('JuliOS Terminal v1.0', 'success');
    addOutput(`Working directory: ${cwd}`, 'normal');
    addOutput('Type commands and press Enter. Type "clear" to clear screen.', 'normal');
    addOutput('', 'normal');

    input.focus();
}

function openPlaceholder(title, message = 'This feature is coming soon!') {
    const content = `
        <h2>${title}</h2>
        <p>${message}</p>
        <button onclick="this.closest('.window').querySelector('.close').click()">Close</button>
    `;
    wm.createWindow(title, content, { width: '400px', height: '250px' });
}

// Welcome message
setTimeout(() => {
    const welcomeContent = `
        <h2>Welcome to JuliOS</h2>
        <p>Your AI-powered operating system.</p>
        <p><strong>Double-click</strong> any icon to launch an app.</p>
        <div style="margin: 20px 0;">
            <h3>Available Apps:</h3>
            <p style="font-size: 13px; line-height: 1.8;">
                📊 Daily Digest • 💬 Chat Assistant • ✓ Tasks<br>
                🔄 Habits • 📔 Journal • 🚀 Projects • 📝 Notes
            </p>
        </div>
        <button onclick="this.closest('.window').querySelector('.close').click()">Get Started</button>
    `;
    wm.createWindow('Welcome', welcomeContent, { width: '450px', height: '350px' });
}, 500);

// ========================================
// Taskbar Chat Assistant
// ========================================

const taskbarMessages = document.getElementById('taskbar-messages');
const taskbarInput = document.getElementById('taskbar-chat-input');
const taskbarSend = document.getElementById('taskbar-chat-send');

function addTaskbarMessage(text, isUser = false) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${isUser ? 'user' : 'ai'}`;
    msg.innerHTML = `
        <div class="chat-message-label">${isUser ? 'You' : 'AI Assistant'}</div>
        <div>${text}</div>
    `;
    taskbarMessages.appendChild(msg);
    taskbarMessages.scrollTop = taskbarMessages.scrollHeight;
}

async function sendTaskbarMessage() {
    const message = taskbarInput.value.trim();
    if (!message) return;

    addTaskbarMessage(message, true);
    taskbarInput.value = '';

    addTaskbarMessage('<span class="ai-thinking">Thinking...</span>', false);

    try {
        const result = await api.runAgent('chat_assistant', { message });
        taskbarMessages.lastChild.querySelector('div:last-child').textContent =
            result.response || result.result || result.output || 'Response received';
    } catch (error) {
        taskbarMessages.lastChild.querySelector('div:last-child').innerHTML =
            `<span style="color: #ef4444;">Error: ${error.message}</span>`;
    }
}

taskbarSend.addEventListener('click', sendTaskbarMessage);
taskbarInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendTaskbarMessage();
});

// Add initial greeting
addTaskbarMessage('Hello! I can help you with tasks, habits, journaling, and more. What would you like to know?', false);

// ========================================
// Collapsible Chat Taskbar
// ========================================

const chatTaskbar = document.getElementById('chat-taskbar');
const toggleChatBtn = document.getElementById('toggle-chat');
const chatHeader = document.getElementById('chat-header');

// Toggle chat on button click
toggleChatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat();
});

// Also toggle on header click
chatHeader.addEventListener('click', (e) => {
    if (e.target !== toggleChatBtn) {
        toggleChat();
    }
});

function toggleChat() {
    chatTaskbar.classList.toggle('collapsed');
    document.body.classList.toggle('chat-collapsed');

    // Update button icon
    if (chatTaskbar.classList.contains('collapsed')) {
        toggleChatBtn.textContent = '▲';
    } else {
        toggleChatBtn.textContent = '▼';
    }
}

// ================================
// SYSTEM APPS
// ================================

async function openFileManager(initialPath = '/home/julius') {
    const content = document.createElement('div');
    let currentPath = initialPath;
    let showHidden = false;

    async function loadDirectory(path) {
        try {
            const response = await fetch(`${api.baseURL}/files/list?path=${encodeURIComponent(path)}`);
            if (!response.ok) throw new Error('Failed to load directory');
            const data = await response.json();

            currentPath = data.current_path;

            // Filter hidden files if needed
            let files = showHidden ? data.files : data.files.filter(f => !f.is_hidden);

            content.querySelector('#current-path').value = currentPath;

            const fileList = content.querySelector('#file-list');
            if (files.length === 0) {
                fileList.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6;">Empty folder</div>';
            } else {
                fileList.innerHTML = files.map(file => `
                    <div class="file-row" data-path="${file.path}" data-type="${file.type}"
                         style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr 80px; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: background 0.2s;"
                         onmouseover="this.style.background='rgba(139,92,246,0.1)'"
                         onmouseout="this.style.background='transparent'">
                        <div>${file.type === 'folder' ? '📁' : '📄'} ${file.name}</div>
                        <div style="opacity: 0.6;">${file.type}</div>
                        <div style="opacity: 0.6;">${file.size}</div>
                        <div style="opacity: 0.6;">${file.modified}</div>
                        <div style="display: flex; gap: 4px;">
                            ${file.type === 'file' ? '<button class="file-download" style="padding: 4px 8px; background: rgba(139,92,246,0.2); border: none; border-radius: 4px; color: #8b5cf6; cursor: pointer; font-size: 11px;">📥</button>' : ''}
                            <button class="file-delete" style="padding: 4px 8px; background: rgba(239,68,68,0.2); border: none; border-radius: 4px; color: #ef4444; cursor: pointer; font-size: 11px;">🗑️</button>
                        </div>
                    </div>
                `).join('');

                // Add event listeners for file rows
                fileList.querySelectorAll('.file-row').forEach(row => {
                    const filePath = row.dataset.path;
                    const fileType = row.dataset.type;

                    // Double click to open folder
                    row.addEventListener('dblclick', async () => {
                        if (fileType === 'folder') {
                            await loadDirectory(filePath);
                        }
                    });

                    // Download button
                    const downloadBtn = row.querySelector('.file-download');
                    if (downloadBtn) {
                        downloadBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            window.open(`${api.baseURL}/files/download?path=${encodeURIComponent(filePath)}`);
                        });
                    }

                    // Delete button
                    const deleteBtn = row.querySelector('.file-delete');
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${row.querySelector('div').textContent.trim()}?`)) {
                            try {
                                await fetch(`${api.baseURL}/files/delete`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ source: filePath })
                                });
                                await loadDirectory(currentPath);
                            } catch (error) {
                                alert('Failed to delete: ' + error.message);
                            }
                        }
                    });
                });
            }

            content.querySelector('#item-count').textContent = `${files.length} items`;
            content.querySelector('#total-size').textContent = data.total_size;
        } catch (error) {
            alert('Error loading directory: ' + error.message);
        }
    }

    content.innerHTML = `
        <h2>📁 File Manager</h2>
        <div style="display: flex; gap: 12px; margin-bottom: 16px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px;">
            <button id="nav-back" style="padding: 6px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 4px; color: #8b5cf6; cursor: pointer;">← Back</button>
            <button id="nav-home" style="padding: 6px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 4px; color: #8b5cf6; cursor: pointer;">🏠</button>
            <input type="text" id="current-path" readonly style="flex: 1; padding: 6px 12px; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
            <button id="refresh" style="padding: 6px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 4px; color: #8b5cf6; cursor: pointer;">🔄</button>
            <button id="toggle-hidden" style="padding: 6px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 4px; color: #8b5cf6; cursor: pointer;">👁️</button>
            <button id="new-folder" style="padding: 6px 12px; background: rgba(34,197,94,0.2); border: none; border-radius: 4px; color: #22c55e; cursor: pointer;">+ New</button>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; overflow: hidden; max-height: 450px; overflow-y: auto;">
            <div style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr 80px; gap: 12px; padding: 12px; background: rgba(139,92,246,0.1); font-weight: 600; border-bottom: 1px solid rgba(139,92,246,0.3); position: sticky; top: 0;">
                <div>Name</div>
                <div>Type</div>
                <div>Size</div>
                <div>Modified</div>
                <div>Actions</div>
            </div>
            <div id="file-list"></div>
        </div>

        <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 6px;">
            <span id="item-count" style="opacity: 0.6;">0 items</span>
            <span id="total-size" style="opacity: 0.6;">0 B</span>
        </div>
    `;

    wm.createWindow('File Manager', content, { width: '1000px', height: '700px' });

    // Button event listeners
    content.querySelector('#nav-back').addEventListener('click', async () => {
        const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
        await loadDirectory(parent);
    });

    content.querySelector('#nav-home').addEventListener('click', async () => {
        await loadDirectory('/home/julius');
    });

    content.querySelector('#refresh').addEventListener('click', async () => {
        await loadDirectory(currentPath);
    });

    content.querySelector('#toggle-hidden').addEventListener('click', async () => {
        showHidden = !showHidden;
        await loadDirectory(currentPath);
    });

    content.querySelector('#new-folder').addEventListener('click', async () => {
        const folderName = prompt('Enter folder name:');
        if (folderName) {
            try {
                await fetch(`${api.baseURL}/files/create-folder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentPath, name: folderName })
                });
                await loadDirectory(currentPath);
            } catch (error) {
                alert('Failed to create folder: ' + error.message);
            }
        }
    });

    // Initial load
    await loadDirectory(currentPath);
}

function openCalculator() {
    const content = document.createElement('div');

    let display = '0';
    let currentValue = 0;
    let operator = null;
    let waitingForOperand = false;

    content.innerHTML = `
        <h2>🔢 Calculator</h2>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
            <div id="calc-display" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 6px; text-align: right; font-size: 32px; font-family: monospace; margin-bottom: 16px; min-height: 48px; border: 1px solid rgba(139,92,246,0.3);">0</div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                <button class="calc-btn" data-action="clear" style="grid-column: span 2; padding: 16px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 6px; color: #ef4444; cursor: pointer; font-size: 18px; font-weight: 600;">C</button>
                <button class="calc-btn" data-action="backspace" style="padding: 16px; background: rgba(251,191,36,0.2); border: 1px solid #fbbf24; border-radius: 6px; color: #fbbf24; cursor: pointer; font-size: 18px;">⌫</button>
                <button class="calc-btn" data-operator="/" style="padding: 16px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; border-radius: 6px; color: #8b5cf6; cursor: pointer; font-size: 18px;">÷</button>

                <button class="calc-btn" data-number="7" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">7</button>
                <button class="calc-btn" data-number="8" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">8</button>
                <button class="calc-btn" data-number="9" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">9</button>
                <button class="calc-btn" data-operator="*" style="padding: 16px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; border-radius: 6px; color: #8b5cf6; cursor: pointer; font-size: 18px;">×</button>

                <button class="calc-btn" data-number="4" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">4</button>
                <button class="calc-btn" data-number="5" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">5</button>
                <button class="calc-btn" data-number="6" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">6</button>
                <button class="calc-btn" data-operator="-" style="padding: 16px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; border-radius: 6px; color: #8b5cf6; cursor: pointer; font-size: 18px;">−</button>

                <button class="calc-btn" data-number="1" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">1</button>
                <button class="calc-btn" data-number="2" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">2</button>
                <button class="calc-btn" data-number="3" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">3</button>
                <button class="calc-btn" data-operator="+" style="padding: 16px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; border-radius: 6px; color: #8b5cf6; cursor: pointer; font-size: 18px;">+</button>

                <button class="calc-btn" data-number="0" style="grid-column: span 2; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">0</button>
                <button class="calc-btn" data-action="decimal" style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 18px;">.</button>
                <button class="calc-btn" data-action="equals" style="padding: 16px; background: rgba(34,197,94,0.2); border: 1px solid #22c55e; border-radius: 6px; color: #22c55e; cursor: pointer; font-size: 18px; font-weight: 600;">=</button>
            </div>
        </div>
    `;

    wm.createWindow('Calculator', content, { width: '400px', height: '600px' });

    const displayEl = content.querySelector('#calc-display');

    content.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.number) {
                if (waitingForOperand) {
                    display = btn.dataset.number;
                    waitingForOperand = false;
                } else {
                    display = display === '0' ? btn.dataset.number : display + btn.dataset.number;
                }
                displayEl.textContent = display;
            } else if (btn.dataset.operator) {
                const inputValue = parseFloat(display);
                if (operator && !waitingForOperand) {
                    const result = calculate(currentValue, inputValue, operator);
                    display = String(result);
                    currentValue = result;
                } else {
                    currentValue = inputValue;
                }
                operator = btn.dataset.operator;
                waitingForOperand = true;
                displayEl.textContent = display;
            } else if (btn.dataset.action === 'equals') {
                const inputValue = parseFloat(display);
                if (operator) {
                    const result = calculate(currentValue, inputValue, operator);
                    display = String(result);
                    currentValue = result;
                    operator = null;
                    waitingForOperand = true;
                    displayEl.textContent = display;
                }
            } else if (btn.dataset.action === 'clear') {
                display = '0';
                currentValue = 0;
                operator = null;
                waitingForOperand = false;
                displayEl.textContent = display;
            } else if (btn.dataset.action === 'backspace') {
                display = display.length > 1 ? display.slice(0, -1) : '0';
                displayEl.textContent = display;
            } else if (btn.dataset.action === 'decimal') {
                if (!display.includes('.')) {
                    display += '.';
                    displayEl.textContent = display;
                }
            }
        });
    });

    function calculate(a, b, op) {
        switch(op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : 0;
            default: return b;
        }
    }
}

function openSystemMonitor() {
    const content = document.createElement('div');

    content.innerHTML = `
        <h2>📊 System Monitor</h2>
        <div style="display: grid; gap: 16px;">
            <!-- CPU Usage -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600;">🖥️ CPU Usage</span>
                    <span id="cpu-percent" style="color: #8b5cf6; font-weight: 600;">0%</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; height: 24px;">
                    <div id="cpu-bar" style="background: linear-gradient(90deg, #8b5cf6, #a78bfa); height: 100%; width: 0%; transition: width 0.5s;"></div>
                </div>
            </div>

            <!-- Memory Usage -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600;">💾 Memory Usage</span>
                    <span id="mem-percent" style="color: #22c55e; font-weight: 600;">0%</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; height: 24px;">
                    <div id="mem-bar" style="background: linear-gradient(90deg, #22c55e, #4ade80); height: 100%; width: 0%; transition: width 0.5s;"></div>
                </div>
                <div style="margin-top: 8px; opacity: 0.6; font-size: 13px;">
                    <span id="mem-used">0</span> GB / <span id="mem-total">16</span> GB
                </div>
            </div>

            <!-- Disk Usage -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600;">💽 Disk Usage</span>
                    <span id="disk-percent" style="color: #fbbf24; font-weight: 600;">0%</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; height: 24px;">
                    <div id="disk-bar" style="background: linear-gradient(90deg, #fbbf24, #fcd34d); height: 100%; width: 0%; transition: width 0.5s;"></div>
                </div>
                <div style="margin-top: 8px; opacity: 0.6; font-size: 13px;">
                    <span id="disk-used">0</span> GB / <span id="disk-total">500</span> GB
                </div>
            </div>

            <!-- Network -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
                <div style="font-weight: 600; margin-bottom: 12px;">🌐 Network</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <div style="opacity: 0.6; font-size: 13px;">↓ Download</div>
                        <div id="net-down" style="font-size: 20px; color: #22c55e; font-weight: 600;">0 KB/s</div>
                    </div>
                    <div>
                        <div style="opacity: 0.6; font-size: 13px;">↑ Upload</div>
                        <div id="net-up" style="font-size: 20px; color: #8b5cf6; font-weight: 600;">0 KB/s</div>
                    </div>
                </div>
            </div>

            <!-- Processes -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
                <div style="font-weight: 600; margin-bottom: 12px;">⚙️ Top Processes</div>
                <div style="font-size: 13px;">
                    ${[
                        { name: 'JuliOS Desktop', cpu: '12%', mem: '245 MB' },
                        { name: 'Python Agent Service', cpu: '8%', mem: '180 MB' },
                        { name: 'FastAPI Server', cpu: '5%', mem: '120 MB' },
                        { name: 'System Monitor', cpu: '3%', mem: '85 MB' }
                    ].map(proc => `
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div>${proc.name}</div>
                            <div style="text-align: center; color: #8b5cf6;">${proc.cpu}</div>
                            <div style="text-align: right; color: #22c55e;">${proc.mem}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    wm.createWindow('System Monitor', content, { width: '700px', height: '700px' });

    // Simulate live updates
    function updateStats() {
        const cpu = Math.floor(Math.random() * 60) + 20;
        const mem = Math.floor(Math.random() * 40) + 30;
        const disk = Math.floor(Math.random() * 20) + 50;
        const netDown = Math.floor(Math.random() * 500) + 100;
        const netUp = Math.floor(Math.random() * 200) + 50;

        const cpuBar = content.querySelector('#cpu-bar');
        const memBar = content.querySelector('#mem-bar');
        const diskBar = content.querySelector('#disk-bar');

        if (cpuBar) {
            content.querySelector('#cpu-percent').textContent = cpu + '%';
            cpuBar.style.width = cpu + '%';

            content.querySelector('#mem-percent').textContent = mem + '%';
            memBar.style.width = mem + '%';
            content.querySelector('#mem-used').textContent = (mem * 0.16).toFixed(1);

            content.querySelector('#disk-percent').textContent = disk + '%';
            diskBar.style.width = disk + '%';
            content.querySelector('#disk-used').textContent = (disk * 5).toFixed(0);

            content.querySelector('#net-down').textContent = netDown + ' KB/s';
            content.querySelector('#net-up').textContent = netUp + ' KB/s';
        }
    }

    updateStats();
    const interval = setInterval(updateStats, 2000);

    // Clean up on window close
    content.addEventListener('DOMNodeRemovedFromDocument', () => {
        clearInterval(interval);
    });
}

// ================================
// PRODUCTIVITY APPS
// ================================

function openEmail() {
    const content = document.createElement('div');

    let currentFolder = 'inbox';
    let selectedEmail = null;
    let searchQuery = '';
    let viewMode = 'list'; // 'list' or 'compose' or 'read'
    let composeMode = 'new'; // 'new' or 'draft'
    let draftId = null;

    // Load emails from localStorage
    function loadEmails() {
        const stored = localStorage.getItem('julios_emails');
        if (!stored) {
            // Initialize with sample emails
            const initialEmails = [
                {
                    id: Date.now() - 5000,
                    from: 'system@julios.local',
                    to: 'me@julios.local',
                    subject: 'Welcome to JuliOS Email',
                    body: 'Welcome to your local email client! You can compose, read, and manage emails stored on your device.\n\nThis is a fully functional email app that stores all messages locally using localStorage.',
                    timestamp: Date.now() - 3600000,
                    folder: 'inbox',
                    unread: true,
                    starred: false
                },
                {
                    id: Date.now() - 4000,
                    from: 'notifications@julios.local',
                    to: 'me@julios.local',
                    subject: 'Getting Started with Desktop Mode',
                    body: 'Your JuliOS desktop environment is ready to use!\n\nAll apps now have real functionality:\n- File Manager: Browse your actual files\n- Terminal: Execute real commands\n- Text Editor: Edit actual files\n- Photo Viewer: View your images\n- Music Player: Play your audio files\n- Calendar: Manage your events\n\nEnjoy your new OS!',
                    timestamp: Date.now() - 7200000,
                    folder: 'inbox',
                    unread: false,
                    starred: true
                }
            ];
            localStorage.setItem('julios_emails', JSON.stringify(initialEmails));
            return initialEmails;
        }
        return JSON.parse(stored);
    }

    function saveEmails(emails) {
        localStorage.setItem('julios_emails', JSON.stringify(emails));
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than a day
        if (diff < 86400000) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        // Less than a week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return days === 1 ? 'Yesterday' : `${days} days ago`;
        }
        // Older
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getFilteredEmails() {
        let emails = loadEmails();

        // Filter by folder
        if (currentFolder === 'starred') {
            emails = emails.filter(e => e.starred && e.folder !== 'trash');
        } else {
            emails = emails.filter(e => e.folder === currentFolder);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            emails = emails.filter(e =>
                e.subject.toLowerCase().includes(query) ||
                e.from.toLowerCase().includes(query) ||
                e.body.toLowerCase().includes(query)
            );
        }

        // Sort by timestamp (newest first)
        return emails.sort((a, b) => b.timestamp - a.timestamp);
    }

    function sendEmail(to, subject, body, isDraft = false) {
        const emails = loadEmails();
        const email = {
            id: draftId || Date.now(),
            from: 'me@julios.local',
            to: to,
            subject: subject,
            body: body,
            timestamp: Date.now(),
            folder: isDraft ? 'drafts' : 'sent',
            unread: false,
            starred: false
        };

        if (draftId) {
            // Update existing draft
            const index = emails.findIndex(e => e.id === draftId);
            if (index >= 0) emails[index] = email;
        } else {
            emails.push(email);
        }

        saveEmails(emails);
        return email;
    }

    function deleteEmail(id) {
        const emails = loadEmails();
        const email = emails.find(e => e.id === id);
        if (email) {
            if (email.folder === 'trash') {
                // Permanently delete
                saveEmails(emails.filter(e => e.id !== id));
            } else {
                // Move to trash
                email.folder = 'trash';
                saveEmails(emails);
            }
        }
    }

    function toggleStar(id) {
        const emails = loadEmails();
        const email = emails.find(e => e.id === id);
        if (email) {
            email.starred = !email.starred;
            saveEmails(emails);
        }
    }

    function markAsRead(id) {
        const emails = loadEmails();
        const email = emails.find(e => e.id === id);
        if (email) {
            email.unread = false;
            saveEmails(emails);
        }
    }

    function getUnreadCount() {
        return loadEmails().filter(e => e.folder === 'inbox' && e.unread).length;
    }

    function renderEmailList() {
        const emails = getFilteredEmails();
        const unreadCount = getUnreadCount();

        const folderLabels = {
            inbox: '📥 Inbox',
            sent: '📤 Sent',
            drafts: '📝 Drafts',
            starred: '⭐ Starred',
            trash: '🗑️ Trash'
        };

        content.innerHTML = `
            <h2>📧 Email</h2>
            <div style="display: grid; grid-template-columns: 250px 1fr; gap: 16px; height: 550px;">
                <!-- Sidebar -->
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
                    <button id="compose-btn" style="width: 100%; padding: 12px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600; margin-bottom: 16px;">✉️ Compose</button>

                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${['inbox', 'sent', 'drafts', 'starred', 'trash'].map(folder => {
                            const count = folder === 'inbox' ? unreadCount : (folder === 'drafts' ? loadEmails().filter(e => e.folder === 'drafts').length : 0);
                            const isActive = currentFolder === folder;
                            return `
                                <div class="folder-item" data-folder="${folder}" style="padding: 10px; border-radius: 6px; cursor: pointer; ${isActive ? 'background: rgba(139,92,246,0.2); font-weight: 600; color: #8b5cf6;' : 'opacity: 0.7;'}"
                                     onmouseover="if (!${isActive}) this.style.background='rgba(139,92,246,0.1)'"
                                     onmouseout="if (!${isActive}) this.style.background='transparent'">
                                    ${folderLabels[folder]}${count > 0 ? ` (${count})` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Email List -->
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; overflow: hidden;">
                    <div style="padding: 16px; border-bottom: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.05);">
                        <input type="text" id="search-input" placeholder="🔍 Search emails..." value="${searchQuery}" style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                    </div>
                    <div style="overflow-y: auto; height: calc(100% - 70px);">
                        ${emails.length === 0 ? `
                            <div style="text-align: center; padding: 60px 20px; opacity: 0.6;">
                                <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                                <div>No emails in ${folderLabels[currentFolder]}</div>
                            </div>
                        ` : emails.map(email => `
                            <div class="email-item" data-email-id="${email.id}" style="padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; ${email.unread ? 'background: rgba(139,92,246,0.05);' : ''}"
                                 onmouseover="this.style.background='rgba(139,92,246,0.1)'"
                                 onmouseout="this.style.background='${email.unread ? 'rgba(139,92,246,0.05)' : 'transparent'}'">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <span style="color: #8b5cf6; ${email.unread ? 'font-weight: 600;' : ''}">${email.from}</span>
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        ${email.starred ? '<span style="color: #fbbf24;">⭐</span>' : ''}
                                        <span style="opacity: 0.6; font-size: 13px;">${formatTimestamp(email.timestamp)}</span>
                                    </div>
                                </div>
                                <div style="${email.unread ? 'color: #e0e0e0; font-weight: 600;' : 'opacity: 0.8;'}">${email.subject || '(No subject)'}</div>
                                <div style="opacity: 0.6; font-size: 13px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${email.body.substring(0, 100)}${email.body.length > 100 ? '...' : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        content.querySelector('#compose-btn').addEventListener('click', () => {
            composeMode = 'new';
            draftId = null;
            renderCompose();
        });

        content.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                currentFolder = item.dataset.folder;
                renderEmailList();
            });
        });

        content.querySelectorAll('.email-item').forEach(item => {
            item.addEventListener('click', () => {
                const emailId = parseInt(item.dataset.emailId);
                selectedEmail = loadEmails().find(e => e.id === emailId);
                if (selectedEmail) {
                    markAsRead(emailId);
                    renderEmailView();
                }
            });
        });

        const searchInput = content.querySelector('#search-input');
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderEmailList();
        });
    }

    function renderEmailView() {
        if (!selectedEmail) {
            renderEmailList();
            return;
        }

        content.innerHTML = `
            <h2>📧 Email</h2>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px; height: 550px; display: flex; flex-direction: column;">
                <!-- Toolbar -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(139,92,246,0.2);">
                    <button id="back-btn" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">← Back</button>
                    <button id="delete-btn" style="padding: 8px 16px; background: rgba(239,68,68,0.2); border: none; border-radius: 6px; color: #ef4444; cursor: pointer;">🗑️ Delete</button>
                    <button id="star-btn" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: ${selectedEmail.starred ? '#fbbf24' : '#8b5cf6'}; cursor: pointer;">${selectedEmail.starred ? '⭐' : '☆'} ${selectedEmail.starred ? 'Starred' : 'Star'}</button>
                    ${selectedEmail.folder === 'drafts' ? '<button id="edit-draft-btn" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">✏️ Edit Draft</button>' : ''}
                </div>

                <!-- Email Header -->
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(139,92,246,0.2);">
                    <h3 style="margin: 0 0 12px 0; color: #8b5cf6;">${selectedEmail.subject || '(No subject)'}</h3>
                    <div style="display: grid; grid-template-columns: 80px 1fr; gap: 8px; font-size: 14px;">
                        <div style="opacity: 0.6;">From:</div>
                        <div>${selectedEmail.from}</div>
                        <div style="opacity: 0.6;">To:</div>
                        <div>${selectedEmail.to}</div>
                        <div style="opacity: 0.6;">Date:</div>
                        <div>${new Date(selectedEmail.timestamp).toLocaleString()}</div>
                    </div>
                </div>

                <!-- Email Body -->
                <div style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 20px; white-space: pre-wrap; line-height: 1.6;">
${selectedEmail.body}
                </div>
            </div>
        `;

        // Event listeners
        content.querySelector('#back-btn').addEventListener('click', renderEmailList);

        content.querySelector('#delete-btn').addEventListener('click', () => {
            if (confirm('Delete this email?')) {
                deleteEmail(selectedEmail.id);
                selectedEmail = null;
                renderEmailList();
            }
        });

        content.querySelector('#star-btn').addEventListener('click', () => {
            toggleStar(selectedEmail.id);
            selectedEmail.starred = !selectedEmail.starred;
            renderEmailView();
        });

        const editDraftBtn = content.querySelector('#edit-draft-btn');
        if (editDraftBtn) {
            editDraftBtn.addEventListener('click', () => {
                composeMode = 'draft';
                draftId = selectedEmail.id;
                renderCompose(selectedEmail.to, selectedEmail.subject, selectedEmail.body);
            });
        }
    }

    function renderCompose(toValue = '', subjectValue = '', bodyValue = '') {
        content.innerHTML = `
            <h2>📧 Email - ${composeMode === 'draft' ? 'Edit Draft' : 'Compose'}</h2>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px; height: 550px; display: flex; flex-direction: column;">
                <!-- Toolbar -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(139,92,246,0.2);">
                    <button id="cancel-btn" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">← Cancel</button>
                    <button id="send-btn" style="padding: 8px 20px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">📤 Send</button>
                    <button id="save-draft-btn" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">💾 Save Draft</button>
                </div>

                <!-- Compose Form -->
                <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; opacity: 0.6; font-size: 13px;">To:</label>
                        <input type="text" id="to-input" value="${toValue}" placeholder="recipient@example.com" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; opacity: 0.6; font-size: 13px;">Subject:</label>
                        <input type="text" id="subject-input" value="${subjectValue}" placeholder="Email subject..." style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <label style="display: block; margin-bottom: 4px; opacity: 0.6; font-size: 13px;">Message:</label>
                        <textarea id="body-input" placeholder="Write your message..." style="flex: 1; padding: 12px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; font-family: inherit; resize: none;">${bodyValue}</textarea>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        content.querySelector('#cancel-btn').addEventListener('click', () => {
            if (confirm('Discard this email?')) {
                draftId = null;
                renderEmailList();
            }
        });

        content.querySelector('#send-btn').addEventListener('click', () => {
            const to = content.querySelector('#to-input').value.trim();
            const subject = content.querySelector('#subject-input').value.trim();
            const body = content.querySelector('#body-input').value.trim();

            if (!to) {
                alert('Please enter a recipient');
                return;
            }

            sendEmail(to, subject, body, false);
            draftId = null;
            currentFolder = 'sent';
            renderEmailList();
        });

        content.querySelector('#save-draft-btn').addEventListener('click', () => {
            const to = content.querySelector('#to-input').value.trim();
            const subject = content.querySelector('#subject-input').value.trim();
            const body = content.querySelector('#body-input').value.trim();

            sendEmail(to, subject, body, true);
            draftId = null;
            currentFolder = 'drafts';
            renderEmailList();
        });
    }

    wm.createWindow('Email', content, { width: '1100px', height: '700px' });
    renderEmailList();
}

function openCalendar() {
    const content = document.createElement('div');

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    let viewMonth = today.getMonth();
    let viewYear = today.getFullYear();

    // Load events from localStorage
    function loadEvents() {
        const stored = localStorage.getItem('julios_calendar_events');
        return stored ? JSON.parse(stored) : [];
    }

    function saveEvents(events) {
        localStorage.setItem('julios_calendar_events', JSON.stringify(events));
    }

    function getEventsForDate(year, month, day) {
        const events = loadEvents();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    }

    function addEvent(year, month, day, title, time = '') {
        const events = loadEvents();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        events.push({
            id: Date.now(),
            date: dateStr,
            title: title,
            time: time
        });
        saveEvents(events);
    }

    function deleteEvent(id) {
        const events = loadEvents();
        saveEvents(events.filter(e => e.id !== id));
    }

    function renderCalendar() {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

        content.innerHTML = `
            <h2>📅 Calendar</h2>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <button id="prev-month" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">← Prev</button>
                    <h3 style="margin: 0; color: #8b5cf6;">${months[viewMonth]} ${viewYear}</h3>
                    <button id="next-month" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">Next →</button>
                </div>

                <!-- Calendar Grid -->
                <div id="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: rgba(139,92,246,0.2); border-radius: 8px; overflow: hidden;">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
                        `<div style="padding: 12px; background: rgba(139,92,246,0.2); text-align: center; font-weight: 600; color: #8b5cf6;">${day}</div>`
                    ).join('')}

                    ${Array(firstDay).fill(0).map(() =>
                        '<div style="padding: 12px; background: rgba(255,255,255,0.02); min-height: 80px;"></div>'
                    ).join('')}

                    ${Array.from({length: daysInMonth}, (_, i) => {
                        const day = i + 1;
                        const isToday = isCurrentMonth && day === today.getDate();
                        const dayEvents = getEventsForDate(viewYear, viewMonth, day);

                        return `
                            <div class="calendar-day" data-day="${day}" style="padding: 12px; background: rgba(255,255,255,0.03); min-height: 80px; cursor: pointer; position: relative; ${isToday ? 'border: 2px solid #8b5cf6;' : ''}"
                                 onmouseover="this.style.background='rgba(139,92,246,0.1)'"
                                 onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                <div style="font-weight: 600; margin-bottom: 4px; ${isToday ? 'color: #8b5cf6;' : ''}">${day}</div>
                                ${dayEvents.map(evt => `
                                    <div class="event-chip" data-event-id="${evt.id}" style="font-size: 10px; background: rgba(139,92,246,0.4); padding: 3px 6px; border-radius: 4px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;"
                                         onclick="event.stopPropagation();"
                                         onmouseover="this.style.background='rgba(139,92,246,0.6)'"
                                         onmouseout="this.style.background='rgba(139,92,246,0.4)'"
                                         title="${evt.time ? evt.time + ' - ' : ''}${evt.title}">
                                        ${evt.time ? evt.time.substring(0, 5) + ' ' : ''}${evt.title}
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Upcoming Events -->
                <div style="margin-top: 20px; padding: 16px; background: rgba(139,92,246,0.05); border-radius: 8px;">
                    <h4 style="margin: 0 0 12px 0;">All Events</h4>
                    <div id="events-list" style="max-height: 200px; overflow-y: auto;">
                        ${(() => {
                            const allEvents = loadEvents().sort((a, b) => a.date.localeCompare(b.date));
                            if (allEvents.length === 0) {
                                return '<div style="opacity: 0.6; text-align: center; padding: 20px;">No events scheduled</div>';
                            }
                            return allEvents.map(evt => {
                                const [year, month, day] = evt.date.split('-').map(Number);
                                return `
                                    <div style="padding: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 3px solid #8b5cf6; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600;">${months[month - 1]} ${day}, ${year}</div>
                                            <div style="opacity: 0.8; font-size: 14px;">${evt.time ? evt.time + ' - ' : ''}${evt.title}</div>
                                        </div>
                                        <button class="delete-event" data-event-id="${evt.id}" style="padding: 6px 12px; background: rgba(239,68,68,0.2); border: none; border-radius: 6px; color: #ef4444; cursor: pointer; font-size: 12px;"
                                                onmouseover="this.style.background='rgba(239,68,68,0.3)'"
                                                onmouseout="this.style.background='rgba(239,68,68,0.2)'">
                                            🗑️ Delete
                                        </button>
                                    </div>
                                `;
                            }).join('');
                        })()}
                    </div>
                </div>
            </div>
        `;

        // Event listeners for month navigation
        content.querySelector('#prev-month').addEventListener('click', () => {
            viewMonth--;
            if (viewMonth < 0) {
                viewMonth = 11;
                viewYear--;
            }
            renderCalendar();
        });

        content.querySelector('#next-month').addEventListener('click', () => {
            viewMonth++;
            if (viewMonth > 11) {
                viewMonth = 0;
                viewYear++;
            }
            renderCalendar();
        });

        // Event listeners for adding events
        content.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const day = parseInt(dayEl.dataset.day);
                const eventTitle = prompt(`Add event for ${months[viewMonth]} ${day}, ${viewYear}:`);
                if (eventTitle && eventTitle.trim()) {
                    const eventTime = prompt('Event time (optional, e.g., 10:00 AM):', '');
                    addEvent(viewYear, viewMonth, day, eventTitle.trim(), eventTime || '');
                    renderCalendar();
                }
            });
        });

        // Event listeners for deleting events
        content.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', () => {
                const eventId = parseInt(btn.dataset.eventId);
                if (confirm('Delete this event?')) {
                    deleteEvent(eventId);
                    renderCalendar();
                }
            });
        });

        // Event listeners for clicking event chips (show details)
        content.querySelectorAll('.event-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const eventId = parseInt(chip.dataset.eventId);
                const event = loadEvents().find(e => e.id === eventId);
                if (event) {
                    if (confirm(`Event: ${event.title}\nDate: ${event.date}\nTime: ${event.time || 'Not set'}\n\nDelete this event?`)) {
                        deleteEvent(eventId);
                        renderCalendar();
                    }
                }
            });
        });
    }

    wm.createWindow('Calendar', content, { width: '900px', height: '800px' });
    renderCalendar();
}

async function openTextEditor(initialPath = null) {
    const content = document.createElement('div');
    let currentPath = initialPath;
    let isModified = false;

    content.innerHTML = `
        <h2>📝 Text Editor</h2>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
            <div style="display: flex; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(139,92,246,0.2);">
                <button id="new-file" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">📄 New</button>
                <button id="open-file" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">📁 Open</button>
                <button id="save-text" style="padding: 8px 16px; background: rgba(34,197,94,0.2); border: none; border-radius: 6px; color: #22c55e; cursor: pointer;">💾 Save</button>
                <button id="save-as" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">💾 Save As...</button>
                <div style="flex: 1;"></div>
                <input type="text" id="filename" placeholder="/home/julius/document.txt" style="padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; min-width: 300px; flex: 1;">
            </div>

            <textarea id="text-content" style="width: 100%; height: 450px; padding: 16px; border-radius: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; resize: vertical;" placeholder="Start typing or open a file..."></textarea>

            <div style="margin-top: 12px; display: flex; justify-content: space-between; opacity: 0.6; font-size: 13px;">
                <span id="file-status">New file</span>
                <div style="display: flex; gap: 16px;">
                    <span id="char-count">0 characters</span>
                    <span id="word-count">0 words</span>
                </div>
            </div>
        </div>
    `;

    wm.createWindow('Text Editor', content, { width: '900px', height: '700px' });

    const textarea = content.querySelector('#text-content');
    const filenameInput = content.querySelector('#filename');
    const charCount = content.querySelector('#char-count');
    const wordCount = content.querySelector('#word-count');
    const fileStatus = content.querySelector('#file-status');

    function updateCounts() {
        const text = textarea.value;
        charCount.textContent = text.length + ' characters';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        wordCount.textContent = words + ' words';
    }

    textarea.addEventListener('input', () => {
        isModified = true;
        fileStatus.textContent = currentPath ? `Modified: ${currentPath}` : 'New file (modified)';
        updateCounts();
    });

    // New file
    content.querySelector('#new-file').addEventListener('click', () => {
        if (isModified && !confirm('Discard unsaved changes?')) return;
        textarea.value = '';
        currentPath = null;
        filenameInput.value = '';
        isModified = false;
        fileStatus.textContent = 'New file';
        updateCounts();
    });

    // Open file
    content.querySelector('#open-file').addEventListener('click', async () => {
        if (isModified && !confirm('Discard unsaved changes?')) return;

        const path = prompt('Enter file path to open:', '/home/julius/');
        if (!path) return;

        try {
            const response = await fetch(`${api.baseURL}/files/read?path=${encodeURIComponent(path)}`);
            if (!response.ok) throw new Error('Failed to read file');

            const data = await response.json();
            textarea.value = data.content;
            currentPath = data.path;
            filenameInput.value = currentPath;
            isModified = false;
            fileStatus.textContent = `Loaded: ${currentPath}`;
            updateCounts();
        } catch (error) {
            alert(`Error opening file: ${error.message}`);
        }
    });

    // Save file
    async function saveFile(path) {
        try {
            const response = await fetch(`${api.baseURL}/files/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: path,
                    content: textarea.value
                })
            });

            if (!response.ok) throw new Error('Failed to save file');

            const data = await response.json();
            currentPath = data.path;
            filenameInput.value = currentPath;
            isModified = false;
            fileStatus.textContent = `Saved: ${currentPath}`;
            alert(`File saved successfully: ${currentPath}`);
        } catch (error) {
            alert(`Error saving file: ${error.message}`);
        }
    }

    content.querySelector('#save-text').addEventListener('click', async () => {
        if (currentPath) {
            await saveFile(currentPath);
        } else {
            // Prompt for filename if new file
            const path = filenameInput.value.trim() || prompt('Enter file path:', '/home/julius/document.txt');
            if (path) {
                await saveFile(path);
            }
        }
    });

    content.querySelector('#save-as').addEventListener('click', async () => {
        const path = prompt('Save as:', currentPath || '/home/julius/document.txt');
        if (path) {
            await saveFile(path);
        }
    });

    // Load initial file if provided
    if (initialPath) {
        try {
            const response = await fetch(`${api.baseURL}/files/read?path=${encodeURIComponent(initialPath)}`);
            if (response.ok) {
                const data = await response.json();
                textarea.value = data.content;
                currentPath = data.path;
                filenameInput.value = currentPath;
                fileStatus.textContent = `Loaded: ${currentPath}`;
                updateCounts();
            }
        } catch (error) {
            console.error('Failed to load initial file:', error);
        }
    }

    updateCounts();
    textarea.focus();
}

// ================================
// MEDIA APPS
// ================================

async function openMusicPlayer(initialPath = '/home/julius/Music') {
    const content = document.createElement('div');

    let currentPath = initialPath;
    let playlist = [];
    let currentIndex = -1;
    let isPlaying = false;

    const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];

    const audioElement = new Audio();

    function isAudioFile(filename) {
        return AUDIO_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
    }

    function formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async function loadPlaylist(path) {
        try {
            const response = await fetch(`${api.baseURL}/files/list?path=${encodeURIComponent(path)}`);
            if (!response.ok) {
                // Try home directory if path doesn't exist
                path = '/home/julius';
                const homeResponse = await fetch(`${api.baseURL}/files/list?path=${encodeURIComponent(path)}`);
                const homeData = await homeResponse.json();
                currentPath = path;
                playlist = homeData.files.filter(f => f.type === 'file' && isAudioFile(f.name));
            } else {
                const data = await response.json();
                currentPath = data.current_path;
                playlist = data.files.filter(f => f.type === 'file' && isAudioFile(f.name));
            }

            renderPlayer();
        } catch (error) {
            console.error('Error loading playlist:', error);
            showStatus('Error loading playlist: ' + error.message, 'error');
        }
    }

    function showStatus(message, type = 'info') {
        const statusEl = content.querySelector('#status-message');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = type === 'error' ? '#ef4444' : '#22c55e';
            setTimeout(() => statusEl.textContent = '', 3000);
        }
    }

    function playTrack(index) {
        if (index < 0 || index >= playlist.length) return;

        currentIndex = index;
        const track = playlist[index];

        audioElement.src = `file://${track.path}`;
        audioElement.load();
        audioElement.play()
            .then(() => {
                isPlaying = true;
                renderPlayer();
            })
            .catch(err => {
                showStatus('Error playing audio: ' + err.message, 'error');
                isPlaying = false;
            });
    }

    function togglePlayPause() {
        if (currentIndex === -1 && playlist.length > 0) {
            playTrack(0);
            return;
        }

        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
        } else {
            audioElement.play()
                .then(() => isPlaying = true)
                .catch(err => showStatus('Error playing: ' + err.message, 'error'));
        }
        updatePlayPauseButton();
    }

    function updatePlayPauseButton() {
        const btn = content.querySelector('#play-pause');
        if (btn) btn.textContent = isPlaying ? '⏸️' : '▶️';
    }

    function updateProgress() {
        const progressBar = content.querySelector('#music-progress');
        const currentTimeEl = content.querySelector('#current-time');
        const totalTimeEl = content.querySelector('#total-time');

        if (progressBar && audioElement.duration) {
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            progressBar.style.width = progress + '%';
        }

        if (currentTimeEl) currentTimeEl.textContent = formatTime(audioElement.currentTime);
        if (totalTimeEl) totalTimeEl.textContent = formatTime(audioElement.duration);
    }

    function renderPlayer() {
        const currentTrack = currentIndex >= 0 ? playlist[currentIndex] : null;
        const hasPlaylist = playlist.length > 0;

        content.innerHTML = `
            <h2>🎵 Music Player</h2>

            <!-- Toolbar -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 12px; margin-bottom: 12px; display: flex; gap: 8px; align-items: center;">
                <button id="change-folder" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">📁 Change Folder</button>
                <button id="refresh" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">🔄 Refresh</button>
                <div style="flex: 1; opacity: 0.6; font-size: 13px; padding: 0 12px;">
                    ${currentPath} • ${playlist.length} track${playlist.length !== 1 ? 's' : ''}
                </div>
                <div id="status-message" style="font-size: 13px; font-weight: 600;"></div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
                <!-- Now Playing -->
                <div style="text-align: center; padding: 40px 20px; background: rgba(139,92,246,0.05); border-radius: 8px; margin-bottom: 20px;">
                    <div style="width: 200px; height: 200px; margin: 0 auto 20px; background: linear-gradient(135deg, #8b5cf6, #a78bfa); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 80px;">🎵</div>
                    <h3 style="margin: 0 0 8px 0; color: #8b5cf6;">${currentTrack ? currentTrack.name : 'No track selected'}</h3>
                    <div style="opacity: 0.8;">${currentTrack ? currentTrack.size : ''}</div>

                    <!-- Progress Bar -->
                    <div style="margin: 24px 0; padding: 0 40px;">
                        <div style="background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; height: 8px; margin-bottom: 8px;">
                            <div id="music-progress" style="background: linear-gradient(90deg, #8b5cf6, #a78bfa); height: 100%; width: 0%; transition: width 0.1s;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; opacity: 0.6; font-size: 13px;">
                            <span id="current-time">0:00</span>
                            <span id="total-time">0:00</span>
                        </div>
                    </div>

                    <!-- Controls -->
                    <div style="display: flex; justify-content: center; gap: 16px; align-items: center;">
                        <button id="prev-btn" style="padding: 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 50%; color: #8b5cf6; cursor: pointer; width: 48px; height: 48px; font-size: 18px;" ${!hasPlaylist || currentIndex <= 0 ? 'disabled style="opacity: 0.3;"' : ''}>⏮️</button>
                        <button id="play-pause" style="padding: 16px; background: #8b5cf6; border: none; border-radius: 50%; color: white; cursor: pointer; width: 64px; height: 64px; font-size: 24px;" ${!hasPlaylist ? 'disabled style="opacity: 0.3;"' : ''}>${isPlaying ? '⏸️' : '▶️'}</button>
                        <button id="next-btn" style="padding: 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 50%; color: #8b5cf6; cursor: pointer; width: 48px; height: 48px; font-size: 18px;" ${!hasPlaylist || currentIndex >= playlist.length - 1 ? 'disabled style="opacity: 0.3;"' : ''}>⏭️</button>
                    </div>
                </div>

                <!-- Playlist -->
                ${hasPlaylist ? `
                    <div>
                        <h4 style="margin: 0 0 12px 0;">Playlist</h4>
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; overflow: hidden; max-height: 300px; overflow-y: auto;">
                            ${playlist.map((track, i) => `
                                <div class="track-item" data-index="${i}" style="display: grid; grid-template-columns: 40px 3fr 1fr; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; ${i === currentIndex ? 'background: rgba(139,92,246,0.2);' : ''}"
                                     onmouseover="if (${i} !== ${currentIndex}) this.style.background='rgba(139,92,246,0.1)'"
                                     onmouseout="this.style.background='${i === currentIndex ? 'rgba(139,92,246,0.2)' : 'transparent'}'">
                                    <div style="text-align: center; opacity: 0.6;">${i === currentIndex && isPlaying ? '▶️' : i + 1}</div>
                                    <div>
                                        <div style="${i === currentIndex ? 'color: #8b5cf6; font-weight: 600;' : ''}">${track.name}</div>
                                        <div style="opacity: 0.6; font-size: 13px;">${track.modified}</div>
                                    </div>
                                    <div style="text-align: right; opacity: 0.6;">${track.size}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 40px; opacity: 0.6;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
                        <div>No audio files found in ${currentPath}</div>
                        <button id="select-folder" style="margin-top: 16px; padding: 10px 20px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">Select Different Folder</button>
                    </div>
                `}
            </div>
        `;

        // Event listeners
        const changeFolderBtn = content.querySelector('#change-folder');
        const refreshBtn = content.querySelector('#refresh');
        const playPauseBtn = content.querySelector('#play-pause');
        const prevBtn = content.querySelector('#prev-btn');
        const nextBtn = content.querySelector('#next-btn');
        const selectFolderBtn = content.querySelector('#select-folder');

        if (changeFolderBtn) {
            changeFolderBtn.addEventListener('click', async () => {
                const newPath = prompt('Enter folder path:', currentPath);
                if (newPath) {
                    audioElement.pause();
                    isPlaying = false;
                    currentIndex = -1;
                    await loadPlaylist(newPath);
                }
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => loadPlaylist(currentPath));
        }

        if (playPauseBtn && !playPauseBtn.disabled) {
            playPauseBtn.addEventListener('click', togglePlayPause);
        }

        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener('click', () => playTrack(currentIndex - 1));
        }

        if (nextBtn && !nextBtn.disabled) {
            nextBtn.addEventListener('click', () => playTrack(currentIndex + 1));
        }

        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', async () => {
                const newPath = prompt('Enter folder path:', currentPath);
                if (newPath) await loadPlaylist(newPath);
            });
        }

        // Track item click handlers
        content.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                playTrack(index);
            });
        });
    }

    // Audio event listeners
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', () => {
        if (currentIndex < playlist.length - 1) {
            playTrack(currentIndex + 1);
        } else {
            isPlaying = false;
            updatePlayPauseButton();
        }
    });
    audioElement.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
    });
    audioElement.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });

    wm.createWindow('Music Player', content, { width: '700px', height: '850px' });

    // Load initial playlist
    await loadPlaylist(currentPath);

    // Clean up on window close
    const observer = new MutationObserver((mutations) => {
        if (!document.body.contains(content)) {
            audioElement.pause();
            audioElement.src = '';
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function openVideoPlayer() {
    const content = document.createElement('div');

    const videos = [
        { title: 'Building a Custom OS', channel: 'Tech Talk', views: '125K', duration: '15:42', thumbnail: '🖥️' },
        { title: 'Python FastAPI Tutorial', channel: 'Code Academy', views: '89K', duration: '22:15', thumbnail: '🐍' },
        { title: 'Linux Command Line Basics', channel: 'Linux Master', views: '234K', duration: '18:30', thumbnail: '🐧' },
        { title: 'React Desktop Apps', channel: 'Frontend Dev', views: '156K', duration: '25:45', thumbnail: '⚛️' }
    ];

    content.innerHTML = `
        <h2>🎬 Video Player</h2>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
            <!-- Video Player -->
            <div style="background: rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <div style="aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; font-size: 80px; background: linear-gradient(135deg, #1a1a2e, #2a2a3e);">
                    🎬
                </div>
                <div style="padding: 16px; background: rgba(0,0,0,0.3);">
                    <h3 style="margin: 0 0 8px 0;">Sample Video - JuliOS Demo</h3>
                    <div style="display: flex; justify-content: space-between; opacity: 0.6; font-size: 13px; margin-bottom: 16px;">
                        <span>Tech Channel • 10K views • 2 days ago</span>
                    </div>

                    <!-- Video Controls -->
                    <div style="margin-bottom: 12px;">
                        <div style="background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; height: 6px; margin-bottom: 8px;">
                            <div style="background: #8b5cf6; height: 100%; width: 42%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; opacity: 0.6; font-size: 12px;">
                            <span>2:35</span>
                            <span>6:12</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button style="padding: 10px 20px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 16px;">▶️ Play</button>
                        <button style="padding: 10px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">⏮️</button>
                        <button style="padding: 10px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">⏭️</button>
                        <div style="flex: 1;"></div>
                        <button style="padding: 10px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">🔊</button>
                        <button style="padding: 10px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">⚙️</button>
                        <button style="padding: 10px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">⛶</button>
                    </div>
                </div>
            </div>

            <!-- Video Library -->
            <div>
                <h4 style="margin: 0 0 12px 0;">Up Next</h4>
                <div style="display: grid; gap: 12px; max-height: 300px; overflow-y: auto;">
                    ${videos.map(video => `
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; cursor: pointer;"
                             onmouseover="this.style.background='rgba(139,92,246,0.1)'"
                             onmouseout="this.style.background='rgba(255,255,255,0.02)'"
                             onclick="alert('Playing: ${video.title}')">
                            <div style="aspect-ratio: 16/9; background: linear-gradient(135deg, #8b5cf6, #a78bfa); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 40px; position: relative;">
                                ${video.thumbnail}
                                <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 4px; font-size: 11px;">${video.duration}</div>
                            </div>
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">${video.title}</div>
                                <div style="opacity: 0.6; font-size: 13px;">${video.channel}</div>
                                <div style="opacity: 0.6; font-size: 13px;">${video.views} views</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    wm.createWindow('Video Player', content, { width: '800px', height: '750px' });
}

async function openPhotoViewer(initialPath = '/home/julius/Pictures') {
    const content = document.createElement('div');

    let currentPath = initialPath;
    let images = [];
    let currentIndex = 0;

    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

    function isImageFile(filename) {
        return IMAGE_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
    }

    async function loadImages(path) {
        try {
            const response = await fetch(`${api.baseURL}/files/list?path=${encodeURIComponent(path)}`);
            if (!response.ok) {
                // If path doesn't exist, try home directory
                path = '/home/julius';
                const homeResponse = await fetch(`${api.baseURL}/files/list?path=${encodeURIComponent(path)}`);
                const homeData = await homeResponse.json();
                currentPath = path;
                images = homeData.files.filter(f => f.type === 'file' && isImageFile(f.name));
            } else {
                const data = await response.json();
                currentPath = data.current_path;
                images = data.files.filter(f => f.type === 'file' && isImageFile(f.name));
            }

            if (images.length > 0) {
                currentIndex = 0;
            }

            renderViewer();
        } catch (error) {
            console.error('Error loading images:', error);
            showStatus('Error loading images: ' + error.message, 'error');
        }
    }

    function showStatus(message, type = 'info') {
        const statusEl = content.querySelector('#status-message');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = type === 'error' ? '#ef4444' : '#22c55e';
            setTimeout(() => statusEl.textContent = '', 3000);
        }
    }

    function renderViewer() {
        const currentImage = images[currentIndex];
        const hasImages = images.length > 0;

        content.innerHTML = `
            <h2>🖼️ Photo Viewer</h2>

            <!-- Toolbar -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 12px; margin-bottom: 12px; display: flex; gap: 8px; align-items: center;">
                <button id="change-folder" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">📁 Change Folder</button>
                <button id="refresh" style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">🔄 Refresh</button>
                <div style="flex: 1; opacity: 0.6; font-size: 13px; padding: 0 12px;">
                    ${currentPath} • ${images.length} image${images.length !== 1 ? 's' : ''}
                </div>
                <div id="status-message" style="font-size: 13px; font-weight: 600;"></div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
                <!-- Main View -->
                <div style="background: rgba(0,0,0,0.5); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px; min-height: 450px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    ${hasImages ? `
                        <div id="image-container" style="max-width: 100%; max-height: 400px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center;">
                            <img src="file://${currentImage.path}"
                                 alt="${currentImage.name}"
                                 style="max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain;"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'font-size: 80px;\\'>🖼️</div><div style=\\'opacity: 0.6; margin-top: 12px;\\'>Cannot display image</div>'">
                        </div>
                        <h3 style="margin: 0 0 8px 0; color: #8b5cf6;">${currentImage.name}</h3>
                        <div style="opacity: 0.6; margin-bottom: 16px;">${currentImage.size} • ${currentImage.modified}</div>

                        <div style="display: flex; gap: 12px;">
                            <button id="prev-btn" style="padding: 10px 20px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;" ${images.length <= 1 ? 'disabled style="opacity: 0.3;"' : ''}>← Previous</button>
                            <button id="delete-btn" style="padding: 10px 20px; background: rgba(239,68,68,0.2); border: none; border-radius: 6px; color: #ef4444; cursor: pointer;">🗑️ Delete</button>
                            <button id="next-btn" style="padding: 10px 20px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;" ${images.length <= 1 ? 'disabled style="opacity: 0.3;"' : ''}>Next →</button>
                        </div>
                        <div style="margin-top: 12px; opacity: 0.6; font-size: 14px;">
                            Image ${currentIndex + 1} of ${images.length}
                        </div>
                    ` : `
                        <div style="font-size: 80px; margin-bottom: 20px;">📁</div>
                        <h3 style="margin: 0 0 8px 0; color: #8b5cf6;">No Images Found</h3>
                        <div style="opacity: 0.6; margin-bottom: 16px;">No image files in ${currentPath}</div>
                        <button id="select-folder" style="padding: 10px 20px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">📁 Select Different Folder</button>
                    `}
                </div>

                <!-- Thumbnail Gallery -->
                ${hasImages ? `
                    <div>
                        <h4 style="margin: 0 0 12px 0;">Gallery</h4>
                        <div id="gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; max-height: 300px; overflow-y: auto; padding: 4px;">
                            ${images.map((img, i) => `
                                <div class="thumbnail" data-index="${i}" style="aspect-ratio: 1; background: linear-gradient(135deg, #2a2a3e, #3a3a4e); border-radius: 8px; cursor: pointer; overflow: hidden; position: relative; ${i === currentIndex ? 'border: 2px solid #8b5cf6;' : 'border: 1px solid rgba(139,92,246,0.2);'} transition: transform 0.2s, border-color 0.2s;"
                                     onmouseover="if (${i} !== ${currentIndex}) this.style.transform='scale(1.05)'"
                                     onmouseout="this.style.transform='scale(1)'">
                                    <img src="file://${img.path}"
                                         alt="${img.name}"
                                         style="width: 100%; height: 100%; object-fit: cover;"
                                         onerror="this.style.display='none'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.innerHTML+='<div style=\\'font-size: 40px;\\'>🖼️</div>'">
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); padding: 6px; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${img.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listeners
        const changeFolderBtn = content.querySelector('#change-folder');
        const refreshBtn = content.querySelector('#refresh');
        const prevBtn = content.querySelector('#prev-btn');
        const nextBtn = content.querySelector('#next-btn');
        const deleteBtn = content.querySelector('#delete-btn');
        const selectFolderBtn = content.querySelector('#select-folder');

        if (changeFolderBtn) {
            changeFolderBtn.addEventListener('click', async () => {
                const newPath = prompt('Enter folder path:', currentPath);
                if (newPath) {
                    await loadImages(newPath);
                }
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => loadImages(currentPath));
        }

        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                renderViewer();
            });
        }

        if (nextBtn && !nextBtn.disabled) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % images.length;
                renderViewer();
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Delete ${currentImage.name}?`)) {
                    try {
                        const response = await fetch(`${api.baseURL}/files/delete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ source: currentImage.path })
                        });

                        if (response.ok) {
                            showStatus('Image deleted', 'info');
                            await loadImages(currentPath);
                        } else {
                            const error = await response.json();
                            showStatus('Delete failed: ' + error.detail, 'error');
                        }
                    } catch (error) {
                        showStatus('Error deleting image: ' + error.message, 'error');
                    }
                }
            });
        }

        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', async () => {
                const newPath = prompt('Enter folder path:', currentPath);
                if (newPath) {
                    await loadImages(newPath);
                }
            });
        }

        // Thumbnail click handlers
        const thumbnails = content.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                currentIndex = parseInt(thumb.dataset.index);
                renderViewer();
            });
        });

        // Keyboard navigation
        const handleKeyPress = (e) => {
            if (images.length === 0) return;

            if (e.key === 'ArrowLeft') {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                renderViewer();
            } else if (e.key === 'ArrowRight') {
                currentIndex = (currentIndex + 1) % images.length;
                renderViewer();
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        // Clean up on window close
        const observer = new MutationObserver((mutations) => {
            if (!document.body.contains(content)) {
                document.removeEventListener('keydown', handleKeyPress);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    wm.createWindow('Photo Viewer', content, { width: '900px', height: '850px' });

    // Load initial images
    await loadImages(currentPath);
}

// ================================
// NETWORK APPS
// ================================

function openWebBrowser() {
    const content = document.createElement('div');

    const bookmarks = [
        { name: 'GitHub', url: 'github.com', icon: '💻' },
        { name: 'Stack Overflow', url: 'stackoverflow.com', icon: '📚' },
        { name: 'MDN Docs', url: 'developer.mozilla.org', icon: '📖' },
        { name: 'Reddit', url: 'reddit.com', icon: '🗨️' }
    ];

    const history = [
        { title: 'FastAPI Documentation', url: 'fastapi.tiangolo.com', time: '2 hours ago' },
        { title: 'Python asyncio Guide', url: 'docs.python.org/asyncio', time: '3 hours ago' },
        { title: 'React Hooks Tutorial', url: 'react.dev/hooks', time: 'Yesterday' }
    ];

    content.innerHTML = `
        <h2>🌐 Web Browser</h2>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px;">
            <!-- Address Bar -->
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button onclick="alert('Back')" style="padding: 8px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">←</button>
                <button onclick="alert('Forward')" style="padding: 8px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">→</button>
                <button onclick="alert('Refresh')" style="padding: 8px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">🔄</button>
                <input type="text" placeholder="🔍 Search or enter URL..." value="https://example.com" style="flex: 1; padding: 10px 16px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                <button onclick="alert('Bookmarks')" style="padding: 8px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">⭐</button>
                <button onclick="alert('Settings')" style="padding: 8px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">⚙️</button>
            </div>

            <!-- Tabs -->
            <div style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(139,92,246,0.2); padding-bottom: 8px;">
                <div style="padding: 8px 16px; background: rgba(139,92,246,0.2); border-radius: 6px 6px 0 0; color: #8b5cf6; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <span>🏠 Home</span>
                    <button onclick="alert('Close tab')" style="background: none; border: none; color: #8b5cf6; cursor: pointer; padding: 0;">✕</button>
                </div>
                <div style="padding: 8px 16px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; opacity: 0.7; cursor: pointer;">📄 New Tab</div>
                <button onclick="alert('New tab')" style="padding: 8px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer; margin-left: auto;">+</button>
            </div>

            <!-- Page Content -->
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px; min-height: 400px;">
                <h3 style="color: #8b5cf6; margin-top: 0;">Welcome to JuliOS Browser</h3>

                <div style="margin: 30px 0;">
                    <h4 style="margin-bottom: 16px;">Quick Access</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                        ${bookmarks.map(bm => `
                            <div style="padding: 20px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; text-align: center; cursor: pointer;"
                                 onmouseover="this.style.background='rgba(139,92,246,0.2)'"
                                 onmouseout="this.style.background='rgba(139,92,246,0.1)'"
                                 onclick="alert('Navigating to ${bm.url}')">
                                <div style="font-size: 40px; margin-bottom: 8px;">${bm.icon}</div>
                                <div style="font-weight: 600; margin-bottom: 4px;">${bm.name}</div>
                                <div style="opacity: 0.6; font-size: 12px;">${bm.url}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <h4 style="margin-bottom: 12px;">Recent History</h4>
                    <div style="background: rgba(255,255,255,0.02); border-radius: 8px; overflow: hidden;">
                        ${history.map(item => `
                            <div style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;"
                                 onmouseover="this.style.background='rgba(139,92,246,0.1)'"
                                 onmouseout="this.style.background='transparent'"
                                 onclick="alert('Navigating to ${item.url}')">
                                <div style="font-weight: 600; margin-bottom: 4px;">${item.title}</div>
                                <div style="display: flex; justify-content: space-between; opacity: 0.6; font-size: 13px;">
                                    <span>${item.url}</span>
                                    <span>${item.time}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    wm.createWindow('Web Browser', content, { width: '1100px', height: '750px' });
}

function openFileTransfer() {
    const content = document.createElement('div');

    const transfers = [
        { name: 'project_backup.zip', size: '245 MB', progress: 100, status: 'completed', speed: '--' },
        { name: 'photos_2025.tar.gz', size: '1.2 GB', progress: 67, status: 'downloading', speed: '5.2 MB/s' },
        { name: 'video_tutorial.mp4', size: '580 MB', progress: 33, status: 'downloading', speed: '3.8 MB/s' },
        { name: 'documents.zip', size: '45 MB', progress: 0, status: 'queued', speed: '--' }
    ];

    content.innerHTML = `
        <h2>📡 File Transfer</h2>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 20px;">
            <!-- Upload/Download Tabs -->
            <div style="display: flex; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid rgba(139,92,246,0.3); padding-bottom: 12px;">
                <button style="padding: 8px 16px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer; font-weight: 600;">📥 Downloads</button>
                <button style="padding: 8px 16px; background: transparent; border: none; border-radius: 6px; color: #e0e0e0; cursor: pointer;">📤 Uploads</button>
            </div>

            <!-- Add New Transfer -->
            <div style="background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <input type="text" placeholder="Enter download URL..." style="flex: 1; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); color: #e0e0e0;">
                    <button onclick="alert('Starting download...')" style="padding: 10px 24px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">Download</button>
                    <button onclick="alert('Select local file...')" style="padding: 10px 24px; background: rgba(34,197,94,0.2); border: none; border-radius: 6px; color: #22c55e; cursor: pointer; font-weight: 600;">Upload File</button>
                </div>
            </div>

            <!-- Transfer List -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="margin: 0;">Active Transfers</h4>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="alert('Pause all')" style="padding: 6px 12px; background: rgba(251,191,36,0.2); border: none; border-radius: 6px; color: #fbbf24; cursor: pointer;">⏸️ Pause All</button>
                        <button onclick="alert('Clear completed')" style="padding: 6px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">🗑️ Clear</button>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; overflow: hidden;">
                    ${transfers.map(transfer => {
                        const statusColors = {
                            'completed': '#22c55e',
                            'downloading': '#8b5cf6',
                            'uploading': '#3b82f6',
                            'queued': '#6b7280',
                            'paused': '#fbbf24',
                            'error': '#ef4444'
                        };
                        const statusIcons = {
                            'completed': '✓',
                            'downloading': '⬇️',
                            'uploading': '⬆️',
                            'queued': '⏳',
                            'paused': '⏸️',
                            'error': '⚠️'
                        };

                        return `
                            <div style="padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <div>
                                        <div style="font-weight: 600; margin-bottom: 4px;">📄 ${transfer.name}</div>
                                        <div style="opacity: 0.6; font-size: 13px;">${transfer.size} • ${transfer.speed}</div>
                                    </div>
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        <span style="color: ${statusColors[transfer.status]}; font-weight: 600; font-size: 14px;">${statusIcons[transfer.status]} ${transfer.status}</span>
                                        ${transfer.status === 'downloading' || transfer.status === 'uploading' ?
                                            '<button onclick="alert(\'Pause\')" style="padding: 6px 12px; background: rgba(251,191,36,0.2); border: none; border-radius: 6px; color: #fbbf24; cursor: pointer;">⏸️</button>' :
                                            ''}
                                        ${transfer.status === 'completed' ?
                                            '<button onclick="alert(\'Open file\')" style="padding: 6px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 6px; color: #8b5cf6; cursor: pointer;">📂 Open</button>' :
                                            ''}
                                        <button onclick="alert('Remove')" style="padding: 6px 12px; background: rgba(239,68,68,0.2); border: none; border-radius: 6px; color: #ef4444; cursor: pointer;">✕</button>
                                    </div>
                                </div>

                                ${transfer.progress > 0 ? `
                                    <div style="background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; height: 8px; margin-top: 8px;">
                                        <div style="background: ${statusColors[transfer.status]}; height: 100%; width: ${transfer.progress}%; transition: width 0.3s;"></div>
                                    </div>
                                    <div style="text-align: right; opacity: 0.6; font-size: 12px; margin-top: 4px;">${transfer.progress}%</div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Statistics -->
            <div style="margin-top: 20px; padding: 16px; background: rgba(139,92,246,0.05); border-radius: 8px; display: flex; justify-content: space-around;">
                <div style="text-align: center;">
                    <div style="opacity: 0.6; font-size: 13px;">Total Downloaded</div>
                    <div style="font-size: 24px; font-weight: 600; color: #22c55e;">2.4 GB</div>
                </div>
                <div style="text-align: center;">
                    <div style="opacity: 0.6; font-size: 13px;">Total Uploaded</div>
                    <div style="font-size: 24px; font-weight: 600; color: #8b5cf6;">1.8 GB</div>
                </div>
                <div style="text-align: center;">
                    <div style="opacity: 0.6; font-size: 13px;">Active</div>
                    <div style="font-size: 24px; font-weight: 600; color: #fbbf24;">${transfers.filter(t => t.status === 'downloading' || t.status === 'uploading').length}</div>
                </div>
            </div>
        </div>
    `;

    wm.createWindow('File Transfer', content, { width: '900px', height: '750px' });
}

console.log('✅ Chat taskbar toggle initialized');
