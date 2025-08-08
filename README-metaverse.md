# 🌍 Plaggona Metaverse Server

Welcome to the Plaggona Metaverse! A decentralized virtual world where all users appear as Plaggona characters with customizable appearances, gathering in the Agora to chat and interact with each other.

## 🏛️ Features

### Core Metaverse Features
- **3D Virtual World**: Beautiful 3D environment built with Three.js
- **Real-time Multiplayer**: Socket.IO powered real-time communication
- **Character Customization**: Customize cloth colors and appearance
- **The Agora**: Central meeting place inspired by ancient Greek gathering spaces
- **Interactive Gestures**: Wave, dance, cheer, and think gestures
- **Live Chat System**: Real-time messaging with all users
- **Private Rooms**: Create and join private spaces for smaller groups

### Character System
- All users appear as Plaggona characters based on `plaggona.jpeg`
- Customizable cloth colors with color picker
- Nickname labels floating above characters
- Smooth movement and positioning

### Social Features
- **Public Chat**: Communicate with all users in the Agora
- **User Directory**: See all online Plaggonas
- **Gesture System**: Express yourself with animated gestures
- **User Interactions**: Click on users to wave, approach, or get info
- **Room System**: Create private meeting spaces

### Technical Features
- **Decentralized Architecture**: Peer-to-peer ready structure
- **WebGL 3D Rendering**: Hardware-accelerated graphics
- **Responsive Design**: Works on desktop and mobile
- **Real-time Synchronization**: All user movements and actions are live
- **Scalable Server**: Built to handle multiple users efficiently

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **For Development**
   ```bash
   npm run dev
   ```

4. **Access the Metaverse**
   Open your browser and go to `http://localhost:3000`

## 🎮 How to Use

### Entering the Agora
1. Enter your desired nickname
2. Choose your cloth color from the available options
3. Click "Enter the Agora" to join the metaverse

### Navigation Controls
- **WASD** or **Arrow Keys**: Move your Plaggona around
- **Mouse Drag**: Look around the 3D world
- **Mouse Wheel**: Zoom in and out

### Interacting
- **Chat**: Type messages in the chat box to communicate
- **Gestures**: Use gesture buttons to express emotions
- **User Interaction**: Click on other users to interact with them
- **Private Rooms**: Create or join private spaces for group conversations

### Chat Commands
- `/help` - Show help and available commands
- `/clear` - Clear chat messages
- `/who` - List all online users
- `/time` - Show current time

## 🏗️ Project Structure

```
plaggona-metaverse/
├── server.js                 # Main server file
├── package.json              # Project configuration
├── public/                   # Client-side files
│   ├── index.html            # Main HTML page
│   ├── style.css             # Metaverse styling
│   ├── assets/               # Static assets
│   │   └── plaggona.jpeg      # Plaggona character image
│   └── js/                   # JavaScript modules
│       ├── metaverse.js      # Main client controller
│       ├── world3d.js        # 3D world rendering
│       ├── chat.js           # Chat system
│       └── ui.js             # User interface management
├── charts/                   # Kubernetes deployment charts
└── Dockerfile               # Container configuration
```

## 🔧 Technology Stack

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **Socket.IO**: Real-time communication
- **UUID**: Unique identifier generation

### Frontend
- **Three.js**: 3D graphics and rendering
- **Socket.IO Client**: Real-time client communication
- **Vanilla JavaScript**: Core client logic
- **CSS3**: Modern styling with gradients and animations

### Infrastructure
- **Docker**: Containerization
- **Kubernetes**: Orchestration (Helm charts included)
- **WebGL**: Hardware-accelerated 3D graphics

## 🌐 API Endpoints

### REST API
- `GET /` - Serve the main metaverse application
- `GET /api/users` - Get all active users
- `GET /api/rooms` - Get available rooms

### Socket Events

#### Client → Server
- `join-agora` - Join the main Agora space
- `update-position` - Update user position
- `chat-message` - Send a chat message
- `gesture` - Send a gesture animation
- `create-room` - Create a private room
- `join-room` - Join an existing room

#### Server → Client
- `current-users` - Receive list of current users
- `user-joined` - A new user joined
- `user-left` - A user left
- `user-moved` - User position update
- `chat-message` - New chat message
- `user-gesture` - User performed a gesture

## 🎨 Customization

### Character Appearance
Characters are based on the Plaggona image with customizable:
- Cloth colors (predefined palette)
- Nickname labels
- Future: Additional accessories and variations

### Environment
The Agora includes:
- Central fountain
- Marble columns
- Wooden benches
- Beautiful sky gradient
- Grass ground with transparency

## 🚧 Deployment

### Docker
```bash
docker build -t plaggona-metaverse .
docker run -p 3000:3000 plaggona-metaverse
```

### Kubernetes
```bash
cd charts/plaggona-k8s
helm install plaggona-metaverse .
```

### Original K8s Deployment Notes
```bash
# Build the image
docker build -t localhost:32000/plaggona:latest .

# Push the image
docker push localhost:32000/plaggona:latest

# Package the chart
microk8s.helm3 package -d ./plaggona-k8s ./plaggona-k8s

# Install it
microk8s.helm3 install plaggona-k8s -n default ./plaggona-k8s/plaggona-k8s-0.1.0.tgz

# Uninstall if needed
microk8s.helm3 uninstall plaggona-k8s -n default
```

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Basic 3D world with Plaggona characters
- ✅ Real-time chat and movement
- ✅ Gesture system
- ✅ Private rooms

### Phase 2 (Planned)
- 🔄 Voice chat integration
- 🔄 More character customization options
- 🔄 Mini-games and activities
- 🔄 File sharing and media support

### Phase 3 (Future)
- 📋 VR/AR support
- 📋 NFT integration for unique Plaggonas
- 📋 Decentralized blockchain backend
- 📋 Cross-platform mobile apps

## 🤝 Contributing

We welcome contributions to the Plaggona Metaverse! Here's how you can help:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Follow JavaScript ES6+ standards
- Use meaningful commit messages
- Test on multiple browsers
- Ensure mobile compatibility
- Document new features

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Three.js community for excellent 3D graphics
- Socket.IO for real-time communication
- Ancient Greek agoras for inspiration
- The Plaggona community for continuous support

## 📞 Support

For questions, issues, or suggestions:
- Create an issue on GitHub
- Join our community discussions
- Contact: panagiotis@skarvelis.gr

---

**Welcome to the Plaggona Metaverse - Where every Plaggona has a story to tell! 🏛️✨**
