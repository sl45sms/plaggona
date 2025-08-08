# Plaggona Metaverse 🌍

A simple decentralized metaverse where all users (Plaggones) gather in the Agora to chat and interact with each other. Production-ready with Docker containerization and Kubernetes orchestration.

look at this project soon, or not so soon...


# Orama

### what is that
The start for something unique.

plaggona, is the same metaphor for Greek as avatar in game/movies, not so as Hindu meaning, but you get the point.

The project aim to setup an infrastructure to hold plaggonas activities in metaverse worlds.

### aim to do
keep track of the digital memories while your plaggona lives on metaverse world, learning from what plaggona says, what action do, the behavior and the acts, keep all that for you referense and later when the plaggona matures bring it alive!

### how can you do that
using advance monitoring while you use and act with your plaggona on metaverse world.

## Features

- **3D Virtual World**: Immersive environment rendered with Three.js and WebGL
- **Real-time Multiplayer**: Seamless interaction using Socket.IO WebSockets
- **Character System**: Plaggona avatars with customizable variants (cloth colors)
- **Identity System**: Nickname labels displayed above characters
- **Chat System**: Real-time communication with commands and notifications
- **Gesture System**: Interactive character animations (wave, jump, dance)
- **Responsive Design**: Optimized for desktop and mobile devices
- **Production Ready**: Docker containerization with Kubernetes deployment

## Technology Stack

- **Backend**: Node.js 18 with Express.js
- **Real-time Communication**: Socket.IO with WebSocket fallbacks
- **3D Graphics**: Three.js with WebGL acceleration
- **Frontend**: Modern JavaScript (ES6 modules)
- **Styling**: CSS3 with Grid, Flexbox, and animations
- **Containerization**: Docker with Alpine Linux
- **Orchestration**: Kubernetes with Helm charts
- **Production Features**: HPA, health checks, TLS, monitoring

## 🚀 Quick Start

### Local Development

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd plaggona-metaverse
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   # or
   ./dev.sh
   ```

3. **Open browser**: Navigate to `http://localhost:3000`

### Docker Deployment

1. **Build container**:
   ```bash
   docker build -t plaggona-metaverse .
   ```

2. **Run container**:
   ```bash
   docker run -p 3000:3000 plaggona-metaverse
   ```

### Production Deployment

For full production deployment with Kubernetes, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

#### One-Click Deploy to Kubernetes
```bash
./deploy.sh
```

This automated script handles:
- Docker image building and registry push
- Helm chart packaging
- Kubernetes deployment with high availability
- Health check verification
- Auto-scaling configuration

## 🎮 How to Play

1. **Enter your nickname** when prompted
2. **Choose your cloth color** for character customization  
3. **Move around** the Agora using WASD keys or arrow keys
4. **Chat** with other Plaggones using the chat interface
5. **Use gestures** by clicking the gesture buttons (wave, jump, dance)
6. **Interact** with other players in real-time

## 🏗️ Architecture

### Project Structure
```
plaggona-metaverse/
├── server.js              # Express server with Socket.IO
├── package.json           # Dependencies and scripts  
├── Dockerfile             # Production container config
├── deploy.sh              # Kubernetes deployment script
├── dev.sh                 # Development startup script
├── public/
│   ├── index.html         # Main application interface
│   ├── style.css          # Comprehensive styling
│   └── js/
│       ├── metaverse.js   # Main client controller
│       ├── world3d.js     # Three.js 3D world renderer
│       ├── chat.js        # Real-time chat system
│       └── ui.js          # UI management and interactions
├── charts/plaggona-k8s/   # Kubernetes Helm charts
│   ├── Chart.yaml         # Helm chart metadata
│   ├── values.yaml        # Configuration values
│   └── templates/         # Kubernetes manifests
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── hpa.yaml       # Horizontal Pod Autoscaler
└── plaggona.jpeg           # Character texture asset
```

### System Components

#### Backend (server.js)
- **Express.js** HTTP server
- **Socket.IO** real-time WebSocket communication  
- **User Management** with session handling
- **Room System** for scalable multiplayer
- **Chat Commands** processing and response
- **Health Checks** for Kubernetes readiness

#### Frontend Client (public/js/)
- **MetaverseClient**: Main application controller
- **World3D**: Three.js scene management and rendering
- **ChatSystem**: Real-time messaging with commands
- **UIManager**: Interface interactions and responsive design

#### Container (Dockerfile)
- **Multi-stage Build**: Optimized production image
- **Alpine Linux Base**: Minimal attack surface (~50MB)
- **Security Hardening**: Non-root user execution
- **Health Monitoring**: Built-in container health checks

