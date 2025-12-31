// Game variables
let scene, camera, renderer, player, enemies = [];
let cameraSystem; // New camera system
let keys = {};
let mouseX = 0, mouseY = 0;
let mouseWorldPos = new THREE.Vector3(); // World position of mouse
let targetingCircle; // Global targeting circle that follows mouse
let health = 100;
let attackCooldown = 0;
let abilityCooldown = 0;
let dodgeCooldown = 0;
let currentImmortal = 'flame';
let isDodging = false;

// Dimension system
let currentDimension = 'home'; // 'home' or 'war'
let homeScene, warScene;
let portal; // Portal object for teleportation

// Audio system
let homeMusic, warMusic;
let currentMusic = null;
let musicVolume = 0.3; // Default volume (30%)
let audioInitialized = false; // Track if audio context is ready

// Immortal definitions with hitbox properties
const immortals = {
    flame: {
        name: 'Flame',
        color: 0xff4444,
        attackRange: 4,
        attackDamage: 35,
        attackCooldown: 400,
        abilityCooldown: 2000,
        speed: 0.12,
        // Hitbox properties - Curved flame sweep with damage area
        hitboxType: 'curve', // Curved flame attack
        hitboxRange: 4,      // How far the attack reaches
        hitboxWidth: 90,     // Curve angle in degrees
        damageRadius: 3,     // Width of the damage area
        curveIntensity: 0.8, // How curved the attack is (0-1)
        areaEffect: true     // Has area damage effect
    },
    storm: {
        name: 'Storm',
        color: 0x4444ff,
        attackRange: 8,
        attackDamage: 20,
        attackCooldown: 300,
        abilityCooldown: 3000,
        speed: 0.15,
        // Hitbox properties - Lightning chain
        hitboxType: 'chain', // Chain lightning attack
        hitboxRange: 8,      // Long range
        hitboxWidth: 2,      // Chain width
        damageRadius: 1.5,   // Splash around each hit
        maxChains: 3         // Maximum chain targets
    },
    earth: {
        name: 'Earth',
        color: 0x8b4513,
        attackRange: 2.5,
        attackDamage: 40,
        attackCooldown: 800,
        abilityCooldown: 4000,
        speed: 0.08,
        // Hitbox properties - Ground slam wave
        hitboxType: 'wave', // Expanding wave attack
        hitboxRange: 2.5,   // Wave travel distance
        hitboxWidth: 180,   // Wave spread angle
        damageRadius: 3,    // Wave width
        waveSpeed: 0.2      // How fast wave expands
    },
    shadow: {
        name: 'Shadow',
        color: 0x444444,
        attackRange: 4,
        attackDamage: 35,
        attackCooldown: 250,
        abilityCooldown: 1500,
        speed: 0.18,
        // Hitbox properties - Crescent slash
        hitboxType: 'crescent', // Crescent-shaped slash
        hitboxRange: 4,         // Slash reach
        hitboxWidth: 90,        // Crescent angle
        damageRadius: 1.5,      // Slash thickness
        crescentCurve: 0.8      // How curved the crescent is
    }
};


// Game settings
const DODGE_DISTANCE = 3;
const DODGE_DURATION = 300;

// Initialize the game
function init() {
    console.log("Initializing game...");
    
    // Create camera first (shared between dimensions)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 20; // Match camera system frustum size
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, // left
        frustumSize * aspect / 2,  // right
        frustumSize / 2,           // top
        frustumSize / -2,          // bottom
        0.1,                       // near
        1000                       // far
    );
    
    console.log("Camera created");
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(renderer.domElement);
    
    console.log("Renderer created");
    
    // Create both dimensions
    createHomeDimension();
    createWarDimension();
    
    console.log("Dimensions created");
    
    // Create player (will be added to current scene)
    createPlayer();
    
    console.log("Player created");
    
    // Initialize camera system
    initializeCameraSystem();
    
    console.log("Camera system initialized");
    
    // Audio will be initialized on first user interaction
    
    // Start in home dimension
    switchToDimension('home');
    
    console.log("Switched to home dimension");
    
    // Set up event listeners
    setupEventListeners();
    
    console.log("Event listeners set up");
    
    // Start game loop
    animate();
    
    console.log("Game loop started");
}

function initializeAudio() {
    try {
        // Create audio objects for both scenes
        homeMusic = new Audio('assets/audio/home-music.mp3');
        warMusic = new Audio('assets/audio/war-music.mp3');
        
        // Configure home music (peaceful, looping)
        homeMusic.loop = true;
        homeMusic.volume = musicVolume;
        homeMusic.preload = 'auto';
        
        // Configure war music (intense, looping)
        warMusic.loop = true;
        warMusic.volume = musicVolume;
        warMusic.preload = 'auto';
        
        console.log("Audio files loaded successfully");
        
        // Update UI status
        const audioStatusElement = document.getElementById('audioStatus');
        if (audioStatusElement) {
            audioStatusElement.textContent = 'Ready';
        }
        
        // Add error handling
        homeMusic.addEventListener('error', (e) => {
            console.warn("Home music failed to load:", e);
            if (audioStatusElement) {
                audioStatusElement.textContent = 'Error loading home music';
            }
        });
        
        warMusic.addEventListener('error', (e) => {
            console.warn("War music failed to load:", e);
            if (audioStatusElement) {
                audioStatusElement.textContent = 'Error loading war music';
            }
        });
        
        // Add loaded event listeners
        homeMusic.addEventListener('canplaythrough', () => {
            console.log("Home music ready to play");
        });
        
        warMusic.addEventListener('canplaythrough', () => {
            console.log("War music ready to play");
        });
        
        // Start playing music for current dimension if we're already in a dimension
        if (currentDimension === 'home') {
            playMusic('home');
        } else if (currentDimension === 'war') {
            playMusic('war');
        }
        
    } catch (error) {
        console.error("Failed to initialize audio:", error);
        const audioStatusElement = document.getElementById('audioStatus');
        if (audioStatusElement) {
            audioStatusElement.textContent = 'Failed to initialize';
        }
    }
}

function playMusic(musicType) {
    try {
        // Check if audio is initialized
        if (!audioInitialized) {
            console.log("Audio not yet initialized - waiting for user interaction");
            return;
        }
        
        // Stop current music if playing
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0;
        }
        
        // Select and play new music
        if (musicType === 'home' && homeMusic) {
            currentMusic = homeMusic;
            homeMusic.play().then(() => {
                console.log("Home music started successfully");
            }).catch(e => {
                console.warn("Could not play home music:", e);
                // Try to initialize audio on next user interaction
                audioInitialized = false;
            });
        } else if (musicType === 'war' && warMusic) {
            currentMusic = warMusic;
            warMusic.play().then(() => {
                console.log("War music started successfully");
            }).catch(e => {
                console.warn("Could not play war music:", e);
                // Try to initialize audio on next user interaction
                audioInitialized = false;
            });
        }
    } catch (error) {
        console.error("Error playing music:", error);
    }
}

function stopMusic() {
    try {
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0;
            currentMusic = null;
            console.log("Music stopped");
        }
    } catch (error) {
        console.error("Error stopping music:", error);
    }
}

function setMusicVolume(volume) {
    musicVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    
    if (homeMusic) homeMusic.volume = musicVolume;
    if (warMusic) warMusic.volume = musicVolume;
    
    console.log(`Music volume set to ${Math.round(musicVolume * 100)}%`);
}

function initializeAudioOnInteraction() {
    if (audioInitialized) return;
    
    try {
        // Try to play a silent sound to unlock audio context
        if (homeMusic && homeMusic.readyState >= 2) { // HAVE_CURRENT_DATA
            const playPromise = homeMusic.play();
            if (playPromise) {
                playPromise.then(() => {
                    homeMusic.pause();
                    homeMusic.currentTime = 0;
                    audioInitialized = true;
                    console.log("Audio context initialized successfully");
                    
                    // Start home music if we're in home dimension
                    if (currentDimension === 'home') {
                        playMusic('home');
                    } else if (currentDimension === 'war') {
                        playMusic('war');
                    }
                }).catch(e => {
                    console.warn("Audio initialization failed:", e);
                });
            }
        } else {
            // If audio isn't ready, mark as initialized anyway and try later
            audioInitialized = true;
            console.log("Audio marked as initialized, will try to play when ready");
        }
    } catch (error) {
        console.error("Error initializing audio:", error);
    }
}

function createHomeDimension() {
    // Create peaceful home scene
    homeScene = new THREE.Scene();
    
    // Load and set background image
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'assets/images/home-background.png',
        function(texture) {
            // Success callback - create skybox sphere
            console.log("Home background image loaded successfully");
            
            // Create a large sphere for skybox effect
            const skyboxGeometry = new THREE.SphereGeometry(500, 32, 32);
            const skyboxMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide // Render inside of sphere
            });
            
            const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
            skybox.position.set(0, 0, 0);
            homeScene.add(skybox);
            
            // Also set as scene background for fallback
            homeScene.background = texture;
        },
        function(progress) {
            // Progress callback
            if (progress.total > 0) {
                console.log("Loading home background:", Math.round(progress.loaded / progress.total * 100) + '%');
            }
        },
        function(error) {
            // Error callback - fallback to solid color
            console.warn("Failed to load home background image:", error);
            homeScene.background = new THREE.Color(0x87CEEB); // Sky blue fallback
        }
    );
    
    // Softer lighting for home
    const homeAmbientLight = new THREE.AmbientLight(0x404040, 0.9);
    homeScene.add(homeAmbientLight);
    
    const homeSunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    homeSunLight.position.set(10, 15, 5);
    homeSunLight.castShadow = true;
    homeSunLight.shadow.mapSize.width = 2048;
    homeSunLight.shadow.mapSize.height = 2048;
    homeScene.add(homeSunLight);
    
    // Create peaceful grass ground (slightly transparent to blend with background)
    const homeGroundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
    const homeGroundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x228B22, // Forest green
        transparent: true,
        opacity: 0.8, // Slightly transparent to show background
        wireframe: false
    });
    const homeGround = new THREE.Mesh(homeGroundGeometry, homeGroundMaterial);
    homeGround.rotation.x = -Math.PI / 2;
    homeGround.receiveShadow = true;
    homeScene.add(homeGround);
    
    // Add peaceful grid (more subtle)
    const homeGridHelper = new THREE.GridHelper(100, 50, 0x90EE90, 0x98FB98);
    homeGridHelper.position.y = 0.01;
    homeGridHelper.material.opacity = 0.3; // Make grid more subtle
    homeGridHelper.material.transparent = true;
    homeScene.add(homeGridHelper);
    
    // Create home walls (decorative, not barriers)
    createHomeWalls();
    
    // Create portal to war dimension
    createPortal(homeScene, 'war', new THREE.Vector3(0, 1, -20), 0xff4444); // Red portal to war
    
    // Add some peaceful decorations
    createHomeDecorations();
}

