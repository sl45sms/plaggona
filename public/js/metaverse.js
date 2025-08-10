// Plaggona Metaverse Client
class MetaverseClient {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.users = new Map();
        this.selectedClothColor = '#DDA0DD';
        this.world3D = null;
        this.chat = null;
        this.ui = null;
        this.isConnected = false;
        
        this.init();
    }
    
    init() {
        this.initializeComponents();
        this.setupEventListeners();
        this.showLoginScreen();
    }
    
    initializeComponents() {
        // Don't initialize Socket.IO connection until user enters Agora
        this.socket = null;
        
        // Initialize components
        this.world3D = new World3D(this);
        this.chat = new ChatSystem(this);
        this.ui = new UIManager(this);
    }
    
    setupEventListeners() {
        // Login form
        const enterBtn = document.getElementById('enterAgoraBtn');
        const nicknameInput = document.getElementById('nicknameInput');
        
        enterBtn.addEventListener('click', () => this.enterAgora());
        nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.enterAgora();
        });
        
        // Color selector
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelector('.color-option.selected')?.classList.remove('selected');
                e.target.classList.add('selected');
                this.selectedClothColor = e.target.dataset.color;
            });
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.world3D) {
                this.world3D.handleResize();
            }
        });
        
        // Prevent context menu on canvas
        document.getElementById('worldCanvas').addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to Plaggona Metaverse');
            this.isConnected = true;
            
            // Join the Agora if we have a user
            if (this.currentUser) {
                // Attach socket id as user id
                const previousId = this.currentUser.id;
                this.currentUser.id = this.socket.id;
                // Normalize appearance object for world3D expectations
                if (!this.currentUser.appearance) {
                    this.currentUser.appearance = { clothColor: this.currentUser.clothColor };
                }
                // If we had a provisional local avatar, update its id mapping
                if (this.world3D && previousId && previousId !== this.currentUser.id) {
                    if (this.world3D.userMeshes.has(previousId)) {
                        const mesh = this.world3D.userMeshes.get(previousId);
                        this.world3D.userMeshes.delete(previousId);
                        this.world3D.userMeshes.set(this.currentUser.id, mesh);
                    }
                    this.world3D.localUserId = this.currentUser.id;
                } else if (this.world3D && !previousId) {
                    // First time set
                    this.world3D.setLocalUser({
                        id: this.currentUser.id,
                        nickname: this.currentUser.nickname,
                        appearance: this.currentUser.appearance,
                        position: { x: 0, y: 0, z: 0 }
                    });
                }
                this.socket.emit('join-agora', this.currentUser);
                this.ui.showNotification('Welcome to the Plaggona Agora!', 'success');
            }
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from Plaggona Metaverse:', reason);
            this.isConnected = false;
            if (reason !== 'io client disconnect') {
                this.ui.showNotification('Lost connection to the metaverse', 'error');
            }
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.ui.showNotification('Failed to connect to the metaverse', 'error');
        });
        
        this.socket.on('current-users', (users) => {
            users.forEach(user => {
                this.users.set(user.id, user);
                this.world3D.addUser(user);
            });
            this.ui.updateUsersList();
        });
        
        this.socket.on('user-joined', (user) => {
            this.users.set(user.id, user);
            this.world3D.addUser(user);
            this.ui.updateUsersList();
            this.chat.addSystemMessage(`${user.nickname} joined the Agora`);
        });
        
        this.socket.on('user-left', (userId) => {
            const user = this.users.get(userId);
            if (user) {
                this.chat.addSystemMessage(`${user.nickname} left the Agora`);
                this.users.delete(userId);
                this.world3D.removeUser(userId);
                this.ui.updateUsersList();
            }
        });
        
        this.socket.on('user-moved', (data) => {
            const user = this.users.get(data.id);
            if (user) {
                user.position = data.position;
                this.world3D.updateUserPosition(data.id, data.position);
            }
        });
        
        this.socket.on('chat-message', (message) => {
            this.chat.addMessage(message);
        });
        
        this.socket.on('user-gesture', (data) => {
            this.world3D.showGesture(data.userId, data.gesture, data.position);
            const user = this.users.get(data.userId);
            if (user) {
                this.chat.addSystemMessage(`${user.nickname} ${this.getGestureText(data.gesture)}`);
            }
        });
    }
    
    enterAgora() {
        const nickname = document.getElementById('nicknameInput').value.trim();
        
        if (!nickname) {
            this.ui.showNotification('Please enter a nickname', 'error');
            return;
        }
        
        if (nickname.length > 20) {
            this.ui.showNotification('Nickname too long (max 20 characters)', 'error');
            return;
        }
        
        // Show connecting message
        this.ui.showNotification('Loading Socket.IO...', 'info');
        
        // Load Socket.IO dynamically only when entering Agora
        const socketScript = document.createElement('script');
        socketScript.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
        socketScript.onload = () => {
            // Initialize Socket.IO connection now that it's loaded
            this.socket = io({
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                forceNew: true,
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true
            });
            
            // Setup socket event listeners
            this.setupSocketListeners();
            
            this.currentUser = {
                nickname: nickname,
                clothColor: this.selectedClothColor,
                skinTone: 'default',
                accessory: 'none'
            };
            
            // Hide login modal and show metaverse
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('metaverse').classList.remove('hidden');
            
            // Connect to the metaverse server
            this.ui.showNotification('Connecting to the Plaggona Agora...', 'info');
            this.socket.connect();
            
            // Initialize 3D world (local avatar created after socket connect assigns id)
            this.world3D.initialize();
        };
        
        socketScript.onerror = () => {
            this.ui.showNotification('Failed to load Socket.IO', 'error');
        };
        
        document.head.appendChild(socketScript);
    }
    
    sendMessage(text) {
        if (!text.trim()) return;
        
        this.socket.emit('chat-message', { text: text.trim() });
    }
    
    updatePosition(position) {
        if (this.currentUser) {
            this.socket.emit('update-position', position);
        }
    }
    
    sendGesture(gestureType) {
        this.socket.emit('gesture', { type: gestureType });
    }
    
    getGestureText(gesture) {
        const gestures = {
            wave: 'waves',
            dance: 'is dancing',
            jump: 'jumps'
        };
        return gestures[gesture] || 'made a gesture';
    }
    
    showLoginScreen() {
        // Hide loading screen immediately and show login modal
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('hidden');
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getUsers() {
        return this.users;
    }
    
    getSocket() {
        return this.socket;
    }
}

// Initialize the metaverse client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.metaverseClient = new MetaverseClient();
});