#### Kubernetes (charts/)
- **High Availability**: Auto-scaling 2-10 pods
- **Load Balancing**: Service mesh with health probes
- **TLS Termination**: SSL/TLS with Let's Encrypt
- **WebSocket Support**: Traefik ingress middleware

## 📡 API Endpoints

### HTTP API
- `GET /api/users` - List of online users with metadata
- `GET /api/health` - Health check for load balancers
- `GET /api/rooms` - Available rooms and user counts  
- `POST /api/users` - User registration endpoint

### WebSocket Events
- `user_joined` - New user connection notification
- `user_left` - User disconnection notification
- `user_moved` - Real-time position updates
- `chat_message` - Chat message broadcast
- `gesture_performed` - Character gesture animations
- `room_changed` - Room switching events

## 💬 Chat Commands

- `/help` - Show available commands and features
- `/who` - List all online users with details
- `/clear` - Clear local chat history
- `/time` - Display current server time
- `/rooms` - Show available rooms
- `/join <room>` - Switch to different room

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production          # Runtime environment
PORT=3000                    # Server port
LOG_LEVEL=info              # Logging verbosity
MAX_USERS=1000              # Connection limit
CHAT_HISTORY_LIMIT=100      # Message retention
```

### Kubernetes Configuration
```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 200m  
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## 📊 Performance Metrics

### Expected Performance
- **Startup Time**: < 30 seconds to ready state
- **Memory Usage**: 256-512MB per pod instance  
- **CPU Usage**: 200-500m per pod under load
- **Concurrent Users**: 100-500 per pod instance
- **API Response Time**: < 100ms for endpoints
- **WebSocket Latency**: < 50ms for real-time events

### Scaling Characteristics
- **Horizontal Scaling**: Auto-scales based on CPU/memory
- **Load Distribution**: Even distribution across pods
- **Session Stickiness**: Not required (stateless design)
- **Database**: In-memory (Redis/external DB ready)

## 🛠️ Development

### Local Development Environment
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests (when available)  
npm test

# Build for production
npm run build
```

### Docker Development
```bash
# Build development image
docker build -t plaggona-dev .

# Run with volume mounting for live updates
docker run -v $(pwd):/app -p 3000:3000 plaggona-dev
```

### Kubernetes Development
```bash
# Deploy to development namespace
microk8s.helm3 install plaggona-dev ./charts/plaggona-k8s \
    --namespace dev --create-namespace \
    --set image.tag=dev \
    --set replicaCount=1
```

## 🚀 Production Deployment

### Automated Deployment
The included `deploy.sh` script provides one-click production deployment:

```bash
./deploy.sh
```

### Manual Production Steps  
For detailed production deployment instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

### Production Checklist
- [ ] SSL certificates configured and validated
- [ ] Domain DNS pointing to Kubernetes cluster
- [ ] Resource limits appropriate for expected load
- [ ] Monitoring and alerting configured  
- [ ] Backup strategy implemented
- [ ] Security contexts properly configured
- [ ] Health checks responding correctly
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

## 🔒 Security Features

### Container Security
- **Non-root execution** with dedicated user (plaggona:1001)
- **Read-only root filesystem** compatibility
- **Minimal base image** (Alpine Linux)
- **Security scanning** ready for CI/CD

### Kubernetes Security  
- **Pod Security Context** with security constraints
- **Network Policies** for traffic isolation
- **RBAC** with minimal service account permissions
- **Secrets Management** for sensitive configuration

### Application Security
- **Input validation** for all user inputs
- **XSS protection** with content security policy
- **Rate limiting** for API endpoints  
- **WebSocket authentication** and authorization

## 🤝 Contributing

1. **Fork the repository** and create a feature branch
2. **Follow coding standards** and add tests
3. **Test locally** with `npm run dev`
4. **Test with Docker** using `docker build`
5. **Submit a Pull Request** with clear description

### Code Style
- **ESLint** configuration for JavaScript  
- **Prettier** for code formatting
- **JSDoc** for function documentation
- **Semantic commits** for change history

## 📄 License

This project is open source and available under the **[MIT License](LICENSE)**.

## 🆘 Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details
- **Issues**: Use GitHub Issues for bug reports and feature requests  
- **Email**: panagiotis@skarvelis.gr for deployment support
- **Monitoring**: Health checks available at `/api/health`

---

**🌍 Welcome to the production-ready Plaggona Metaverse! 🚀**

*Deployed with Docker + Kubernetes for enterprise-scale metaverse experiences*
