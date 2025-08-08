// Chat System for the Plaggona Metaverse
class ChatSystem {
    constructor(metaverseClient) {
        this.metaverse = metaverseClient;
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.maxMessages = 100;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.addSystemMessage('Welcome to the Plaggona Agora! 🏛️');
    }
    
    setupEventListeners() {
        // Send button click
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter to send, Shift+Enter for newline (textarea)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize input
        this.messageInput.addEventListener('input', () => {
            this.autoResizeInput();
        });
        
        // Focus management
        this.messageInput.addEventListener('focus', () => {
            // Disable movement controls when typing
            document.addEventListener('keydown', this.preventMovementKeys);
        });
        
        this.messageInput.addEventListener('blur', () => {
            // Re-enable movement controls
            document.removeEventListener('keydown', this.preventMovementKeys);
        });
    }

    autoResizeInput() {
        const el = this.messageInput;
        if (!el) return;
        el.style.height = 'auto';
        const newH = Math.min(el.scrollHeight, Math.round(window.innerHeight * 0.3));
        el.style.height = newH + 'px';
    }
    
    preventMovementKeys(e) {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.stopPropagation();
        }
    }
    
    sendMessage() {
        const text = this.messageInput.value.trim();
        
        if (!text) return;
        
        if (text.length > 200) {
            this.addSystemMessage('Message too long (max 200 characters)', 'error');
            return;
        }
        
        // Check for commands
        if (text.startsWith('/')) {
            this.handleCommand(text);
        } else {
            this.metaverse.sendMessage(text);
        }
        
    this.messageInput.value = '';
    this.autoResizeInput();
        this.messageInput.focus();
    }
    
    handleCommand(command) {
        const parts = command.slice(1).split(' ');
        const cmd = parts[0].toLowerCase();
        
        switch(cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'clear':
                this.clearMessages();
                break;
            case 'who':
                this.listUsers();
                break;
            case 'time':
                this.showTime();
                break;
            default:
                this.addSystemMessage(`Unknown command: ${cmd}. Type /help for available commands.`, 'error');
        }
    }
    
    showHelp() {
        const helpText = [
            '📝 Available Commands:',
            '/help - Show this help message',
            '/clear - Clear chat messages',
            '/who - List all users in the Agora',
            '/time - Show current time',
            '',
            '🎮 Controls:',
            'WASD or Arrow Keys - Move around',
            'Mouse drag - Look around',
            'Mouse wheel - Zoom in/out',
            '',
            '💡 Tips:',
            '• Use gesture buttons to interact',
            '• Click on users to see their info',
            '• Create private rooms for smaller groups'
        ];
        
        helpText.forEach(line => {
            if (line) {
                this.addSystemMessage(line, 'info');
            } else {
                this.addSystemMessage(' ', 'info');
            }
        });
    }
    
    clearMessages() {
        this.chatMessages.innerHTML = '';
        this.addSystemMessage('Chat cleared', 'info');
    }
    
    listUsers() {
        const users = this.metaverse.getUsers();
        const currentUser = this.metaverse.getCurrentUser();
        
        this.addSystemMessage(`👥 Users in the Agora (${users.size + 1}):`, 'info');
        this.addSystemMessage(`• ${currentUser.nickname} (you)`, 'info');
        
        users.forEach(user => {
            this.addSystemMessage(`• ${user.nickname}`, 'info');
        });
    }
    
    showTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        this.addSystemMessage(`🕐 Current time: ${timeString}`, 'info');
    }
    
    addMessage(message) {
        const messageEl = this.createMessageElement(message, 'user');
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
        this.limitMessages();
    }
    
    addSystemMessage(text, type = 'system') {
        const message = {
            nickname: 'System',
            message: text,
            timestamp: Date.now(),
            system: true,
            type: type
        };
        
        const messageEl = this.createMessageElement(message, type);
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
        this.limitMessages();
    }
    
    createMessageElement(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${type}`;
        
        if (message.system) {
            messageEl.classList.add('system-message');
            messageEl.innerHTML = `
                <div class="message-content">
                    <span class="system-text">${this.escapeHtml(message.message)}</span>
                    <span class="timestamp">${this.formatTime(message.timestamp)}</span>
                </div>
            `;
        } else {
            const isOwnMessage = message.userId === this.metaverse.getSocket().id;
            if (isOwnMessage) {
                messageEl.classList.add('own-message');
            }
            
            messageEl.innerHTML = `
                <div class="message-content">
                    <span class="nickname" style="color: ${this.getUserColor(message.nickname)}">${this.escapeHtml(message.nickname)}</span>
                    <span class="text">${this.escapeHtml(message.message)}</span>
                    <span class="timestamp">${this.formatTime(message.timestamp)}</span>
                </div>
            `;
        }
        
        return messageEl;
    }
    
    getUserColor(nickname) {
        // Generate a consistent color based on the nickname
        let hash = 0;
        for (let i = 0; i < nickname.length; i++) {
            hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colors = [
            '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
            '#1ABC9C', '#E67E22', '#34495E', '#E91E63', '#00BCD4'
        ];
        
        return colors[Math.abs(hash) % colors.length];
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    limitMessages() {
        const messages = this.chatMessages.children;
        while (messages.length > this.maxMessages) {
            this.chatMessages.removeChild(messages[0]);
        }
    }
    
    // Notification methods for different message types
    showNotification(text, type = 'info', duration = 3000) {
        this.addSystemMessage(text, type);
        
        // Also show a visual notification
        this.createToastNotification(text, type, duration);
    }
    
    createToastNotification(text, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = text;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            max-width: 300px;
            word-wrap: break-word;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(100px);
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        });
    }
    
    getToastColor(type) {
        const colors = {
            'success': '#2ECC71',
            'error': '#E74C3C',
            'warning': '#F39C12',
            'info': '#3498DB',
            'system': '#95A5A6'
        };
        return colors[type] || colors.info;
    }
}

// Export for other modules
if (typeof module !== 'undefined') {
    module.exports = ChatSystem;
}