function createWarDimension() {
    // Create dark war scene
    warScene = new THREE.Scene();
    warScene.background = new THREE.Color(0x1a1a2e); // Dark background
    
    // Harsh lighting for war
    const warAmbientLight = new THREE.AmbientLight(0x404040, 0.6);
    warScene.add(warAmbientLight);
    
    const warLight = new THREE.DirectionalLight(0xffffff, 1.0);
    warLight.position.set(10, 10, 5);
    warLight.castShadow = true;
    warLight.shadow.mapSize.width = 2048;
    warLight.shadow.mapSize.height = 2048;
    warScene.add(warLight);
    
    // Create battle ground
    const warGroundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
    const warGroundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2d2d44, // Dark ground
        wireframe: false
    });
    const warGround = new THREE.Mesh(warGroundGeometry, warGroundMaterial);
    warGround.rotation.x = -Math.PI / 2;
    warGround.receiveShadow = true;
    warScene.add(warGround);
    
    // Add battle grid
    const warGridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x333333);
    warGridHelper.position.y = 0.01;
    warScene.add(warGridHelper);
    
    // Create war walls (actual barriers)
    createWarWalls();
    
    // No portal in war dimension - player must defeat enemies to return home
    
    // Create enemies in war dimension
    createEnemies();
}

function createHomeWalls() {
    const wallHeight = 4; // Lower walls for home
    const wallThickness = 0.5;
    const worldSize = 50;
    
    // Peaceful wall material - light stone
    const homeWallMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xD2B48C, // Tan color
        transparent: false
    });
    
    // Create decorative walls (not full barriers)
    const wallSegments = [
        // North wall segments (with gaps)
        { pos: [-30, wallHeight / 2, worldSize], size: [30, wallHeight, wallThickness] },
        { pos: [30, wallHeight / 2, worldSize], size: [30, wallHeight, wallThickness] },
        
        // South wall segments
        { pos: [-30, wallHeight / 2, -worldSize], size: [30, wallHeight, wallThickness] },
        { pos: [30, wallHeight / 2, -worldSize], size: [30, wallHeight, wallThickness] },
        
        // East wall segments
        { pos: [worldSize, wallHeight / 2, -30], size: [wallThickness, wallHeight, 30] },
        { pos: [worldSize, wallHeight / 2, 30], size: [wallThickness, wallHeight, 30] },
        
        // West wall segments
        { pos: [-worldSize, wallHeight / 2, -30], size: [wallThickness, wallHeight, 30] },
        { pos: [-worldSize, wallHeight / 2, 30], size: [wallThickness, wallHeight, 30] }
    ];
    
    wallSegments.forEach(segment => {
        const wallGeometry = new THREE.BoxGeometry(...segment.size);
        const wall = new THREE.Mesh(wallGeometry, homeWallMaterial);
        wall.position.set(...segment.pos);
        wall.castShadow = true;
        wall.receiveShadow = true;
        homeScene.add(wall);
    });
}

function createWarWalls() {
    const wallHeight = 8;
    const wallThickness = 1;
    const worldSize = 50;
    
    // Dark war wall material
    const warWallMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333,
        transparent: false
    });
    
    // Create full barrier walls
    const walls = [
        // North wall
        { pos: [0, wallHeight / 2, worldSize + wallThickness / 2], size: [100 + wallThickness * 2, wallHeight, wallThickness] },
        // South wall
        { pos: [0, wallHeight / 2, -worldSize - wallThickness / 2], size: [100 + wallThickness * 2, wallHeight, wallThickness] },
        // East wall
        { pos: [worldSize + wallThickness / 2, wallHeight / 2, 0], size: [wallThickness, wallHeight, 100] },
        // West wall
        { pos: [-worldSize - wallThickness / 2, wallHeight / 2, 0], size: [wallThickness, wallHeight, 100] }
    ];
    
    walls.forEach(wallData => {
        const wallGeometry = new THREE.BoxGeometry(...wallData.size);
        const wall = new THREE.Mesh(wallGeometry, warWallMaterial);
        wall.position.set(...wallData.pos);
        wall.castShadow = true;
        wall.receiveShadow = true;
        warScene.add(wall);
    });
    
    // Store wall boundaries for collision detection (only in war dimension)
    window.worldBounds = {
        minX: -worldSize,
        maxX: worldSize,
        minZ: -worldSize,
        maxZ: worldSize
    };
}

function createHomeDecorations() {
    // Add some trees and peaceful elements
    for (let i = 0; i < 8; i++) {
        // Create simple tree
        const treeGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4);
        const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Brown
        const tree = new THREE.Mesh(treeGeometry, treeMaterial);
        
        // Random position around the area
        const angle = (i / 8) * Math.PI * 2;
        const distance = 15 + Math.random() * 20;
        tree.position.set(
            Math.cos(angle) * distance,
            2,
            Math.sin(angle) * distance
        );
        
        tree.castShadow = true;
        homeScene.add(tree);
        
        // Add tree top
        const leavesGeometry = new THREE.SphereGeometry(2, 8, 6);
        const leavesMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 }); // Green
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(tree.position.x, tree.position.y + 3, tree.position.z);
        leaves.castShadow = true;
        homeScene.add(leaves);
    }
}

function createPortal(targetScene, destinationDimension, position, color) {
    // Create portal ring
    const portalGeometry = new THREE.RingGeometry(1.5, 2.5, 16);
    const portalMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const portalRing = new THREE.Mesh(portalGeometry, portalMaterial);
    portalRing.position.copy(position);
    portalRing.rotation.x = -Math.PI / 2; // Lay flat on ground
    targetScene.add(portalRing);
    
    // Create portal center effect
    const centerGeometry = new THREE.CircleGeometry(1.5, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    const portalCenter = new THREE.Mesh(centerGeometry, centerMaterial);
    portalCenter.position.copy(position);
    portalCenter.position.y += 0.01; // Slightly above ring
    portalCenter.rotation.x = -Math.PI / 2;
    targetScene.add(portalCenter);
    
    // Store portal data for collision detection
    if (!window.portals) window.portals = [];
    window.portals.push({
        position: position.clone(),
        destination: destinationDimension,
        radius: 2.5,
        ring: portalRing,
        center: portalCenter
    });
    
    return { ring: portalRing, center: portalCenter };
}

function switchToDimension(dimension) {
    currentDimension = dimension;
    
    // Remove player from current scene first
    if (player && player.parent) {
        player.parent.remove(player);
    }
    
    if (dimension === 'home') {
        scene = homeScene;
        // Reset player position for home
        if (player) {
            player.position.set(0, 0.5, 0);
            homeScene.add(player);
        }
        // Clear enemies array (no enemies in home)
        enemies.forEach(enemy => {
            if (enemy.parent) enemy.parent.remove(enemy);
        });
        enemies = [];
        
        // Switch to peaceful home music
        playMusic('home');
        
        console.log("Switched to Home Dimension - peaceful area");
    } else if (dimension === 'war') {
        scene = warScene;
        // Reset player position for war
        if (player) {
            player.position.set(0, 0.5, 0);
            warScene.add(player);
        }
        // Create enemies if they don't exist
        if (enemies.length === 0) {
            createEnemies();
        }
        
        // Switch to intense war music
        playMusic('war');
        
        console.log("Switched to War Dimension - battle area");
    }
    
    // Update camera system for new scene
    if (cameraSystem) {
        cameraSystem.update();
    }
}

function createPlayer() {
    // Create simple 3D cube player - no textures
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: immortals.flame.color });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.5, 0);
    player.castShadow = true;
    
    // Create targeting circle under the player
    const circleGeometry = new THREE.RingGeometry(0.8, 1.0, 16);
    const circleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    targetingCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    targetingCircle.rotation.x = -Math.PI / 2;
    targetingCircle.position.y = 0.02; // Slightly above ground
    player.add(targetingCircle); // Attach to player so it follows
    
    // Create range indicator circle
    const rangeGeometry = new THREE.RingGeometry(immortals.flame.attackRange - 0.1, immortals.flame.attackRange, 32);
    const rangeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const rangeIndicator = new THREE.Mesh(rangeGeometry, rangeMaterial);
    rangeIndicator.rotation.x = -Math.PI / 2;
    rangeIndicator.position.y = 0.01; // Just above ground
    player.add(rangeIndicator);
    
    // Create arrow that points towards mouse
    const arrowGeometry = new THREE.ConeGeometry(0.2, 0.6, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        transparent: true, 
        opacity: 0.8
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.rotation.x = -Math.PI / 2; // Point upward initially
    arrow.position.y = 0.05; // Slightly above targeting circle
    targetingCircle.add(arrow); // Attach to targeting circle
    
    // Don't add to scene here - will be added when switching dimensions
    // scene.add(player);
    
    // Store arrow and range indicator references
    player.userData = {
        arrow: arrow,
        rangeIndicator: rangeIndicator
    };
}

function initializeCameraSystem() {
    // Following isometric camera system - camera follows player
    cameraSystem = {
        // Camera offset from player for isometric view
        offset: { x: 8, y: 12, z: 8 }, // Behind and above player
        followSpeed: 0.1, // How smoothly camera follows
        frustumSize: 20, // View size
        
        // Shake system for effects
        shakeIntensity: 0,
        shakeDuration: 0,
        shakeOffset: { x: 0, y: 0, z: 0 },
        
        update: function() {
            if (!player) return;
            
            // Update camera shake
            this.updateShake();
            
            // Calculate target position relative to player
            const targetPosition = new THREE.Vector3(
                player.position.x + this.offset.x + this.shakeOffset.x,
                this.offset.y + this.shakeOffset.y,
                player.position.z + this.offset.z + this.shakeOffset.z
            );
            
            // Smooth camera following
            camera.position.lerp(targetPosition, this.followSpeed);
            
            // Look at player position
            const lookAtTarget = new THREE.Vector3(
                player.position.x,
                player.position.y + 0.5, // Look slightly above player
                player.position.z
            );
            
            camera.lookAt(lookAtTarget);
        },
        
        updateShake: function() {
            if (this.shakeDuration > 0) {
                // Generate random shake offset
                this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
                this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
                this.shakeOffset.z = (Math.random() - 0.5) * this.shakeIntensity;
                
                // Decay shake over time
                this.shakeDuration -= 16; // Approximate frame time
                this.shakeIntensity *= 0.95;
                
                if (this.shakeDuration <= 0) {
                    this.stopShake();
                }
            }
        },
        
        zoom: function(delta) {
            // Zoom by adjusting frustum size for orthographic camera
            this.frustumSize += delta;
            this.frustumSize = Math.max(10, Math.min(40, this.frustumSize));
            
            // Update camera frustum
            const aspect = window.innerWidth / window.innerHeight;
            camera.left = this.frustumSize * aspect / -2;
            camera.right = this.frustumSize * aspect / 2;
            camera.top = this.frustumSize / 2;
            camera.bottom = this.frustumSize / -2;
            camera.updateProjectionMatrix();
        },
        
        shake: function(intensity = 0.5, duration = 300) {
            this.shakeIntensity = intensity;
            this.shakeDuration = duration;
        },
        
        stopShake: function() {
            this.shakeIntensity = 0;
            this.shakeDuration = 0;
            this.shakeOffset = { x: 0, y: 0, z: 0 };
        }
    };
    
    // Set initial camera position relative to player spawn
    camera.position.set(
        cameraSystem.offset.x, 
        cameraSystem.offset.y, 
        cameraSystem.offset.z
    );
    camera.lookAt(0, 0.5, 0); // Look at player spawn position
    
    // Update frustum size
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = cameraSystem.frustumSize * aspect / -2;
    camera.right = cameraSystem.frustumSize * aspect / 2;
    camera.top = cameraSystem.frustumSize / 2;
    camera.bottom = cameraSystem.frustumSize / -2;
    camera.updateProjectionMatrix();
}

