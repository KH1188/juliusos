// Amiga-style Window Manager for JuliOS

class WindowManager {
    constructor() {
        this.windows = [];
        this.activeWindow = null;
        this.zIndex = 100;
        this.draggedWindow = null;
        this.dragOffset = { x: 0, y: 0 };

        this.init();
    }

    init() {
        // Set up event listeners
        document.addEventListener('mouseup', () => this.stopDrag());
        document.addEventListener('mousemove', (e) => this.drag(e));
    }

    createWindow(title, content, options = {}) {
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.style.zIndex = this.zIndex++;

        // Default position (cascade windows)
        const offsetX = this.windows.length * 30;
        const offsetY = this.windows.length * 30;
        windowEl.style.left = `${100 + offsetX}px`;
        windowEl.style.top = `${100 + offsetY}px`;

        // Set size
        windowEl.style.width = options.width || '600px';
        windowEl.style.height = options.height || '400px';

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'window-titlebar active';
        titleBar.innerHTML = `
            <span class="window-title">${title}</span>
            <div class="window-controls">
                <div class="window-control minimize">_</div>
                <div class="window-control maximize">□</div>
                <div class="window-control close">×</div>
            </div>
        `;

        // Content area
        const contentArea = document.createElement('div');
        contentArea.className = 'window-content';

        if (typeof content === 'string') {
            contentArea.innerHTML = content;
        } else {
            contentArea.appendChild(content);
        }

        windowEl.appendChild(titleBar);
        windowEl.appendChild(contentArea);

        // Add to container
        const container = document.getElementById('windows-container');
        container.appendChild(windowEl);

        // Store window reference
        const windowObj = {
            id: Date.now(),
            element: windowEl,
            title: title,
            isMaximized: false
        };
        this.windows.push(windowObj);

        // Set up window controls
        this.setupWindowControls(windowObj);
        this.setActiveWindow(windowObj);

        return windowObj;
    }

    setupWindowControls(windowObj) {
        const titleBar = windowObj.element.querySelector('.window-titlebar');
        const closeBtn = windowObj.element.querySelector('.close');
        const maximizeBtn = windowObj.element.querySelector('.maximize');
        const minimizeBtn = windowObj.element.querySelector('.minimize');

        // Dragging
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target === titleBar || e.target.classList.contains('window-title')) {
                this.startDrag(windowObj, e);
            }
        });

        // Close
        closeBtn.addEventListener('click', () => this.closeWindow(windowObj));

        // Maximize/Restore
        maximizeBtn.addEventListener('click', () => this.toggleMaximize(windowObj));

        // Minimize (just close for now, can implement taskbar later)
        minimizeBtn.addEventListener('click', () => this.closeWindow(windowObj));

        // Click to focus
        windowObj.element.addEventListener('mousedown', () => {
            this.setActiveWindow(windowObj);
        });

        // Double-click title bar to maximize
        titleBar.addEventListener('dblclick', () => this.toggleMaximize(windowObj));
    }

    startDrag(windowObj, e) {
        if (windowObj.isMaximized) return;

        this.draggedWindow = windowObj;
        this.setActiveWindow(windowObj);

        const rect = windowObj.element.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
    }

    drag(e) {
        if (!this.draggedWindow) return;

        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        this.draggedWindow.element.style.left = `${Math.max(0, x)}px`;
        this.draggedWindow.element.style.top = `${Math.max(0, y)}px`;
    }

    stopDrag() {
        this.draggedWindow = null;
    }

    toggleMaximize(windowObj) {
        if (windowObj.isMaximized) {
            windowObj.element.classList.remove('maximized');
            windowObj.isMaximized = false;
        } else {
            windowObj.element.classList.add('maximized');
            windowObj.isMaximized = true;
        }
    }

    closeWindow(windowObj) {
        windowObj.element.remove();
        this.windows = this.windows.filter(w => w.id !== windowObj.id);

        if (this.activeWindow === windowObj) {
            this.activeWindow = null;
            if (this.windows.length > 0) {
                this.setActiveWindow(this.windows[this.windows.length - 1]);
            }
        }
    }

    setActiveWindow(windowObj) {
        // Deactivate all windows
        this.windows.forEach(w => {
            const titleBar = w.element.querySelector('.window-titlebar');
            titleBar.classList.remove('active');
        });

        // Activate this window
        const titleBar = windowObj.element.querySelector('.window-titlebar');
        titleBar.classList.add('active');
        windowObj.element.style.zIndex = this.zIndex++;
        this.activeWindow = windowObj;
    }

    closeAllWindows() {
        this.windows.forEach(w => w.element.remove());
        this.windows = [];
        this.activeWindow = null;
    }
}

// Global window manager instance
const wm = new WindowManager();
