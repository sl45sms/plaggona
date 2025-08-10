// 3D World Renderer using Three.js
class World3D {
    constructor(metaverseClient) {
        this.metaverse = metaverseClient;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.userMeshes = new Map();
    this.baseAvatar = null; // Loaded Plaggona OBJ root
        this.cameraControls = {
            mouseX: 0,
            mouseY: 0,
            isMouseDown: false
        };
        this.playerPosition = { x: 0, y: 0, z: 0 };
        this.movement = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        this.gestureAnimations = new Map();
    }
    
    initialize() {
        this.canvas = document.getElementById('worldCanvas');
        this.setupScene();
        this.setupLights();
        this.setupGround();
        this.loadAvatarModel();
        this.setupControls();
        // Observe container resize for responsive layouts
        const container = document.getElementById('worldContainer');
        if (window.ResizeObserver && container) {
            this._resizeObserver = new ResizeObserver(() => this.handleResize());
            this._resizeObserver.observe(container);
        }
        this.handleResize();
        this.animate();
    }

    loadAvatarModel() {
        // Minimal inline OBJ loader (supports only v / vn / f with triangles or quads)
        const parseOBJ = (text) => {
            const positions = [];
            const normals = [];
            const faces = [];
            const lines = text.split(/\r?\n/);
            for (const line of lines) {
                if (!line || line.startsWith('#')) continue;
                const parts = line.trim().split(/\s+/);
                if (parts[0] === 'v') {
                    positions.push(parts.slice(1).map(Number));
                } else if (parts[0] === 'vn') {
                    normals.push(parts.slice(1).map(Number));
                } else if (parts[0] === 'f') {
                    // faces like v, v//vn, v/vt/vn, v//
                    const verts = parts.slice(1).map(p => {
                        const [vIdx, , nIdx] = p.split('/');
                        return { v: parseInt(vIdx, 10) - 1, n: nIdx ? parseInt(nIdx, 10) - 1 : null };
                    });
                    // Triangulate quads
                    if (verts.length === 4) {
                        faces.push([verts[0], verts[1], verts[2]]);
                        faces.push([verts[0], verts[2], verts[3]]);
                    } else if (verts.length === 3) {
                        faces.push(verts);
                    }
                }
            }
            // Build geometry
            const geo = new THREE.BufferGeometry();
            const positionArray = [];
            const normalArray = [];
            for (const tri of faces) {
                for (const v of tri) {
                    const pos = positions[v.v];
                    positionArray.push(pos[0], pos[1], pos[2]);
                    if (v.n != null && normals[v.n]) {
                        const n = normals[v.n];
                        normalArray.push(n[0], n[1], n[2]);
                    } else {
                        normalArray.push(0, 1, 0); // placeholder
                    }
                }
            }
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3));
            geo.setAttribute('normal', new THREE.Float32BufferAttribute(normalArray, 3));
            geo.computeBoundingBox();
            return geo;
        };

        fetch('assets/plaggona.obj')
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(text => {
                const geometry = parseOBJ(text);
                const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // Normalize & scale
                const box = geometry.boundingBox || new THREE.Box3().setFromObject(mesh);
                const size = new THREE.Vector3();
                box.getSize(size);
                const targetHeight = 1.8;
                if (size.y > 0) {
                    const scale = targetHeight / size.y;
                    mesh.scale.setScalar(scale);
                }
                // Center pivot to feet
                const centeredBox = new THREE.Box3().setFromObject(mesh);
                const center = new THREE.Vector3();
                centeredBox.getCenter(center);
                const yOffset = centeredBox.min.y;
                mesh.position.sub(center);
                mesh.position.y -= yOffset;

                const group = new THREE.Group();
                group.add(mesh);
                this.baseAvatar = group;
                console.log('Plaggona avatar model loaded (inline parser)');

                // Upgrade existing primitive avatars
                this.userMeshes.forEach((g, userId) => {
                    if (g.userData && g.userData.isPrimitive) {
                        this.scene.remove(g);
                        const user = this.metaverse.getUsers().get(userId);
                        if (user) {
                            const newMesh = this.createUserMesh(user, true);
                            this.userMeshes.set(userId, newMesh);
                            this.scene.add(newMesh);
                        }
                    }
                });
            })
            .catch(err => {
                console.warn('Failed to fetch/parse plaggona.obj, keeping primitive avatars', err);
            });
    }
    
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, 
            this.canvas.clientWidth / this.canvas.clientHeight, 
            0.1, 1000
        );
        this.camera.position.set(0, 5, 10);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
    const container = document.getElementById('worldContainer');
    const w = (container?.clientWidth) || this.canvas.clientWidth;
    const h = (container?.clientHeight) || this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
    
    setupGround() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90,  // Light green
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some decorative elements to the Agora
        this.createAgoraElements();
    }
    
    createAgoraElements() {
        // Central fountain
        const fountainGeometry = new THREE.CylinderGeometry(3, 4, 1, 16);
        const fountainMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const fountain = new THREE.Mesh(fountainGeometry, fountainMaterial);
        fountain.position.set(0, 0.5, 0);
        fountain.castShadow = true;
        this.scene.add(fountain);
        
        // Water in fountain
        const waterGeometry = new THREE.CylinderGeometry(2.8, 3.8, 0.2, 16);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4169E1, 
            transparent: true, 
            opacity: 0.8 
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(0, 1.1, 0);
        this.scene.add(water);
        
        // Columns around the agora
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 20;
            const z = Math.sin(angle) * 20;
            
            const columnGeometry = new THREE.CylinderGeometry(0.8, 1, 8, 8);
            const columnMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(x, 4, z);
            column.castShadow = true;
            this.scene.add(column);
        }
        
        // Benches
        for (let i = 0; i < 6; i++) {
            // Place benches evenly spaced in a circle of radius 12
            const placementAngle = (i / 6) * Math.PI * 2;
            const x = Math.cos(placementAngle) * 12;
            const z = Math.sin(placementAngle) * 12;

            const bench = this.createBench();
            bench.position.set(x, 0.5, z);

            // Default bench front faces +Z in local space. We want it to face the center (0,0,0).
            // Compute angle so that local +Z aligns with vector pointing to center (-x, -z).
            const angleToCenter = Math.atan2(-x, -z);
            bench.rotation.y = angleToCenter;
            this.scene.add(bench);
        }
    }
    
    createBench() {
        const benchGroup = new THREE.Group();
        
        // Seat
        const seatGeometry = new THREE.BoxGeometry(3, 0.2, 1);
        const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.6;
        benchGroup.add(seat);
        
        // Back
        const backGeometry = new THREE.BoxGeometry(3, 1, 0.2);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 1.1, -0.4);
        benchGroup.add(back);
        
        // Legs
        for (let i = 0; i < 4; i++) {
            const legGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.1);
            const leg = new THREE.Mesh(legGeometry, seatMaterial);
            const x = i < 2 ? -1.4 : 1.4;
            const z = i % 2 === 0 ? -0.4 : 0.4;
            leg.position.set(x, 0.3, z);
            benchGroup.add(leg);
        }
        
        benchGroup.castShadow = true;
        return benchGroup;
    }
    
    setupControls() {
        // Mouse controls for camera
        this.canvas.addEventListener('mousedown', (e) => {
            this.cameraControls.isMouseDown = true;
            this.cameraControls.mouseX = e.clientX;
            this.cameraControls.mouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.cameraControls.isMouseDown = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.cameraControls.isMouseDown) {
                const deltaX = e.clientX - this.cameraControls.mouseX;
                const deltaY = e.clientY - this.cameraControls.mouseY;
                
                this.camera.position.x += deltaX * 0.01;
                this.camera.position.y -= deltaY * 0.01;
                
                this.cameraControls.mouseX = e.clientX;
                this.cameraControls.mouseY = e.clientY;
            }
        });
        
        // Keyboard controls for movement
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowUp':
                    this.movement.forward = true;
                    break;
                case 'ArrowDown':
                    this.movement.backward = true;
                    break;
                case 'ArrowLeft':
                    this.movement.left = true;
                    break;
                case 'ArrowRight':
                    this.movement.right = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowUp':
                    this.movement.forward = false;
                    break;
                case 'ArrowDown':
                    this.movement.backward = false;
                    break;
                case 'ArrowLeft':
                    this.movement.left = false;
                    break;
                case 'ArrowRight':
                    this.movement.right = false;
                    break;
            }
        });
        
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoom = e.deltaY * 0.01;
            this.camera.position.z += zoom;
            this.camera.position.z = Math.max(5, Math.min(50, this.camera.position.z));
        });
    }
    
    createUserMesh(user, skipPrimitiveFallback = false) {
        const userGroup = new THREE.Group();
        let avatarRoot;
        if (this.baseAvatar) {
            avatarRoot = this.baseAvatar.clone(true);
            // Apply player-specific color to all mesh materials (multiply or set base color)
            avatarRoot.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => { if (m.color) m.color.set(user.appearance.clothColor); });
                    } else if (child.material.color) {
                        child.material.color.set(user.appearance.clothColor);
                    }
                }
            });
            userGroup.add(avatarRoot);
        } else if (!skipPrimitiveFallback) {
            // Primitive fallback (original simple geometry) while model not loaded
            userGroup.userData.isPrimitive = true;
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.3, 1.5, 8);
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: user.appearance.clothColor });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.75;
            body.castShadow = true;
            userGroup.add(body);
            const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFDBCB4 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.8;
            head.castShadow = true;
            userGroup.add(head);
        }

        // Nickname label (shared across both implementations)
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#333';
        context.font = 'Bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(user.nickname, canvas.width / 2, canvas.height / 2 + 7);
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1 });
        const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.y = 2.5;
        userGroup.add(label);

        userGroup.position.set(user.position.x, user.position.y, user.position.z);
        return userGroup;
    }
    
    addUser(user) {
        const userMesh = this.createUserMesh(user);
        this.userMeshes.set(user.id, userMesh);
        this.scene.add(userMesh);
    }
    
    removeUser(userId) {
        const userMesh = this.userMeshes.get(userId);
        if (userMesh) {
            this.scene.remove(userMesh);
            this.userMeshes.delete(userId);
        }
    }
    
    updateUserPosition(userId, position) {
        const userMesh = this.userMeshes.get(userId);
        if (userMesh) {
            userMesh.position.set(position.x, position.y, position.z);
        }
    }
    
    showGesture(userId, gesture, position) {
        // Create gesture effect
        let effectGeometry, effectMaterial;
        
        switch(gesture) {
            case 'wave':
                effectGeometry = new THREE.RingGeometry(1, 1.5, 8);
                effectMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFFD700, 
                    transparent: true, 
                    opacity: 0.7 
                });
                break;
            case 'dance':
                effectGeometry = new THREE.SphereGeometry(1, 8, 8);
                effectMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFF69B4, 
                    transparent: true, 
                    opacity: 0.5 
                });
                break;
            case 'cheer':
                effectGeometry = new THREE.ConeGeometry(0.5, 2, 4);
                effectMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00FF00, 
                    transparent: true, 
                    opacity: 0.6 
                });
                break;
            case 'think':
                effectGeometry = new THREE.TorusGeometry(0.8, 0.2, 8, 16);
                effectMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x4169E1, 
                    transparent: true, 
                    opacity: 0.7 
                });
                break;
            default:
                return;
        }
        
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.set(position.x, position.y + 2, position.z);
        this.scene.add(effect);
        
        // Animate and remove effect after 2 seconds
        let scale = 0;
        const animateEffect = () => {
            scale += 0.05;
            effect.scale.set(scale, scale, scale);
            effect.rotation.y += 0.1;
            
            if (scale < 1.5) {
                requestAnimationFrame(animateEffect);
            } else {
                this.scene.remove(effect);
            }
        };
        animateEffect();
    }
    
    updateMovement() {
        let moved = false;
        const speed = 0.2;
        
        if (this.movement.forward) {
            this.playerPosition.z -= speed;
            moved = true;
        }
        if (this.movement.backward) {
            this.playerPosition.z += speed;
            moved = true;
        }
        if (this.movement.left) {
            this.playerPosition.x -= speed;
            moved = true;
        }
        if (this.movement.right) {
            this.playerPosition.x += speed;
            moved = true;
        }
        
        // Constrain to bounds
        this.playerPosition.x = Math.max(-90, Math.min(90, this.playerPosition.x));
        this.playerPosition.z = Math.max(-90, Math.min(90, this.playerPosition.z));
        
        if (moved) {
            // Update camera to follow player
            this.camera.position.x = this.playerPosition.x;
            this.camera.position.z = this.playerPosition.z + 10;
            this.camera.lookAt(this.playerPosition.x, 0, this.playerPosition.z);
            
            // Send position update to server
            this.metaverse.updatePosition(this.playerPosition);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateMovement();
        
        // Make labels always face the camera
        this.userMeshes.forEach(userMesh => {
            const label = userMesh.children.find(child => 
                child.material && child.material.map
            );
            if (label) {
                label.lookAt(this.camera.position);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
    const container = document.getElementById('worldContainer');
    const width = (container?.clientWidth) || this.canvas.clientWidth || window.innerWidth;
    const height = (container?.clientHeight) || this.canvas.clientHeight || Math.max(200, window.innerHeight * 0.4);
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    }
}

// Export for other modules
if (typeof module !== 'undefined') {
    module.exports = World3D;
}