function createWorldWalls() {
    const wallHeight = 8;
    const wallThickness = 1;
    const worldSize = 50; // Half of ground size (100/2)
    
    // Wall material - dark stone-like appearance
    const wallMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333,
        transparent: false
    });
    
    // Create four walls around the world perimeter
    const walls = [];
    
    // North wall (positive Z)
    const northWallGeometry = new THREE.BoxGeometry(100 + wallThickness * 2, wallHeight, wallThickness);
    const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, wallHeight / 2, worldSize + wallThickness / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    walls.push(northWall);
    
    // South wall (negative Z)
    const southWallGeometry = new THREE.BoxGeometry(100 + wallThickness * 2, wallHeight, wallThickness);
    const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, wallHeight / 2, -worldSize - wallThickness / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    walls.push(southWall);
    
    // East wall (positive X)
    const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 100);
    const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(worldSize + wallThickness / 2, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    walls.push(eastWall);
    
    // West wall (negative X)
    const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 100);
    const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-worldSize - wallThickness / 2, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    walls.push(westWall);
    
    // Store wall boundaries for collision detection
    window.worldBounds = {
        minX: -worldSize,
        maxX: worldSize,
        minZ: -worldSize,
        maxZ: worldSize
    };
    
    console.log("World walls created with boundaries:", window.worldBounds);
}

function createEnemies() {
    for (let i = 0; i < 8; i++) {
        // Stagger enemy deployment
        setTimeout(() => {
            createSingleEnemy(i);
        }, i * 500); // 500ms delay between each enemy spawn
    }
}

function createSingleEnemy(index) {
    // Determine enemy type with more variety
    const enemyTypeRoll = Math.random();
    let enemyType, enemyColor;
    
    if (enemyTypeRoll > 0.8) {
        enemyType = 'curve'; // 20% chance - curve attackers
        enemyColor = 0xaa4444; // Reddish for curve attackers
    } else if (enemyTypeRoll > 0.6) {
        enemyType = 'fast'; // 20% chance - fast precise attackers
        enemyColor = 0x888888; // Gray for fast
    } else {
        enemyType = 'normal'; // 60% chance - normal circle attackers
        enemyColor = 0x666666; // Dark gray for normal
    }
    
    // Create simple 3D cube enemy - no textures
    const enemyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: enemyColor });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    
    // Random position around the player in a circle
    const angle = (index / 8) * Math.PI * 2;
    const distance = 8 + Math.random() * 15;
    const finalPosition = new THREE.Vector3(
        Math.cos(angle) * distance,
        0.4,
        Math.sin(angle) * distance
    );
    
    // Start enemy underground for deploy animation
    enemy.position.copy(finalPosition);
    enemy.position.y = -2; // Start underground
    enemy.scale.set(0.1, 0.1, 0.1); // Start very small
    
    enemy.castShadow = true;
    
    // Enemy stats and hitbox properties
    enemy.health = 60;
    enemy.maxHealth = 60;
    enemy.type = enemyType;
    
    // Set properties based on enemy type
    if (enemyType === 'curve') {
        // Curve enemies - sweeping curve attacks
        enemy.speed = 0.03;
        enemy.attackRange = 2.5;
        enemy.attackDamage = 25;
        enemy.attackCooldown = 1500;
        enemy.hitboxType = 'curve';
        enemy.damageRadius = 2.0;
        enemy.curveAngle = 90; // Degrees
        enemy.curveIntensity = 0.7;
    } else if (enemyType === 'fast') {
        // Fast enemies - quick, precise attacks
        enemy.speed = 0.04;
        enemy.attackRange = 1.5;
        enemy.attackDamage = 15;
        enemy.attackCooldown = 800;
        enemy.hitboxType = 'precise';
        enemy.damageRadius = 0.8;
    } else {
        // Normal enemies - slower, area attacks
        enemy.speed = 0.025;
        enemy.attackRange = 2.0;
        enemy.attackDamage = 20;
        enemy.attackCooldown = 1200;
        enemy.hitboxType = 'circle';
        enemy.damageRadius = 1.5;
    }
    
    enemy.lastAttackTime = 0;
    
    // Deploy state - enemy can't act until fully deployed
    enemy.isDeploying = true;
    enemy.deployTime = 1000; // 1 second deploy time
    
    // Add enemy to war scene specifically
    if (warScene) {
        warScene.add(enemy);
    } else {
        scene.add(enemy);
    }
    enemies.push(enemy);
    
    // Create deploy effect
    createEnemyDeployEffect(enemy, finalPosition);
    
    // Animate enemy deployment
    animateEnemyDeploy(enemy, finalPosition);
    
    console.log(`Enemy ${index + 1} (${enemyType}) deploying...`);
}

function createEnemyDeployEffect(enemy, finalPosition) {
    // Create ground crack effect
    const crackGeometry = new THREE.RingGeometry(0.5, 2, 8);
    const crackMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x8B4513, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const crack = new THREE.Mesh(crackGeometry, crackMaterial);
    crack.position.copy(finalPosition);
    crack.position.y = 0.01;
    crack.rotation.x = -Math.PI / 2;
    
    if (warScene) {
        warScene.add(crack);
    } else {
        scene.add(crack);
    }
    
    // Create dust particles
    const dustEffects = [];
    for (let i = 0; i < 6; i++) {
        const dustGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const dustMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8B7355, 
            transparent: true, 
            opacity: 0.6
        });
        
        const dust = new THREE.Mesh(dustGeometry, dustMaterial);
        dust.position.copy(finalPosition);
        dust.position.x += (Math.random() - 0.5) * 3;
        dust.position.z += (Math.random() - 0.5) * 3;
        dust.position.y = 0.2;
        
        if (warScene) {
            warScene.add(dust);
        } else {
            scene.add(dust);
        }
        dustEffects.push(dust);
    }
    
    // Animate deploy effects
    let effectTime = 0;
    const animateDeployEffect = () => {
        effectTime += 16;
        
        // Animate crack
        crack.scale.set(1 + effectTime * 0.001, 1 + effectTime * 0.001, 1);
        crack.material.opacity = Math.max(0, 0.8 - effectTime * 0.0008);
        
        // Animate dust
        dustEffects.forEach((dust, index) => {
            dust.position.y += 0.02;
            dust.material.opacity = Math.max(0, 0.6 - effectTime * 0.0006);
            dust.scale.multiplyScalar(1.01);
        });
        
        if (effectTime < 1500) {
            requestAnimationFrame(animateDeployEffect);
        } else {
            // Clean up effects
            if (crack.parent) crack.parent.remove(crack);
            dustEffects.forEach(dust => {
                if (dust.parent) dust.parent.remove(dust);
            });
        }
    };
    
    animateDeployEffect();
}

function animateEnemyDeploy(enemy, finalPosition) {
    const startTime = Date.now();
    const deployDuration = 1000; // 1 second
    
    const animateDeploy = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / deployDuration, 1);
        
        // Ease-out animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Animate position (rise from underground)
        enemy.position.y = -2 + (finalPosition.y + 2) * easeProgress;
        
        // Animate scale (grow from small to normal)
        const scale = 0.1 + 0.9 * easeProgress;
        enemy.scale.set(scale, scale, scale);
        
        // Add slight rotation during deploy
        enemy.rotation.y = (1 - progress) * Math.PI * 2;
        
        if (progress < 1) {
            requestAnimationFrame(animateDeploy);
        } else {
            // Deploy complete
            enemy.isDeploying = false;
            enemy.position.copy(finalPosition);
            enemy.scale.set(1, 1, 1);
            enemy.rotation.y = 0;
            console.log("Enemy deployed and ready for combat!");
        }
    };
    
    animateDeploy();
}

function setupEventListeners() {
    // Function to initialize audio on first user interaction
    function initializeAudioOnInteraction() {
        if (!audioInitialized) {
            initializeAudio();
            audioInitialized = true;
            console.log("Audio initialized on user interaction");
        }
    }
    
    // Keyboard events
    document.addEventListener('keydown', (event) => {
        // Initialize audio on first keypress
        initializeAudioOnInteraction();
        
        keys[event.code] = true;
    });
    
    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
    
    // Mouse events
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Convert mouse position to world coordinates
        updateMouseWorldPosition();
    });
    
    document.addEventListener('click', (event) => {
        // Initialize audio on first click
        initializeAudioOnInteraction();
        
        if (event.button === 0) { // Left click
            attack();
        }
    });
    
    document.addEventListener('contextmenu', (event) => {
        // Initialize audio on right click
        initializeAudioOnInteraction();
        
        event.preventDefault(); // Prevent context menu
        useSpecialAbility();
        // Add stronger camera shake for special abilities
        cameraSystem.shake(0.8, 400);
    });
    
    // Number keys for immortal switching
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Digit1') switchImmortal('flame');
        if (event.code === 'Digit2') switchImmortal('storm');
        if (event.code === 'Digit3') switchImmortal('earth');
        if (event.code === 'Digit4') switchImmortal('shadow');
        if (event.code === 'Space') dodgeRoll();
        if (event.code === 'KeyH') {
            // Press H to return home from war dimension
            if (currentDimension === 'war') {
                console.log("Returning home from war...");
                switchToDimension('home');
            }
        }
        // Music controls
        if (event.code === 'KeyM') {
            // Press M to mute/unmute music
            if (musicVolume > 0) {
                setMusicVolume(0);
                console.log("Music muted");
            } else {
                setMusicVolume(0.3);
                console.log("Music unmuted");
            }
        }
        if (event.code === 'Equal' || event.code === 'NumpadAdd') {
            // Press + to increase volume
            setMusicVolume(musicVolume + 0.1);
        }
        if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
            // Press - to decrease volume
            setMusicVolume(musicVolume - 0.1);
        }
    });
    
    // Mouse wheel for camera zoom (2.5D orthographic)
    document.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomDelta = event.deltaY > 0 ? 2 : -2;
        cameraSystem.zoom(zoomDelta);
    });
    
    // Window resize - update orthographic camera
    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = cameraSystem.frustumSize * aspect / -2;
        camera.right = cameraSystem.frustumSize * aspect / 2;
        camera.top = cameraSystem.frustumSize / 2;
        camera.bottom = cameraSystem.frustumSize / -2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function updateMouseWorldPosition() {
    if (!camera || !player) return;
    
    // Create raycaster to convert mouse position to world coordinates
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(mouseX, mouseY);
    
    raycaster.setFromCamera(mouse, camera);
    
    // Create a plane at ground level (y = 0) to intersect with
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    
    // Get intersection point with ground plane
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
        mouseWorldPos.copy(intersection);
        
        // Calculate direction from player to mouse position
        const direction = new THREE.Vector3();
        direction.subVectors(mouseWorldPos, player.position);
        direction.normalize();
        
        // Update arrow rotation to point towards mouse
        if (player.userData.arrow) {
            const angle = Math.atan2(direction.x, direction.z);
            player.userData.arrow.rotation.z = -angle; // Rotate around Z axis to point in direction
        }
    }
}

