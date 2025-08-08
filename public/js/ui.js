// UI Manager for the Plaggona Metaverse
class UIManager {
    constructor(metaverseClient) {
        this.metaverse = metaverseClient;
        this.usersContainer = document.getElementById('usersContainer');
        this.userCountEl = document.getElementById('userCount');
        this.roomsModal = document.getElementById('roomsModal');
        this.roomsList = document.getElementById('roomsList');
    // Mobile panels
    this.mobileNav = document.getElementById('mobileNav');
    this.mobileTabChat = document.getElementById('mobileTabChat');
    this.mobileTabUsers = document.getElementById('mobileTabUsers');
    this.mobileTabGestures = document.getElementById('mobileTabGestures');
    this.chatPanel = document.getElementById('chatInterface');
    this.usersPanel = document.getElementById('usersList');
    this.gesturesPanel = document.getElementById('gestureControls');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUsersList();
        this.updateLayout();
        window.addEventListener('resize', () => this.updateLayout());
    }
    
    setupEventListeners() {
        // Rooms button
        document.getElementById('roomsBtn').addEventListener('click', () => {
            this.showRoomsModal();
        });
        
        // Settings button (placeholder)
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showNotification('Settings panel coming soon!', 'info');
        });
        
        // Gesture buttons
        document.querySelectorAll('.gesture-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gesture = e.target.dataset.gesture;
                this.metaverse.sendGesture(gesture);
                this.animateGestureButton(e.target);
            });
        });
        
        // Rooms modal
        document.querySelector('#roomsModal .close').addEventListener('click', () => {
            this.hideRoomsModal();
        });
        
        // Click outside modal to close
        this.roomsModal.addEventListener('click', (e) => {
            if (e.target === this.roomsModal) {
                this.hideRoomsModal();
            }
        });
        
        // Create room button
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createRoom();
        });
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideRoomsModal();
            }
        });

        // Mobile tab switching
        if (this.mobileNav) {
            const activate = (tab) => {
                [this.mobileTabChat, this.mobileTabUsers, this.mobileTabGestures].forEach(btn => {
                    if (!btn) return;
                    btn.classList.toggle('active', btn === tab);
                    btn.setAttribute('aria-selected', btn === tab ? 'true' : 'false');
                });
                
                // Remove active class from all panels
                [this.chatPanel, this.usersPanel, this.gesturesPanel].forEach(panel => {
                    if (panel) panel.classList.remove('active');
                });
                
                // Add active class to the selected panel
                if (tab === this.mobileTabChat && this.chatPanel) {
                    this.chatPanel.classList.add('active');
                } else if (tab === this.mobileTabUsers && this.usersPanel) {
                    this.usersPanel.classList.add('active');
                } else if (tab === this.mobileTabGestures && this.gesturesPanel) {
                    this.gesturesPanel.classList.add('active');
                }
            };
            
            this.mobileTabChat && this.mobileTabChat.addEventListener('click', () => activate(this.mobileTabChat));
            this.mobileTabUsers && this.mobileTabUsers.addEventListener('click', () => activate(this.mobileTabUsers));
            this.mobileTabGestures && this.mobileTabGestures.addEventListener('click', () => activate(this.mobileTabGestures));
            
            // Default to showing chat panel
            if (this.mobileTabChat) {
                activate(this.mobileTabChat);
            }
        }
    }
    
    updateUsersList() {
        const users = this.metaverse.getUsers();
        const currentUser = this.metaverse.getCurrentUser();
        
        // Update user count
        const totalUsers = users.size + (currentUser ? 1 : 0);
        this.userCountEl.textContent = `${totalUsers} Plaggona${totalUsers !== 1 ? 's' : ''} online`;
        
        // Clear existing users
        this.usersContainer.innerHTML = '';
        
        // Add current user first
        if (currentUser) {
            const userEl = this.createUserListItem({
                id: 'self',
                nickname: currentUser.nickname,
                appearance: { clothColor: currentUser.clothColor },
                status: 'You'
            }, true);
            this.usersContainer.appendChild(userEl);
        }
        
        // Add other users
        users.forEach(user => {
            const userEl = this.createUserListItem(user);
            this.usersContainer.appendChild(userEl);
        });
        
        // Show empty state if no users
        if (users.size === 0 && !currentUser) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-state';
            emptyEl.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">🏛️</div>
                    <div>The Agora is empty</div>
                    <div style="font-size: 12px; margin-top: 5px;">Be the first to explore!</div>
                </div>
            `;
            this.usersContainer.appendChild(emptyEl);
        }
    }
    
    createUserListItem(user, isCurrentUser = false) {
        const userEl = document.createElement('div');
        userEl.className = `user-item ${isCurrentUser ? 'current-user' : ''}`;
        userEl.dataset.userId = user.id;
        
        const avatarEl = document.createElement('div');
        avatarEl.className = 'user-avatar';
        avatarEl.style.backgroundColor = user.appearance.clothColor;
        avatarEl.style.borderColor = user.appearance.clothColor;
    avatarEl.style.backgroundImage = `url('assets/plaggona.jpeg')`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        
        const infoEl = document.createElement('div');
        infoEl.className = 'user-info';
        
        const nicknameEl = document.createElement('div');
        nicknameEl.className = 'user-nickname';
        nicknameEl.textContent = user.nickname;
        
        const statusEl = document.createElement('div');
        statusEl.className = 'user-status';
        statusEl.textContent = user.status || this.getRandomStatus();
        
        infoEl.appendChild(nicknameEl);
        infoEl.appendChild(statusEl);
        
        userEl.appendChild(avatarEl);
        userEl.appendChild(infoEl);
        
        // Add click handler for user interaction
        if (!isCurrentUser) {
            userEl.addEventListener('click', (ev) => {
                this.showUserMenu(user, ev.currentTarget);
            });
            userEl.style.cursor = 'pointer';
        }
        
        return userEl;
    }
    
    getRandomStatus() {
        const statuses = [
            'Exploring the Agora',
            'Looking around',
            'Chatting',
            'Wandering',
            'Socializing',
            'Enjoying the view',
            'Making friends',
            'New to the metaverse'
        ];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
    
    showUserMenu(user, anchorEl) {
        const menu = document.createElement('div');
        menu.className = 'user-context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="wave">👋 Wave at ${user.nickname}</div>
            <div class="menu-item" data-action="approach">🚶 Approach ${user.nickname}</div>
            <div class="menu-item" data-action="info">ℹ️ View info</div>
        `;
        
        menu.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: 1px solid #ddd;
            z-index: 1001;
            min-width: 200px;
        `;
        
    // Position near the anchor element
    const rect = anchorEl.getBoundingClientRect();
        menu.style.left = (rect.right + 10) + 'px';
        menu.style.top = rect.top + 'px';
        
        // Add menu item styles and handlers
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                transition: background 0.2s ease;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8f9fa';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
            
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleUserAction(user, action);
                document.body.removeChild(menu);
            });
        });
        
        document.body.appendChild(menu);
        
        // Remove menu when clicking elsewhere
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                if (menu.parentNode) {
                    document.body.removeChild(menu);
                }
                document.removeEventListener('click', removeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 100);
    }
    
    handleUserAction(user, action) {
        switch(action) {
            case 'wave':
                this.metaverse.sendGesture('wave');
                this.showNotification(`You waved at ${user.nickname}`, 'info');
                break;
            case 'approach':
                // Move towards the user (simplified)
                this.showNotification(`Moving towards ${user.nickname}...`, 'info');
                break;
            case 'info':
                this.showUserInfo(user);
                break;
        }
    }
    
    showUserInfo(user) {
        const infoModal = document.createElement('div');
        infoModal.className = 'modal';
        infoModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>👤 ${user.nickname}</h2>
                <div class="user-info-details">
                    <div class="info-row">
                        <strong>Appearance:</strong>
                        <div class="color-preview" style="
                            width: 20px; 
                            height: 20px; 
                            background: ${user.appearance.clothColor}; 
                            border-radius: 50%;
                            display: inline-block;
                            margin-left: 10px;
                            border: 2px solid #333;
                        "></div>
                    </div>
                    <div class="info-row">
                        <strong>Status:</strong> ${this.getRandomStatus()}
                    </div>
                    <div class="info-row">
                        <strong>Position:</strong> (${Math.floor(user.position.x)}, ${Math.floor(user.position.z)})
                    </div>
                    <div class="info-actions">
                        <button class="info-btn" data-action="wave">👋 Wave</button>
                        <button class="info-btn" data-action="approach">🚶 Approach</button>
                        <button class="info-btn" data-action="chat">💬 Send Message</button>
                    </div>
                </div>
            </div>
        `;
        
        // Style the info modal
        infoModal.querySelector('.user-info-details').style.cssText = `
            padding: 20px 0;
        `;
        
        infoModal.querySelectorAll('.info-row').forEach(row => {
            row.style.cssText = `
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
        });
        
        infoModal.querySelector('.info-actions').style.cssText = `
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        infoModal.querySelectorAll('.info-btn').forEach(btn => {
            btn.style.cssText = `
                padding: 8px 16px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            `;
            
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleUserAction(user, action);
                document.body.removeChild(infoModal);
            });
        });
        
        document.body.appendChild(infoModal);
        
        // Close handlers
        infoModal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(infoModal);
        });
        
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                document.body.removeChild(infoModal);
            }
        });
    }
    
    animateGestureButton(button) {
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.6)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 200);
    }
    
    showRoomsModal() {
        this.roomsModal.classList.remove('hidden');
        this.updateRoomsList();
    }
    
    hideRoomsModal() {
        this.roomsModal.classList.add('hidden');
    }
    
    updateRoomsList() {
        // This would fetch rooms from the server
        // For now, show placeholder
        this.roomsList.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                <div style="font-size: 24px; margin-bottom: 10px;">🏛️</div>
                <div>No private rooms available</div>
                <div style="font-size: 12px; margin-top: 5px;">Create the first one!</div>
            </div>
        `;
    }
    
    createRoom() {
        const roomName = document.getElementById('roomNameInput').value.trim();
        const maxUsers = parseInt(document.getElementById('maxUsersInput').value) || 10;
        const isPrivate = document.getElementById('privateRoomCheckbox').checked;
        
        if (!roomName) {
            this.showNotification('Please enter a room name', 'error');
            return;
        }
        
        if (roomName.length > 30) {
            this.showNotification('Room name too long (max 30 characters)', 'error');
            return;
        }
        
        // Send room creation request
        this.metaverse.getSocket().emit('create-room', {
            name: roomName,
            maxUsers: maxUsers,
            private: isPrivate
        });
        
        // Clear form
        document.getElementById('roomNameInput').value = '';
        document.getElementById('maxUsersInput').value = '10';
        document.getElementById('privateRoomCheckbox').checked = false;
        
        this.hideRoomsModal();
        this.showNotification('Room creation requested...', 'info');
    }
    
    showNotification(text, type = 'info', duration = 3000) {
        // Use the chat system for notifications
        if (this.metaverse.chat) {
            this.metaverse.chat.showNotification(text, type, duration);
        }
    }
    
    // Utility methods for responsive design
    updateLayout() {
        const isMobile = window.innerWidth <= 1023;
        const metaverse = document.getElementById('metaverse');
        if (!metaverse) return;
        
        if (this.mobileNav) {
            if (isMobile) {
                this.mobileNav.classList.remove('hidden');
                
                // Make sure at least one panel has active class on mobile
                const hasActivePanel = this.chatPanel?.classList.contains('active') ||
                                     this.usersPanel?.classList.contains('active') ||
                                     this.gesturesPanel?.classList.contains('active');
                
                if (!hasActivePanel && this.chatPanel) {
                    this.chatPanel.classList.add('active');
                    this.mobileTabChat?.classList.add('active');
                }
            } else {
                this.mobileNav.classList.add('hidden');
                // On desktop, remove active classes to let CSS grid handle layout
                [this.chatPanel, this.usersPanel, this.gesturesPanel].forEach(panel => {
                    if (panel) panel.classList.remove('active');
                });
            }
        }
    }
}

// Export for other modules
if (typeof module !== 'undefined') {
    module.exports = UIManager;
}
