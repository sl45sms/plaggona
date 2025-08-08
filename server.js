const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    allowEIO3: true
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Store active users in the Agora
const agoraUsers = new Map();
const rooms = new Map();

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        users: agoraUsers.size,
        rooms: rooms.size 
    });
});

app.get('/api/users', (req, res) => {
    const users = Array.from(agoraUsers.values());
    res.json(users);
});

app.get('/api/rooms', (req, res) => {
    const roomList = Array.from(rooms.keys());
    res.json(roomList);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New Plaggona connected:', socket.id);

    // Handle user joining the Agora
    socket.on('join-agora', (userData) => {
        const user = {
            id: socket.id,
            uuid: uuidv4(),
            nickname: userData.nickname || `Plaggona_${Math.floor(Math.random() * 1000)}`,
            position: { x: Math.random() * 100 - 50, y: 0, z: Math.random() * 100 - 50 },
            appearance: {
                clothColor: userData.clothColor || getRandomColor(),
                skinTone: userData.skinTone || 'default',
                accessory: userData.accessory || 'none'
            },
            room: 'agora',
            lastSeen: Date.now()
        };

        agoraUsers.set(socket.id, user);
        socket.join('agora');

        // Notify all users about the new Plaggona
        socket.to('agora').emit('user-joined', user);
        
        // Send current users to the new user
        const currentUsers = Array.from(agoraUsers.values()).filter(u => u.id !== socket.id);
        socket.emit('current-users', currentUsers);

        console.log(`${user.nickname} joined the Agora`);
    });

    // Handle position updates
    socket.on('update-position', (position) => {
        const user = agoraUsers.get(socket.id);
        if (user) {
            user.position = position;
            user.lastSeen = Date.now();
            socket.to(user.room).emit('user-moved', {
                id: socket.id,
                position: position
            });
        }
    });

    // Handle chat messages
    socket.on('chat-message', (message) => {
        const user = agoraUsers.get(socket.id);
        if (user) {
            const chatData = {
                userId: socket.id,
                nickname: user.nickname,
                message: message.text,
                timestamp: Date.now(),
                position: user.position
            };
            io.to(user.room).emit('chat-message', chatData);
        }
    });

    // Handle gestures/interactions
    socket.on('gesture', (gestureData) => {
        const user = agoraUsers.get(socket.id);
        if (user) {
            socket.to(user.room).emit('user-gesture', {
                userId: socket.id,
                gesture: gestureData.type,
                position: user.position
            });
        }
    });

    // Handle private rooms creation
    socket.on('create-room', (roomData) => {
        const roomId = uuidv4();
        const room = {
            id: roomId,
            name: roomData.name,
            creator: socket.id,
            users: new Set([socket.id]),
            maxUsers: roomData.maxUsers || 10,
            private: roomData.private || false
        };

        rooms.set(roomId, room);
        socket.leave('agora');
        socket.join(roomId);

        const user = agoraUsers.get(socket.id);
        if (user) {
            user.room = roomId;
            socket.to('agora').emit('user-left', socket.id);
        }

        socket.emit('room-created', room);
    });

    // Handle joining existing rooms
    socket.on('join-room', (roomId) => {
        const room = rooms.get(roomId);
        const user = agoraUsers.get(socket.id);
        
        if (room && user && room.users.size < room.maxUsers) {
            socket.leave(user.room);
            socket.to(user.room).emit('user-left', socket.id);
            
            socket.join(roomId);
            room.users.add(socket.id);
            user.room = roomId;
            
            socket.to(roomId).emit('user-joined', user);
            socket.emit('room-joined', roomId);
        }
    });

    // Handle returning to Agora
    socket.on('return-to-agora', () => {
        const user = agoraUsers.get(socket.id);
        if (user && user.room !== 'agora') {
            const room = rooms.get(user.room);
            if (room) {
                room.users.delete(socket.id);
                socket.to(user.room).emit('user-left', socket.id);
                
                if (room.users.size === 0) {
                    rooms.delete(user.room);
                }
            }
            
            socket.leave(user.room);
            socket.join('agora');
            user.room = 'agora';
            
            socket.to('agora').emit('user-joined', user);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = agoraUsers.get(socket.id);
        if (user) {
            console.log(`${user.nickname} left the metaverse`);
            
            // Remove from room
            if (user.room !== 'agora') {
                const room = rooms.get(user.room);
                if (room) {
                    room.users.delete(socket.id);
                    if (room.users.size === 0) {
                        rooms.delete(user.room);
                    }
                }
            }
            
            // Notify other users
            socket.to(user.room).emit('user-left', socket.id);
            
            // Remove from active users
            agoraUsers.delete(socket.id);
        }
    });
});

// Cleanup inactive users (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [socketId, user] of agoraUsers.entries()) {
        if (now - user.lastSeen > timeout) {
            console.log(`Cleaning up inactive user: ${user.nickname}`);
            agoraUsers.delete(socketId);
            io.to(user.room).emit('user-left', socketId);
        }
    }
}, 5 * 60 * 1000);

function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

server.listen(PORT, () => {
    console.log(`🌍 Plaggona Metaverse Server running on port ${PORT}`);
    console.log(`📍 Access the Agora at http://localhost:${PORT}`);
});