function handleMovement() {
    if (isDodging) return; // Can't move while dodging
    
    const moveVector = new THREE.Vector3();
    const currentSpeed = immortals[currentImmortal].speed;
    
    // World-space movement for static isometric camera
    // Movement directions are aligned with the isometric view
    if (keys['KeyW'] || keys['ArrowUp']) {
        // Move "up" in isometric view (northwest in world space)
        moveVector.x -= currentSpeed * 0.707; // cos(45°)
        moveVector.z -= currentSpeed * 0.707; // sin(45°)
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        // Move "down" in isometric view (southeast in world space)
        moveVector.x += currentSpeed * 0.707;
        moveVector.z += currentSpeed * 0.707;
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        // Move "left" in isometric view (southwest in world space)
        moveVector.x -= currentSpeed * 0.707;
        moveVector.z += currentSpeed * 0.707;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        // Move "right" in isometric view (northeast in world space)
        moveVector.x += currentSpeed * 0.707;
        moveVector.z -= currentSpeed * 0.707;
    }
    
    // Calculate new position
    const newPosition = player.position.clone().add(moveVector);
    
    // Check wall collision - only in war dimension
    if (currentDimension === 'war' && window.worldBounds) {
        const playerRadius = 0.5; // Half the player cube size for collision buffer
        
        // Clamp position to world boundaries
        newPosition.x = Math.max(
            window.worldBounds.minX + playerRadius,
            Math.min(window.worldBounds.maxX - playerRadius, newPosition.x)
        );
        newPosition.z = Math.max(
            window.worldBounds.minZ + playerRadius,
            Math.min(window.worldBounds.maxZ - playerRadius, newPosition.z)
        );
    }
    
    // Apply movement with collision detection
    player.position.copy(newPosition);
    
    // Keep player cube at proper height
    player.position.y = 0.5;
}

// Hitbox calculation functions
function calculateHitbox(immortal, playerPos, targetPos) {
    const direction = new THREE.Vector3().subVectors(targetPos, playerPos).normalize();
    
    // Always create hitbox regardless of mouse distance
    // The hitbox itself will be limited by the immortal's range
    
    switch (immortal.hitboxType) {
        case 'arc':
            return calculateArcHitbox(playerPos, direction, immortal.hitboxRange, immortal.hitboxWidth, immortal.arcOffset);
        case 'curve':
            return calculateCurveHitbox(playerPos, direction, immortal.hitboxRange, immortal.hitboxWidth, immortal.curveIntensity, immortal.damageRadius);
        case 'chain':
            return calculateChainHitbox(playerPos, direction, immortal.hitboxRange, immortal.maxChains);
        case 'wave':
            return calculateWaveHitbox(playerPos, direction, immortal.hitboxRange, immortal.hitboxWidth, immortal.waveSpeed);
        case 'crescent':
            return calculateCrescentHitbox(playerPos, direction, immortal.hitboxRange, immortal.hitboxWidth, immortal.crescentCurve);
        default:
            return null;
    }
}

function calculateArcHitbox(playerPos, direction, range, angleWidth, offset) {
    return {
        type: 'arc',
        origin: playerPos.clone(),
        direction: direction.clone(),
        range: range,
        angle: angleWidth * Math.PI / 180,
        offset: offset,
        checkHit: function(enemyPos) {
            const toEnemy = new THREE.Vector3().subVectors(enemyPos, this.origin);
            const distance = toEnemy.length();
            
            // Check if enemy is within arc range (accounting for offset)
            if (distance < this.offset || distance > this.range) return false;
            
            toEnemy.normalize();
            const dot = this.direction.dot(toEnemy);
            const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            return angle <= this.angle / 2;
        }
    };
}

function calculateCurveHitbox(playerPos, direction, range, angleWidth, curveIntensity, damageRadius) {
    return {
        type: 'curve',
        origin: playerPos.clone(),
        direction: direction.clone(),
        range: range,
        angle: angleWidth * Math.PI / 180,
        curveIntensity: curveIntensity,
        damageRadius: damageRadius,
        checkHit: function(enemyPos) {
            const toEnemy = new THREE.Vector3().subVectors(enemyPos, this.origin);
            const distance = toEnemy.length();
            
            // Check if enemy is within range
            if (distance > this.range) return false;
            
            toEnemy.normalize();
            const dot = this.direction.dot(toEnemy);
            const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            // Check if within curve angle
            if (angle > this.angle / 2) return false;
            
            // Calculate curve effect - stronger at the edges, creating a curved damage pattern
            const normalizedAngle = angle / (this.angle / 2);
            const curveEffect = Math.sin(normalizedAngle * Math.PI) * this.curveIntensity;
            
            // Distance-based damage falloff within the curve
            const distanceRatio = distance / this.range;
            const damageMultiplier = (1 - distanceRatio) * (0.5 + curveEffect);
            
            // Area effect - enemies closer to the curve center take more damage
            return damageMultiplier > 0.2; // Minimum threshold for hit
        },
        
        getDamageMultiplier: function(enemyPos) {
            const toEnemy = new THREE.Vector3().subVectors(enemyPos, this.origin);
            const distance = toEnemy.length();
            
            if (distance > this.range) return 0;
            
            toEnemy.normalize();
            const dot = this.direction.dot(toEnemy);
            const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            if (angle > this.angle / 2) return 0;
            
            const normalizedAngle = angle / (this.angle / 2);
            const curveEffect = Math.sin(normalizedAngle * Math.PI) * this.curveIntensity;
            const distanceRatio = distance / this.range;
            
            return Math.max(0.3, (1 - distanceRatio) * (0.5 + curveEffect));
        }
    };
}

function calculateChainHitbox(playerPos, direction, range, maxChains) {
    return {
        type: 'chain',
        origin: playerPos.clone(),
        direction: direction.clone(),
        range: range,
        maxChains: maxChains,
        hitEnemies: [],
        checkHit: function(enemyPos) {
            // First check if enemy is in direct line
            const toEnemy = new THREE.Vector3().subVectors(enemyPos, this.origin);
            const distance = toEnemy.length();
            
            if (distance > this.range) return false;
            
            // Calculate if enemy is close to the lightning line
            toEnemy.normalize();
            const projection = toEnemy.dot(this.direction);
            const perpendicular = new THREE.Vector3().subVectors(toEnemy, 
                new THREE.Vector3().copy(this.direction).multiplyScalar(projection));
            
            return perpendicular.length() <= 1.5; // Lightning chain tolerance
        }
    };
}

function calculateWaveHitbox(playerPos, direction, range, angleWidth, waveSpeed) {
    return {
        type: 'wave',
        origin: playerPos.clone(),
        direction: direction.clone(),
        range: range,
        angle: angleWidth * Math.PI / 180,
        waveSpeed: waveSpeed,
        currentDistance: 0,
        checkHit: function(enemyPos) {
            const toEnemy = new THREE.Vector3().subVectors(enemyPos, this.origin);
            const distance = toEnemy.length();
            
            // Wave expands over time - for now, check full area
            if (distance > this.range) return false;
            
            toEnemy.normalize();
            const dot = this.direction.dot(toEnemy);
            const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            return angle <= this.angle / 2;
        }
    };
}

function calculateCrescentHitbox(playerPos, direction, range, angleWidth, curve) {
    return {
        type: 'crescent',
        origin: playerPos.clone(),
        direction: direction.clone(),
        range: range,
        angle: angleWidth * Math.PI / 180,
        curve: curve,
        checkHit: function(enemyPos) {
            const toEnemy = new THREE.Vector3().subVectors(enemyPos, this.origin);
            const distance = toEnemy.length();
            
            if (distance > this.range) return false;
            
            toEnemy.normalize();
            const dot = this.direction.dot(toEnemy);
            const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            // Crescent shape - stronger at the edges, weaker in center
            const normalizedAngle = angle / (this.angle / 2);
            const crescentStrength = Math.sin(normalizedAngle * Math.PI) * this.curve;
            
            return angle <= this.angle / 2 && crescentStrength > 0.3;
        }
    };
}

function attack() {
    if (attackCooldown > 0) return;
    
    const immortal = immortals[currentImmortal];
    
    console.log(`${immortal.name} Immortal attacks with ${immortal.hitboxType} hitbox!`);
    attackCooldown = immortal.attackCooldown;
    
    // Calculate hitbox based on immortal type and mouse direction
    // Attack always happens, but hitbox is based on player position and immortal's range
    const hitbox = calculateHitbox(immortal, player.position, mouseWorldPos);
    
    if (!hitbox) {
        console.log("Failed to calculate hitbox");
        return;
    }
    
    // Create visual attack effect
    createAttackEffect(immortal, hitbox);
    
    // Check all enemies against the hitbox
    let hitCount = 0;
    enemies.forEach((enemy, index) => {
        if (hitbox.checkHit(enemy.position)) {
            hitCount++;
            console.log(`Hit enemy ${hitCount} with ${immortal.hitboxType} attack`);
            
            // Calculate damage (can vary based on distance for some attacks)
            let damage = immortal.attackDamage;
            
            // Apply damage multipliers for different attack types
            if (immortal.hitboxType === 'curve' && hitbox.getDamageMultiplier) {
                // Curve attacks have variable damage based on position within curve
                const multiplier = hitbox.getDamageMultiplier(enemy.position);
                damage = Math.floor(damage * multiplier);
                console.log(`Curve attack damage multiplier: ${multiplier.toFixed(2)}`);
            } else if (immortal.hitboxType === 'circle' || immortal.hitboxType === 'cone') {
                // Other area attacks use distance-based reduction
                const distanceFromCenter = hitbox.origin.distanceTo(enemy.position);
                const damageMultiplier = Math.max(0.5, 1 - (distanceFromCenter / immortal.hitboxRange) * 0.5);
                damage = Math.floor(damage * damageMultiplier);
            }
            
            // Damage enemy
            enemy.health -= damage;
            
            // Apply immortal-specific effects
            applyAttackEffects(enemy);
            
            // Visual feedback - flash red
            const originalColor = enemy.material.color.clone();
            enemy.material.color.setHex(0xff0000);
            setTimeout(() => {
                if (enemy.material) {
                    enemy.material.color.copy(originalColor);
                }
            }, 100);
            
            // Remove enemy if dead
            if (enemy.health <= 0) {
                scene.remove(enemy);
                enemies.splice(index, 1);
                console.log("Enemy defeated!");
                
                // Spawn new enemy to maintain challenge
                if (enemies.length < 3) {
                    spawnNewEnemy();
                }
            }
        }
    });
    
    console.log(`Attack hit ${hitCount} enemies`);
}

function switchImmortal(type) {
    if (currentImmortal === type) return;
    
    currentImmortal = type;
    const immortal = immortals[type];
    
    // Update player cube color directly
    if (player && player.material) {
        player.material.color.setHex(immortal.color);
        
        // Update targeting circle color based on immortal
        if (targetingCircle) {
            const circleColors = {
                flame: 0xff4444,
                storm: 0x4444ff,
                earth: 0x8b4513,
                shadow: 0x444444
            };
            targetingCircle.material.color.setHex(circleColors[type]);
        }
        
        // Update arrow color to match immortal
        if (player.userData.arrow) {
            const arrowColors = {
                flame: 0xff6600,
                storm: 0x00aaff,
                earth: 0xaa8844,
                shadow: 0x666666
            };
            player.userData.arrow.material.color.setHex(arrowColors[type]);
        }
        
        // Update range indicator size based on immortal's attack range
        if (player.userData.rangeIndicator) {
            const newRange = immortal.attackRange;
            player.userData.rangeIndicator.geometry.dispose(); // Clean up old geometry
            
            const newRangeGeometry = new THREE.RingGeometry(newRange - 0.1, newRange, 32);
            player.userData.rangeIndicator.geometry = newRangeGeometry;
            
            // Update range indicator color
            const rangeColors = {
                flame: 0xff6600,
                storm: 0x0066ff,
                earth: 0x996633,
                shadow: 0x666666
            };
            player.userData.rangeIndicator.material.color.setHex(rangeColors[type]);
        }
    }
    
    // Update UI
    document.getElementById('currentImmortal').textContent = immortal.name;
    
    console.log(`Switched to ${immortal.name} Immortal`);
}

function useSpecialAbility() {
    if (abilityCooldown > 0) return;
    
    const immortal = immortals[currentImmortal];
    abilityCooldown = immortal.abilityCooldown;
    
    document.getElementById('abilityStatus').textContent = 'Cooling Down';
    
    switch(currentImmortal) {
        case 'flame':
            flameAbility();
            break;
        case 'storm':
            stormAbility();
            break;
        case 'earth':
            earthAbility();
            break;
        case 'shadow':
            shadowAbility();
            break;
    }
}

function flameAbility() {
    console.log("Flame Burst!");
    
    // Flame ability creates area damage around the player, not at mouse position
    const skillRange = immortals[currentImmortal].attackRange * 1.5; // Skills have longer range
    
    // Check enemies within skill range from player
    enemies.forEach((enemy, index) => {
        const distance = enemy.position.distanceTo(player.position);
        if (distance <= skillRange) { // Hit enemies within skill range from player
            enemy.health -= 50;
            if (enemy.health <= 0) {
                scene.remove(enemy);
                enemies.splice(index, 1);
            }
        }
    });
    
    // Create large fire effect around the player
    const effectGeometry = new THREE.RingGeometry(skillRange * 0.5, skillRange, 16);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff3300, 
        transparent: true, 
        opacity: 0.8 
    });
    const effect = new THREE.Mesh(effectGeometry, effectMaterial);
    effect.position.copy(player.position);
    effect.position.y = 0.1;
    effect.rotation.x = -Math.PI / 2;
    scene.add(effect);
    
    animateEffect(effect, 2);
}

function stormAbility() {
    // Check if mouse position is within skill range from player
    const skillRange = immortals[currentImmortal].attackRange * 1.2; // Storm has good range
    const distanceToMouse = player.position.distanceTo(mouseWorldPos);
    
    if (distanceToMouse > skillRange) {
        console.log(`Lightning Strike too far! Max range: ${skillRange}`);
        return; // Don't use skill if mouse is out of range
    }
    
    console.log("Lightning Strike at mouse position!");
    // Target enemy closest to mouse cursor
    let targetEnemy = null;
    let minDistance = Infinity;
    
    enemies.forEach(enemy => {
        const distance = enemy.position.distanceTo(mouseWorldPos);
        if (distance < minDistance) {
            minDistance = distance;
            targetEnemy = enemy;
        }
    });
    
    if (targetEnemy && minDistance <= 3) { // Tighter targeting range
        targetEnemy.health -= 80;
        
        // Create lightning effect at target
        const lightningGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10);
        const lightningMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
        lightning.position.copy(targetEnemy.position);
        lightning.position.y = 5;
        scene.add(lightning);
        // Create lightning at mouse position even if no enemy
        
        setTimeout(() => scene.remove(lightning), 200);
        
        if (targetEnemy.health <= 0) {
            const index = enemies.indexOf(targetEnemy);
            scene.remove(targetEnemy);
            enemies.splice(index, 1);
        }
    } else {
        // Create lightning at mouse position even if no enemy
        const lightningGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10);
        const lightningMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
        lightning.position.copy(mouseWorldPos);
        lightning.position.y = 5;
        scene.add(lightning);
        setTimeout(() => scene.remove(lightning), 200);
    }
}

function earthAbility() {
    console.log("Stone Shield!");
    // Temporary invincibility and knockback
    isDodging = true;
    
    // Create shield effect
    const shieldGeometry = new THREE.SphereGeometry(2, 8, 6);
    const shieldMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x8b4513, 
        transparent: true, 
        opacity: 0.3,
        wireframe: true
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.copy(player.position);
    scene.add(shield);
    
    // Knockback enemies
    enemies.forEach(enemy => {
        const distance = player.position.distanceTo(enemy.position);
        if (distance <= 4) {
            const direction = new THREE.Vector3();
            direction.subVectors(enemy.position, player.position);
            direction.normalize();
            direction.multiplyScalar(3);
            enemy.position.add(direction);
        }
    });
    
    setTimeout(() => {
        isDodging = false;
        scene.remove(shield);
    }, 3000);
}

function shadowAbility() {
    console.log("Shadow Strike!");
    // Teleport to nearest enemy and deal massive damage
    let nearestEnemy = null;
    let minDistance = Infinity;
    
    enemies.forEach(enemy => {
        const distance = player.position.distanceTo(enemy.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    if (nearestEnemy) {
        // Teleport player
        player.position.copy(nearestEnemy.position);
        player.position.x += 1.5;
        
        // Deal damage
        nearestEnemy.health -= 100;
        
        if (nearestEnemy.health <= 0) {
            const index = enemies.indexOf(nearestEnemy);
            scene.remove(nearestEnemy);
            enemies.splice(index, 1);
        }
        
        // Create shadow effect
        const shadowGeometry = new THREE.RingGeometry(0.5, 2, 8);
        const shadowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.8 
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.position.copy(player.position);
        shadow.position.y = 0.1;
        shadow.rotation.x = -Math.PI / 2;
        scene.add(shadow);
        
        animateEffect(shadow, 1);
    }
}

function dodgeRoll() {
    if (dodgeCooldown > 0 || isDodging) return;
    
    dodgeCooldown = 1000;
    isDodging = true;
    
    // Get movement direction for static isometric camera
    const moveVector = new THREE.Vector3();
    
    // Calculate dodge direction based on input (isometric-aligned)
    if (keys['KeyW']) {
        moveVector.x -= 0.707;
        moveVector.z -= 0.707;
    }
    if (keys['KeyS']) {
        moveVector.x += 0.707;
        moveVector.z += 0.707;
    }
    if (keys['KeyA']) {
        moveVector.x -= 0.707;
        moveVector.z += 0.707;
    }
    if (keys['KeyD']) {
        moveVector.x += 0.707;
        moveVector.z -= 0.707;
    }
    
    // Default to "up" direction if no input
    if (moveVector.length() === 0) {
        moveVector.x = -0.707;
        moveVector.z = -0.707;
    }
    
    moveVector.normalize();
    const dashDirection = moveVector.clone();
    moveVector.multiplyScalar(DODGE_DISTANCE);
    
    // Calculate end position with wall collision check
    const startPos = player.position.clone();
    let endPos = startPos.clone().add(moveVector);
    
    // Check wall collision for dodge destination - only in war dimension
    if (currentDimension === 'war' && window.worldBounds) {
        const playerRadius = 0.5;
        
        // Clamp dodge destination to world boundaries
        endPos.x = Math.max(
            window.worldBounds.minX + playerRadius,
            Math.min(window.worldBounds.maxX - playerRadius, endPos.x)
        );
        endPos.z = Math.max(
            window.worldBounds.minZ + playerRadius,
            Math.min(window.worldBounds.maxZ - playerRadius, endPos.z)
        );
    }
    
    // Create dash effects
    createDashEffect(startPos, endPos, dashDirection);
    
    // Add camera shake for impact
    if (cameraSystem) {
        cameraSystem.shake(0.4, 200);
    }
    
    // Animate dodge with enhanced effects
    let progress = 0;
    const dashSpeed = 0.15; // Faster dash animation
    
    const animateDodge = () => {
        progress += dashSpeed;
        
        // Smooth easing for dash movement
        const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        player.position.lerpVectors(startPos, endPos, easeProgress);
        
        // Add slight rotation during dash
        player.rotation.y = Math.sin(progress * Math.PI * 2) * 0.2;
        
        if (progress >= 1) {
            isDodging = false;
            player.rotation.y = 0; // Reset rotation
            
            // Create landing effect
            createDashLandingEffect(endPos);
        } else {
            requestAnimationFrame(animateDodge);
        }
    };
    
    animateDodge();
}

function createDashEffect(startPos, endPos, direction) {
    // Create dash trail effect
    const trailLength = startPos.distanceTo(endPos);
    const trailGeometry = new THREE.CylinderGeometry(0.1, 0.3, trailLength);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: immortals[currentImmortal].color,
        transparent: true, 
        opacity: 0.6
    });
    
    const dashTrail = new THREE.Mesh(trailGeometry, trailMaterial);
    
    // Position trail between start and end points
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    dashTrail.position.copy(midPoint);
    dashTrail.position.y = 0.3;
    
    // Orient trail along dash direction
    const angle = Math.atan2(direction.z, direction.x);
    dashTrail.rotation.z = angle + Math.PI / 2;
    dashTrail.rotation.x = Math.PI / 2;
    
    scene.add(dashTrail);
    
    // Create speed lines effect
    const speedLines = [];
    for (let i = 0; i < 8; i++) {
        const lineGeometry = new THREE.PlaneGeometry(0.1, 1.5);
        const lineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const speedLine = new THREE.Mesh(lineGeometry, lineMaterial);
        
        // Position speed lines around the dash path
        const offset = (i / 8) * Math.PI * 2;
        const radius = 0.8;
        speedLine.position.copy(startPos);
        speedLine.position.x += Math.cos(offset) * radius;
        speedLine.position.z += Math.sin(offset) * radius;
        speedLine.position.y = 0.2 + Math.random() * 0.4;
        
        // Orient lines in dash direction
        speedLine.rotation.y = angle;
        speedLine.rotation.z = (Math.random() - 0.5) * 0.3;
        
        scene.add(speedLine);
        speedLines.push(speedLine);
    }
    
    // Create energy burst at start position
    const burstGeometry = new THREE.RingGeometry(0.3, 1.2, 12);
    const burstMaterial = new THREE.MeshBasicMaterial({ 
        color: immortals[currentImmortal].color,
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const energyBurst = new THREE.Mesh(burstGeometry, burstMaterial);
    energyBurst.position.copy(startPos);
    energyBurst.position.y = 0.1;
    energyBurst.rotation.x = -Math.PI / 2;
    
    scene.add(energyBurst);
    
    // Animate dash effects
    let effectTime = 0;
    const animateDashEffects = () => {
        effectTime += 16;
        const progress = effectTime / 400; // 400ms effect duration
        
        // Animate trail
        dashTrail.material.opacity = Math.max(0, 0.6 - progress * 0.6);
        dashTrail.scale.y = Math.max(0.1, 1 - progress * 0.8);
        
        // Animate speed lines
        speedLines.forEach((line, index) => {
            line.position.add(new THREE.Vector3().copy(direction).multiplyScalar(0.3));
            line.material.opacity = Math.max(0, 0.8 - progress * 0.8);
            line.scale.y = Math.max(0.1, 1 - progress * 0.7);
        });
        
        // Animate energy burst
        energyBurst.scale.set(1 + progress * 2, 1 + progress * 2, 1);
        energyBurst.material.opacity = Math.max(0, 0.8 - progress * 0.8);
        energyBurst.rotation.z += 0.1;
        
        if (progress < 1) {
            requestAnimationFrame(animateDashEffects);
        } else {
            // Clean up effects
            scene.remove(dashTrail);
            speedLines.forEach(line => scene.remove(line));
            scene.remove(energyBurst);
        }
    };
    
    animateDashEffects();
}

function createDashLandingEffect(position) {
    // Create impact ring
    const impactGeometry = new THREE.RingGeometry(0.2, 1.5, 16);
    const impactMaterial = new THREE.MeshBasicMaterial({ 
        color: immortals[currentImmortal].color,
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const impactRing = new THREE.Mesh(impactGeometry, impactMaterial);
    impactRing.position.copy(position);
    impactRing.position.y = 0.05;
    impactRing.rotation.x = -Math.PI / 2;
    
    scene.add(impactRing);
    
    // Create dust particles
    const dustParticles = [];
    for (let i = 0; i < 6; i++) {
        const dustGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const dustMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8B7355,
            transparent: true, 
            opacity: 0.6
        });
        
        const dust = new THREE.Mesh(dustGeometry, dustMaterial);
        dust.position.copy(position);
        dust.position.x += (Math.random() - 0.5) * 2;
        dust.position.z += (Math.random() - 0.5) * 2;
        dust.position.y = 0.1;
        
        // Random velocity for dust
        dust.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.05 + 0.02,
            (Math.random() - 0.5) * 0.1
        );
        
        scene.add(dust);
        dustParticles.push(dust);
    }
    
    // Animate landing effects
    let landingTime = 0;
    const animateLanding = () => {
        landingTime += 16;
        const progress = landingTime / 300; // 300ms landing effect
        
        // Animate impact ring
        impactRing.scale.set(1 + progress * 1.5, 1 + progress * 1.5, 1);
        impactRing.material.opacity = Math.max(0, 0.7 - progress * 0.7);
        
        // Animate dust particles
        dustParticles.forEach(dust => {
            dust.position.add(dust.userData.velocity);
            dust.userData.velocity.y -= 0.002; // Gravity
            dust.material.opacity = Math.max(0, 0.6 - progress * 0.6);
            dust.scale.multiplyScalar(1.02);
        });
        
        if (progress < 1) {
            requestAnimationFrame(animateLanding);
        } else {
            // Clean up effects
            scene.remove(impactRing);
            dustParticles.forEach(dust => scene.remove(dust));
        }
    };
    
    animateLanding();
}

function spawnNewEnemy() {
    // Determine enemy type
    const isFast = Math.random() > 0.7;
    const enemyColor = isFast ? 0x888888 : 0x666666;
    
    // Create simple 3D cube enemy - no textures
    const enemyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: enemyColor });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    
    // Spawn at edge of map
    const angle = Math.random() * Math.PI * 2;
    const distance = 20;
    enemy.position.set(
        Math.cos(angle) * distance,
        0.4,
        Math.sin(angle) * distance
    );
    
    enemy.castShadow = true;
    
    // Enemy stats and hitbox properties
    enemy.health = 60;
    enemy.maxHealth = 60;
    enemy.type = isFast ? 'fast' : 'normal';
    enemy.speed = enemy.type === 'fast' ? 0.04 : 0.025;
    
    // Enemy hitbox properties
    if (isFast) {
        // Fast enemies - quick, precise attacks
        enemy.attackRange = 1.5;
        enemy.attackDamage = 15;
        enemy.attackCooldown = 800;
        enemy.hitboxType = 'precise';
        enemy.damageRadius = 0.8;
    } else {
        // Normal enemies - slower, area attacks
        enemy.attackRange = 2.0;
        enemy.attackDamage = 20;
        enemy.attackCooldown = 1200;
        enemy.hitboxType = 'circle';
        enemy.damageRadius = 1.5;
    }
    
    enemy.lastAttackTime = 0;
    
    scene.add(enemy);
    enemies.push(enemy);
}

function applyAttackEffects(enemy) {
    // Apply immortal-specific effects
    switch(currentImmortal) {
        case 'flame':
            // Burn damage over time (simplified)
            break;
        case 'storm':
            // Chain lightning to nearby enemies
            enemies.forEach(otherEnemy => {
                if (otherEnemy !== enemy) {
                    const distance = enemy.position.distanceTo(otherEnemy.position);
                    if (distance <= 3) {
                        otherEnemy.health -= 10;
                    }
                }
            });
            break;
        case 'earth':
            // Knockback
            const direction = new THREE.Vector3();
            direction.subVectors(enemy.position, player.position);
            direction.normalize();
            direction.multiplyScalar(1.5);
            enemy.position.add(direction);
            break;
        case 'shadow':
            // Poison effect (simplified)
            break;
    }
}

function createAttackEffect(immortal, hitbox) {
    let effects = [];
    
    switch(hitbox.type) {
        case 'arc':
            effects = createArcEffect(immortal, hitbox);
            break;
        case 'curve':
            effects = createCurveEffect(immortal, hitbox);
            break;
        case 'chain':
            effects = createChainEffect(immortal, hitbox);
            break;
        case 'wave':
            effects = createWaveEffect(immortal, hitbox);
            break;
        case 'crescent':
            effects = createCrescentEffect(immortal, hitbox);
            break;
    }
    
    // Add all effects to scene and animate them
    effects.forEach(effect => {
        scene.add(effect);
        animateEffect(effect, 1);
    });
}

function createArcEffect(immortal, hitbox) {
    const effects = [];
    
    // Create arc-shaped sweep effect for flame immortal
    const arcGeometry = new THREE.RingGeometry(
        hitbox.offset, // Inner radius (starts away from player)
        hitbox.range,  // Outer radius
        16,            // Segments
        Math.floor(16 * (hitbox.angle / (Math.PI * 2))) // Arc segments based on angle
    );
    
    const arcMaterial = new THREE.MeshBasicMaterial({ 
        color: immortal.color, 
        transparent: true, 
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    
    const arc = new THREE.Mesh(arcGeometry, arcMaterial);
    arc.position.copy(hitbox.origin);
    arc.position.y = 0.1;
    arc.rotation.x = -Math.PI / 2;
    
    // Orient arc towards attack direction
    const direction = hitbox.direction.clone();
    const angle = Math.atan2(direction.z, direction.x);
    arc.rotation.z = angle - hitbox.angle / 2; // Center the arc on the direction
    
    effects.push(arc);
    
    // Add sweep trail effect
    const trailGeometry = new THREE.RingGeometry(hitbox.range * 0.8, hitbox.range, 8, 4);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.6
    });
    
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.copy(arc.position);
    trail.rotation.copy(arc.rotation);
    
    effects.push(trail);
    return effects;
}

function createCurveEffect(immortal, hitbox) {
    const effects = [];
    
    // Create curved flame effect with multiple segments
    const segments = 8;
    const direction = hitbox.direction.clone();
    const baseAngle = Math.atan2(direction.z, direction.x);
    
    // Create main curved flame area
    const curveGeometry = new THREE.RingGeometry(
        0.2, // Inner radius
        hitbox.range, // Outer radius
        16, // Radial segments
        Math.floor(16 * (hitbox.angle / (Math.PI * 2))) // Arc segments
    );
    
    const curveMaterial = new THREE.MeshBasicMaterial({ 
        color: immortal.color, 
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    const curveMain = new THREE.Mesh(curveGeometry, curveMaterial);
    curveMain.position.copy(hitbox.origin);
    curveMain.position.y = 0.1;
    curveMain.rotation.x = -Math.PI / 2;
    curveMain.rotation.z = baseAngle - hitbox.angle / 2;
    
    effects.push(curveMain);
    
    // Create flame particles along the curve
    for (let i = 0; i < segments; i++) {
        const segmentAngle = (i / segments) * hitbox.angle - hitbox.angle / 2;
        const actualAngle = baseAngle + segmentAngle;
        
        // Calculate curve position with intensity effect
        const curveOffset = Math.sin((i / segments) * Math.PI) * hitbox.curveIntensity * 2;
        const distance = hitbox.range * (0.3 + (i / segments) * 0.7);
        
        const flameGeometry = new THREE.SphereGeometry(0.3 + curveOffset * 0.2, 6, 6);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3),
            transparent: true, 
            opacity: 0.8 - i * 0.08
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.copy(hitbox.origin);
        flame.position.x += Math.cos(actualAngle) * distance + curveOffset;
        flame.position.z += Math.sin(actualAngle) * distance + curveOffset * 0.5;
        flame.position.y = 0.2 + Math.random() * 0.3;
        
        effects.push(flame);
    }
    
    // Add burning ground effect
    const burnGeometry = new THREE.CircleGeometry(hitbox.damageRadius, 16);
    const burnMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    const burnEffect = new THREE.Mesh(burnGeometry, burnMaterial);
    burnEffect.position.copy(hitbox.origin);
    burnEffect.position.add(new THREE.Vector3().copy(direction).multiplyScalar(hitbox.range * 0.6));
    burnEffect.position.y = 0.05;
    burnEffect.rotation.x = -Math.PI / 2;
    
    effects.push(burnEffect);
    
    return effects;
}

function createChainEffect(immortal, hitbox) {
    const effects = [];
    
    // Create main lightning bolt
    const lineGeometry = new THREE.CylinderGeometry(0.1, 0.1, hitbox.range);
    const lineMaterial = new THREE.MeshBasicMaterial({ 
        color: immortal.color, 
        transparent: true, 
        opacity: 0.8
    });
    
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.copy(hitbox.origin);
    line.position.add(new THREE.Vector3().copy(hitbox.direction).multiplyScalar(hitbox.range / 2));
    line.position.y = 0.5;
    
    // Orient line towards attack direction
    const direction = hitbox.direction.clone();
    line.lookAt(new THREE.Vector3().addVectors(line.position, direction));
    line.rotateX(Math.PI / 2);
    
    effects.push(line);
    
    // Add electric sparks
    for (let i = 0; i < 3; i++) {
        const sparkGeometry = new THREE.SphereGeometry(0.2, 6, 6);
        const sparkMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.9
        });
        
        const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
        spark.position.copy(hitbox.origin);
        spark.position.add(new THREE.Vector3().copy(hitbox.direction).multiplyScalar(Math.random() * hitbox.range));
        spark.position.y = 0.3;
        
        effects.push(spark);
    }
    
    return effects;
}

function createWaveEffect(immortal, hitbox) {
    const effects = [];
    
    // Create expanding wave effect for earth immortal
    const waveGeometry = new THREE.RingGeometry(0.2, hitbox.range, 16, 1, 0, hitbox.angle);
    const waveMaterial = new THREE.MeshBasicMaterial({ 
        color: immortal.color, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.position.copy(hitbox.origin);
    wave.position.y = 0.1;
    wave.rotation.x = -Math.PI / 2;
    
    // Orient wave towards attack direction
    const direction = hitbox.direction.clone();
    const angle = Math.atan2(direction.z, direction.x);
    wave.rotation.z = angle - hitbox.angle / 2;
    
    effects.push(wave);
    
    // Add ground crack effects
    for (let i = 0; i < 5; i++) {
        const crackGeometry = new THREE.PlaneGeometry(0.2, hitbox.range * 0.8);
        const crackMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8b4513, 
            transparent: true, 
            opacity: 0.7
        });
        
        const crack = new THREE.Mesh(crackGeometry, crackMaterial);
        crack.position.copy(hitbox.origin);
        crack.position.add(new THREE.Vector3().copy(hitbox.direction).multiplyScalar(hitbox.range * 0.5));
        crack.position.y = 0.05;
        crack.rotation.x = -Math.PI / 2;
        crack.rotation.z = angle + (Math.random() - 0.5) * hitbox.angle;
        
        effects.push(crack);
    }
    
    return effects;
}

function createCrescentEffect(immortal, hitbox) {
    const effects = [];
    
    // Create crescent-shaped slash effect for shadow immortal
    const crescentGeometry = new THREE.RingGeometry(
        hitbox.range * 0.3, // Inner radius
        hitbox.range,       // Outer radius
        16,                 // Segments
        Math.floor(16 * (hitbox.angle / (Math.PI * 2))) // Arc segments
    );
    
    const crescentMaterial = new THREE.MeshBasicMaterial({ 
        color: immortal.color, 
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    const crescent = new THREE.Mesh(crescentGeometry, crescentMaterial);
    crescent.position.copy(hitbox.origin);
    crescent.position.y = 0.1;
    crescent.rotation.x = -Math.PI / 2;
    
    // Orient crescent towards attack direction
    const direction = hitbox.direction.clone();
    const angle = Math.atan2(direction.z, direction.x);
    crescent.rotation.z = angle - hitbox.angle / 2;
    
    effects.push(crescent);
    
    // Add shadow trail effect
    const trailGeometry = new THREE.PlaneGeometry(hitbox.range * 0.5, 0.3);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.8
    });
    
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.copy(hitbox.origin);
    trail.position.add(new THREE.Vector3().copy(hitbox.direction).multiplyScalar(hitbox.range * 0.7));
    trail.position.y = 0.05;
    trail.rotation.x = -Math.PI / 2;
    trail.rotation.z = angle;
    
    effects.push(trail);
    return effects;
}

function animateEffect(effect, scaleMultiplier = 1) {
    let scale = 1;
    const animate = () => {
        scale += 0.1 * scaleMultiplier;
        effect.scale.set(scale, scale, scale);
        effect.material.opacity -= 0.05;
        
        if (effect.material.opacity <= 0) {
            scene.remove(effect);
        } else {
            requestAnimationFrame(animate);
        }
    };
    animate();
}

function updateEnemies() {
    enemies.forEach(enemy => {
        // Skip enemies that are still deploying
        if (enemy.isDeploying) {
            return;
        }
        
        // Simple AI - move towards player
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position);
        const distanceToPlayer = direction.length();
        direction.normalize();
        
        // Enemy behavior based on distance
        if (distanceToPlayer > enemy.attackRange) {
            // Move towards player if out of attack range
            direction.multiplyScalar(enemy.speed);
            enemy.position.add(direction);
        } else {
            // In attack range - try to attack
            const currentTime = Date.now();
            if (currentTime - enemy.lastAttackTime >= enemy.attackCooldown) {
                enemyAttack(enemy);
                enemy.lastAttackTime = currentTime;
            }
        }
        
        enemy.position.y = 0.4; // Keep cubes at proper height
    });
}

function enemyAttack(enemy) {
    if (isDodging) {
        console.log("Player dodged enemy attack!");
        return; // Player is dodging, attack misses
    }
    
    const distanceToPlayer = enemy.position.distanceTo(player.position);
    
    // Check if player is within attack range
    if (distanceToPlayer > enemy.attackRange) {
        return; // Player moved out of range
    }
    
    let hitPlayer = false;
    let damageMultiplier = 1.0;
    
    // Different attack patterns based on enemy type
    switch (enemy.hitboxType) {
        case 'precise':
            // Fast enemies - precise single-target attack
            if (distanceToPlayer <= enemy.damageRadius) {
                hitPlayer = true;
            }
            break;
            
        case 'circle':
            // Normal enemies - area attack around them
            if (distanceToPlayer <= enemy.damageRadius) {
                hitPlayer = true;
            }
            break;
            
        case 'curve':
            // Curve enemies - sweeping curve attack
            const curveHit = calculateEnemyCurveAttack(enemy, player.position);
            if (curveHit.hit) {
                hitPlayer = true;
                damageMultiplier = curveHit.damageMultiplier;
            }
            break;
    }
    
    // Create enemy attack visual effect
    createEnemyAttackEffect(enemy);
    
    if (hitPlayer) {
        // Check if player is invincible (after death respawn)
        if (player.userData.invincible) {
            console.log("Player is invincible - attack blocked!");
            return; // No damage while invincible
        }
        
        // Calculate final damage with multiplier
        const finalDamage = Math.floor(enemy.attackDamage * damageMultiplier);
        
        // Player takes damage
        health -= finalDamage;
        document.getElementById('health').textContent = Math.max(0, Math.floor(health));
        
        console.log(`Enemy ${enemy.type} hit player for ${finalDamage} damage! (${damageMultiplier.toFixed(2)}x multiplier)`);
        
        // Visual feedback - screen shake
        cameraSystem.shake(0.3, 200);
        
        // Player flash effect
        const originalColor = player.material.color.clone();
        player.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (player.material) {
                player.material.color.copy(originalColor);
            }
        }, 100);
        
        // Create enemy attack effect
        createEnemyAttackEffect(enemy);
        
        if (health <= 0) {
            console.log("Player died! Returning to home dimension...");
            
            // Reset health
            health = 100;
            document.getElementById('health').textContent = health;
            
            // Add brief invincibility after death
            player.userData.invincible = true;
            player.userData.invincibilityTime = 3000; // 3 seconds of invincibility
            
            // Return to home dimension (safe haven)
            switchToDimension('home');
            
            // Add death effect
            createDeathEffect();
            
            console.log("Player respawned safely in home dimension with temporary invincibility");
        }
    }
}

function calculateEnemyCurveAttack(enemy, playerPos) {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, enemy.position);
    const distance = toPlayer.length();
    
    // Check if player is within range
    if (distance > enemy.attackRange) {
        return { hit: false, damageMultiplier: 0 };
    }
    
    // Calculate the direction enemy is facing (towards player)
    const enemyDirection = toPlayer.clone().normalize();
    
    // Create curve attack parameters
    const curveAngle = (enemy.curveAngle || 90) * Math.PI / 180; // Convert to radians
    const curveIntensity = enemy.curveIntensity || 0.7;
    
    // Check if player is within the curve angle
    const angleToPlayer = Math.atan2(toPlayer.z, toPlayer.x);
    const enemyFacing = Math.atan2(enemyDirection.z, enemyDirection.x);
    
    let angleDiff = Math.abs(angleToPlayer - enemyFacing);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    
    // Check if within curve sweep
    if (angleDiff > curveAngle / 2) {
        return { hit: false, damageMultiplier: 0 };
    }
    
    // Calculate damage multiplier based on position in curve
    const normalizedAngle = angleDiff / (curveAngle / 2);
    const curveEffect = Math.sin(normalizedAngle * Math.PI) * curveIntensity;
    const distanceRatio = distance / enemy.attackRange;
    
    // Stronger damage at curve edges and closer distances
    const damageMultiplier = Math.max(0.4, (1 - distanceRatio) * (0.6 + curveEffect));
    
    return { hit: true, damageMultiplier: damageMultiplier };
}

function createEnemyAttackEffect(enemy) {
    let effectGeometry, effectMaterial;
    
    switch (enemy.hitboxType) {
        case 'precise':
            // Small precise attack effect
            effectGeometry = new THREE.RingGeometry(0.3, 0.8, 8);
            effectMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff3333, 
                transparent: true, 
                opacity: 0.6 
            });
            break;
            
        case 'circle':
            // Larger area attack effect
            effectGeometry = new THREE.RingGeometry(enemy.damageRadius * 0.5, enemy.damageRadius, 12);
            effectMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6666, 
                transparent: true, 
                opacity: 0.4 
            });
            break;
            
        case 'curve':
            // Curve attack effect
            createEnemyCurveAttackEffect(enemy);
            return; // Early return since curve has custom effect
    }
    
    const effect = new THREE.Mesh(effectGeometry, effectMaterial);
    effect.position.copy(enemy.position);
    effect.position.y = 0.1;
    effect.rotation.x = -Math.PI / 2;
    
    scene.add(effect);
    animateEffect(effect, 1.5);
}

function createEnemyCurveAttackEffect(enemy) {
    // Calculate direction to player for curve orientation
    const toPlayer = new THREE.Vector3().subVectors(player.position, enemy.position);
    const direction = toPlayer.normalize();
    const baseAngle = Math.atan2(direction.z, direction.x);
    
    // Create main curve sweep effect
    const curveAngle = (enemy.curveAngle || 90) * Math.PI / 180;
    const curveGeometry = new THREE.RingGeometry(
        0.3, // Inner radius
        enemy.attackRange, // Outer radius
        16, // Radial segments
        Math.floor(16 * (curveAngle / (Math.PI * 2))) // Arc segments
    );
    
    const curveMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xaa4444, // Reddish color for curve attacks
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    
    const curveEffect = new THREE.Mesh(curveGeometry, curveMaterial);
    curveEffect.position.copy(enemy.position);
    curveEffect.position.y = 0.1;
    curveEffect.rotation.x = -Math.PI / 2;
    curveEffect.rotation.z = baseAngle - curveAngle / 2; // Center on player direction
    
    scene.add(curveEffect);
    
    // Create curve energy particles
    const particles = [];
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const particleAngle = (i / particleCount) * curveAngle - curveAngle / 2;
        const actualAngle = baseAngle + particleAngle;
        
        // Calculate curve position with intensity effect
        const curveOffset = Math.sin((i / particleCount) * Math.PI) * (enemy.curveIntensity || 0.7);
        const distance = enemy.attackRange * (0.4 + (i / particleCount) * 0.6);
        
        const particleGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(0.02, 0.8, 0.5 + Math.random() * 0.3),
            transparent: true, 
            opacity: 0.7
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(enemy.position);
        particle.position.x += Math.cos(actualAngle) * distance;
        particle.position.z += Math.sin(actualAngle) * distance;
        particle.position.y = 0.2 + curveOffset * 0.3;
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Create warning lines before the attack
    const warningLines = [];
    for (let i = 0; i < 3; i++) {
        const lineAngle = baseAngle + (i - 1) * curveAngle / 4;
        const lineGeometry = new THREE.PlaneGeometry(0.1, enemy.attackRange);
        const lineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff8888,
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.copy(enemy.position);
        line.position.x += Math.cos(lineAngle) * enemy.attackRange / 2;
        line.position.z += Math.sin(lineAngle) * enemy.attackRange / 2;
        line.position.y = 0.05;
        line.rotation.x = -Math.PI / 2;
        line.rotation.z = lineAngle;
        
        scene.add(line);
        warningLines.push(line);
    }
    
    // Animate curve attack effect
    let effectTime = 0;
    const effectDuration = 600; // 600ms effect
    
    const animateCurveEffect = () => {
        effectTime += 16;
        const progress = effectTime / effectDuration;
        
        // Animate main curve
        curveEffect.material.opacity = Math.max(0, 0.5 - progress * 0.5);
        curveEffect.rotation.z += 0.02;
        
        // Animate particles
        particles.forEach((particle, index) => {
            particle.material.opacity = Math.max(0, 0.7 - progress * 0.7);
            particle.position.y += 0.01;
            particle.scale.multiplyScalar(1.02);
        });
        
        // Animate warning lines
        warningLines.forEach(line => {
            line.material.opacity = Math.max(0, 0.8 - progress * 0.8);
            line.scale.y = Math.max(0.1, 1 - progress * 0.8);
        });
        
        if (progress < 1) {
            requestAnimationFrame(animateCurveEffect);
        } else {
            // Clean up effects
            scene.remove(curveEffect);
            particles.forEach(particle => scene.remove(particle));
            warningLines.forEach(line => scene.remove(line));
        }
    };
    
    animateCurveEffect();
}

function createEnemyAttackEffect(enemy) {
    let effectGeometry, effectMaterial;
    
    switch (enemy.hitboxType) {
        case 'precise':
            // Small precise attack effect
            effectGeometry = new THREE.RingGeometry(0.3, 0.8, 8);
            effectMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff3333, 
                transparent: true, 
                opacity: 0.6 
            });
            break;
            
        case 'circle':
            // Larger area attack effect
            effectGeometry = new THREE.RingGeometry(enemy.damageRadius * 0.5, enemy.damageRadius, 12);
            effectMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6666, 
                transparent: true, 
                opacity: 0.4 
            });
            break;
    }
    
    const effect = new THREE.Mesh(effectGeometry, effectMaterial);
    effect.position.copy(enemy.position);
    effect.position.y = 0.1;
    effect.rotation.x = -Math.PI / 2;
    
    scene.add(effect);
    animateEffect(effect, 1.5);
}

function checkPortalCollision() {
    if (!player || !window.portals) return;
    
    // Check if player is near any portal
    window.portals.forEach(portal => {
        const distance = player.position.distanceTo(portal.position);
        
        if (distance <= portal.radius) {
            // Player is in portal - teleport to other dimension
            console.log(`Teleporting to ${portal.destination} dimension!`);
            switchToDimension(portal.destination);
            
            // Add teleport effect
            createTeleportEffect();
        }
    });
}

function updatePortalEffects() {
    if (!window.portals) return;
    
    // Animate portal effects
    window.portals.forEach(portal => {
        if (portal.ring && portal.center) {
            // Rotate portal rings
            portal.ring.rotation.z += 0.02;
            portal.center.rotation.z -= 0.015;
            
            // Pulse opacity
            const time = Date.now() * 0.003;
            portal.ring.material.opacity = 0.7 + Math.sin(time) * 0.2;
            portal.center.material.opacity = 0.3 + Math.sin(time * 1.5) * 0.1;
        }
    });
}

function createTeleportEffect() {
    if (!player) return;
    
    // Create teleport visual effect around player
    const effectGeometry = new THREE.RingGeometry(0.5, 3, 16);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const teleportEffect = new THREE.Mesh(effectGeometry, effectMaterial);
    teleportEffect.position.copy(player.position);
    teleportEffect.rotation.x = -Math.PI / 2;
    scene.add(teleportEffect);
    
    // Animate the effect
    let scale = 1;
    let opacity = 0.8;
    
    const animateTeleport = () => {
        scale += 0.2;
        opacity -= 0.1;
        
        teleportEffect.scale.set(scale, scale, scale);
        teleportEffect.material.opacity = opacity;
        
        if (opacity <= 0) {
            scene.remove(teleportEffect);
        } else {
            requestAnimationFrame(animateTeleport);
        }
    };
    
    animateTeleport();
}

function createDeathEffect() {
    if (!player) return;
    
    // Create death visual effect around player
    const effectGeometry = new THREE.RingGeometry(0.2, 4, 16);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, // Red color for death
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const deathEffect = new THREE.Mesh(effectGeometry, effectMaterial);
    deathEffect.position.copy(player.position);
    deathEffect.rotation.x = -Math.PI / 2;
    scene.add(deathEffect);
    
    // Create multiple expanding rings for dramatic effect
    const effects = [deathEffect];
    
    for (let i = 1; i < 3; i++) {
        const additionalEffect = deathEffect.clone();
        additionalEffect.material = effectMaterial.clone();
        additionalEffect.position.copy(player.position);
        additionalEffect.position.y += i * 0.1;
        scene.add(additionalEffect);
        effects.push(additionalEffect);
    }
    
    // Animate the death effect
    let scale = 0.5;
    let opacity = 0.9;
    
    const animateDeath = () => {
        scale += 0.3;
        opacity -= 0.05;
        
        effects.forEach((effect, index) => {
            const effectScale = scale + (index * 0.2);
            effect.scale.set(effectScale, effectScale, effectScale);
            effect.material.opacity = opacity - (index * 0.1);
        });
        
        if (opacity <= 0) {
            effects.forEach(effect => {
                if (effect.parent) effect.parent.remove(effect);
            });
        } else {
            requestAnimationFrame(animateDeath);
        }
    };
    
    animateDeath();
    
    // Add screen flash effect
    if (cameraSystem) {
        cameraSystem.shake(1.0, 500); // Strong shake for death
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update game logic
    handleMovement();
    updateEnemies();
    checkPortalCollision();
    updatePortalEffects();
    
    // Update camera system
    cameraSystem.update();
    
    // Update cooldowns
    if (attackCooldown > 0) {
        attackCooldown -= 16; // Approximate frame time
    }
    
    if (abilityCooldown > 0) {
        abilityCooldown -= 16;
        if (abilityCooldown <= 0) {
            document.getElementById('abilityStatus').textContent = 'Ready';
        }
    }
    
    if (dodgeCooldown > 0) {
        dodgeCooldown -= 16;
    }
    
    // Update invincibility timer
    if (player && player.userData.invincible && player.userData.invincibilityTime > 0) {
        player.userData.invincibilityTime -= 16;
        
        // Flash player during invincibility
        const flashSpeed = 200; // Flash every 200ms
        const shouldFlash = Math.floor(Date.now() / flashSpeed) % 2 === 0;
        player.material.opacity = shouldFlash ? 0.5 : 1.0;
        
        if (player.userData.invincibilityTime <= 0) {
            player.userData.invincible = false;
            player.material.opacity = 1.0; // Restore full opacity
            console.log("Invincibility ended");
        }
    }
    
    // Render the scene
    renderer.render(scene, camera);
}

// Start the game when page loads
window.addEventListener('load', init);