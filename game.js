import * as THREE from 'three';

// Global initialization flag
window.gameInitialized = false;

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

// Game state management
let gameState = 'intro'; // 'intro', 'menu', 'playing', 'settings'
let gameInitialized = false;

// Stamina system
let stamina = 0; // Current stamina (0-50)
let maxStamina = 50; // Max stamina (50 enemy kills)
let enemyKillCount = 0; // Track enemy kills
let staminaCharges = 0; // Available skill charges (0-5)
let maxStaminaCharges = 5; // Max charges when stamina is full
let isStaminaMode = false; // Whether player is in stamina mode (can spam skills)

// Stamina decay system
let lastEnemyHitTime = 0; // Timestamp of last enemy hit
let staminaDecayDelay = 11000; // 11 seconds before stamina starts decaying
let staminaDecayRate = 1000; // Decay 1 stamina point every 1000ms (1 second)
let lastStaminaDecayTime = 0; // Timestamp of last stamina decay

// Mini boss system
let normalEnemyKills = 0; // Track normal enemy kills for mini boss spawning
let miniBossSpawnThreshold = 65; // Spawn mini boss after 65 normal enemy kills
let miniBossActive = false; // Whether a mini boss is currently active
let miniBoss = null; // Reference to current mini boss

// Level progression system
let currentLevel = 1; // Current level/stage
let maxLevel = 5; // Maximum levels available
let nextLevelPortal = null; // Portal to next level
let levelScenes = {}; // Store different level scenes

// Dimension system
let currentDimension = 'home'; // 'home' or 'war'
let homeScene, warScene;
let portal; // Portal object for teleportation

// Audio system
let homeMusic, warMusic, menuMusic;
let currentMusic = null;
let musicVolume = 0.3; // Default volume (30%)
let audioInitialized = false; // Track if audio context is ready

// Immortal definitions with hitbox properties
const immortals = {
    flame: {
        name: 'Flame',
        color: 0xff4444,
        attackRange: 4,
        attackDamage: 40,
        attackCooldown: 400,
        abilityCooldown: 2000,
        speed: 0.12,
        // Hitbox properties - Curved flame sweep with damage area
        hitboxType: 'curve', // Curved flame attack
        hitboxRange: 4,      // How far the attack reaches
        hitboxWidth: 90,     // Curve angle in degrees
        damageRadius: 5,     // Width of the damage area
        curveIntensity: 1, // How curved the attack is (0-1)
        areaEffect: true     // Has area damage effect
    },
    storm: {
        name: 'Storm',
        color: 0x4444ff,
        attackRange: 8,
        attackDamage: 10,
        attackCooldown: 300,
        abilityCooldown: 3000,
        speed: 0.15,
        // Hitbox properties - Lightning chain
        hitboxType: 'chain', // Chain lightning attack
        hitboxRange: 8,      // Long range
        hitboxWidth: 0.5,      // Chain width
        damageRadius: 1,   // Splash around each hit
        maxChains: 3         // Maximum chain targetss
    },
    earth: {
        name: 'Earth',
        color: 0x8b4513,
        attackRange: 2.5,
        attackDamage: 40,
        attackCooldown: 800,
        abilityCooldown: 10000,
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

// Menu and intro system
function initializeMenuSystem() {
    console.log("Initializing menu system...");
    
    // Show intro scene first
    showIntroScene();
    
    // Set up intro event listeners with error handling
    try {
        const introSkip = document.getElementById('introSkip');
        if (introSkip) {
            introSkip.addEventListener('click', skipIntro);
            console.log("Intro skip button listener attached");
        } else {
            console.error("introSkip button not found!");
        }
    } catch (error) {
        console.error("Error setting up intro listeners:", error);
    }
    
    // Set up main menu event listeners with error handling
    try {
        const playButton = document.getElementById('playButton');
        const settingsButton = document.getElementById('settingsButton');
        const quitButton = document.getElementById('quitButton');
        
        if (playButton) {
            playButton.addEventListener('click', startGame);
            console.log("Play button listener attached");
        } else {
            console.error("playButton not found!");
        }
        
        if (settingsButton) {
            settingsButton.addEventListener('click', showSettings);
            console.log("Settings button listener attached");
        } else {
            console.error("settingsButton not found!");
        }
        
        if (quitButton) {
            quitButton.addEventListener('click', quitGame);
            console.log("Quit button listener attached");
        } else {
            console.error("quitButton not found!");
        }
    } catch (error) {
        console.error("Error setting up main menu listeners:", error);
    }
    
    // Set up settings menu event listeners with error handling
    try {
        const backToMenuButton = document.getElementById('backToMenuButton');
        const volumeSlider = document.getElementById('volumeSlider');
        const muteButton = document.getElementById('muteButton');
        
        if (backToMenuButton) {
            backToMenuButton.addEventListener('click', showMainMenu);
            console.log("Back to menu button listener attached");
        } else {
            console.error("backToMenuButton not found!");
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', updateVolume);
            console.log("Volume slider listener attached");
        } else {
            console.error("volumeSlider not found!");
        }
        
        if (muteButton) {
            muteButton.addEventListener('click', toggleMute);
            console.log("Mute button listener attached");
        } else {
            console.error("muteButton not found!");
        }
    } catch (error) {
        console.error("Error setting up settings menu listeners:", error);
    }
    
    // Set up death scene event listeners with error handling
    try {
        const respawnButton = document.getElementById('respawnButton');
        const returnToMenuButton = document.getElementById('returnToMenuButton');
        
        if (respawnButton) {
            respawnButton.addEventListener('click', respawnPlayer);
            console.log("Respawn button listener attached");
        } else {
            console.error("respawnButton not found!");
        }
        
        if (returnToMenuButton) {
            returnToMenuButton.addEventListener('click', returnToMenuFromDeath);
            console.log("Return to menu button listener attached");
        } else {
            console.error("returnToMenuButton not found!");
        }
    } catch (error) {
        console.error("Error setting up death scene listeners:", error);
    }
    
    // Auto-skip cutscene after 30 seconds if no video or if video is too long
    setTimeout(() => {
        if (gameState === 'intro') {
            const introVideo = document.getElementById('introVideo');
            // Only auto-skip if no video is playing or if video is longer than 30 seconds
            if (!introVideo || introVideo.paused || introVideo.currentTime === 0) {
                skipIntro();
            }
        }
    }, 30000); // 30 seconds for cutscene
}

function showIntroScene() {
    gameState = 'intro';
    document.getElementById('introScene').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('settingsMenu').style.display = 'none';
    hideGameUI();
    
    // Play Vietnamese menu music for intro
    playMusic('menu');
    
    // Check if video is available and play it
    const introVideo = document.getElementById('introVideo');
    if (introVideo && introVideo.querySelector('source')) {
        playIntroCutscene();
    } else {
        // Show placeholder until video is added
        document.getElementById('videoPlaceholder').style.display = 'flex';
        document.getElementById('introVideo').style.display = 'none';
    }
    
    console.log("Showing intro cutscene with Bốn Vị Bất Tử music");
}

function playIntroCutscene() {
    const introVideo = document.getElementById('introVideo');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    
    if (introVideo && introVideo.querySelector('source')) {
        // Hide placeholder and show video
        videoPlaceholder.style.display = 'none';
        introVideo.style.display = 'block';
        
        // Play the video
        introVideo.play().then(() => {
            console.log("Intro cutscene video started");
        }).catch(error => {
            console.warn("Could not play intro video:", error);
            // Fallback to placeholder
            videoPlaceholder.style.display = 'flex';
            introVideo.style.display = 'none';
        });
        
        // Auto-skip to menu when video ends
        introVideo.addEventListener('ended', () => {
            console.log("Intro cutscene ended");
            skipIntro();
        });
        
        // Update skip button text
        document.getElementById('introSkip').textContent = 'Skip Cutscene';
    }
}

function skipIntro() {
    // Stop video if playing
    const introVideo = document.getElementById('introVideo');
    if (introVideo && !introVideo.paused) {
        introVideo.pause();
        introVideo.currentTime = 0;
    }
    
    gameState = 'menu';
    document.getElementById('introScene').style.display = 'none';
    showMainMenu();
    
    console.log("Skipped intro cutscene, showing main menu");
}

// Function to add video source (call this when video file is ready)
function setIntroCutsceneVideo(videoPath) {
    const introVideo = document.getElementById('introVideo');
    const source = document.createElement('source');
    source.src = videoPath;
    source.type = 'video/mp4';
    
    // Clear existing sources
    introVideo.innerHTML = '';
    introVideo.appendChild(source);
    
    // Add fallback text
    introVideo.appendChild(document.createTextNode('Your browser does not support the video tag.'));
    
    console.log(`Intro cutscene video set to: ${videoPath}`);
    
    // If we're currently showing the intro, switch to video
    if (gameState === 'intro') {
        playIntroCutscene();
    }
}

function showMainMenu() {
    gameState = 'menu';
    document.getElementById('introScene').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('settingsMenu').style.display = 'none';
    hideGameUI();
    
    // Play Vietnamese menu music
    playMusic('menu');
    
    console.log("Showing main menu with Bốn Vị Bất Tử music");
}

function showSettings() {
    gameState = 'settings';
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('settingsMenu').style.display = 'flex';
    
    // Continue playing Vietnamese menu music in settings
    playMusic('menu');
    
    // Update settings UI with current values
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = Math.round(musicVolume * 100);
    }
    
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        muteButton.textContent = currentMusic && !currentMusic.muted ? 'Unmuted' : 'Muted';
    }
    
    console.log("Showing settings menu with Bốn Vị Bất Tử music");
}

function startGame() {
    console.log("🎮 START GAME BUTTON CLICKED!");
    gameState = 'playing';
    document.getElementById('introScene').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('settingsMenu').style.display = 'none';
    showGameUI();
    
    // Initialize game if not already done
    if (!gameInitialized) {
        console.log("Initializing game for first time...");
        initializeGame();
        gameInitialized = true;
    }
    
    console.log("Game started successfully!");
}

function quitGame() {
    // In a web browser, we can't actually quit, so show a message
    if (confirm("Are you sure you want to quit? This will close the game.")) {
        window.close(); // This may not work in all browsers due to security
        // Fallback: redirect to a blank page or show a quit message
        document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 2em; color: white; background: #2c3e50;">Thank you for playing The Four Immortals!</div>';
    }
}

function hideGameUI() {
    document.getElementById('ui').style.display = 'none';
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('immortalSelect').style.display = 'none';
}

function showGameUI() {
    document.getElementById('ui').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
    document.getElementById('immortalSelect').style.display = 'block';
}

function updateVolume() {
    const volumeSlider = document.getElementById('volumeSlider');
    const newVolume = volumeSlider.value / 100;
    setMusicVolume(newVolume);
    
    console.log(`Volume updated to ${Math.round(newVolume * 100)}%`);
}

function toggleMute() {
    const muteButton = document.getElementById('muteButton');
    
    if (currentMusic) {
        currentMusic.muted = !currentMusic.muted;
        muteButton.textContent = currentMusic.muted ? 'Muted' : 'Unmuted';
        
        console.log(`Audio ${currentMusic.muted ? 'muted' : 'unmuted'}`);
    }
}

function showDeathScene() {
    gameState = 'death';
    
    // Hide other UI elements
    document.getElementById('introScene').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('settingsMenu').style.display = 'none';
    hideGameUI();
    
    // Show death scene (initially invisible)
    const deathScene = document.getElementById('deathScene');
    deathScene.style.display = 'flex';
    
    // Fade in the death scene after a brief delay
    setTimeout(() => {
        deathScene.classList.add('death-scene-visible');
    }, 500); // Small delay before fade-in starts
    
    console.log("Death scene fading in...");
}

function hideDeathScene() {
    const deathScene = document.getElementById('deathScene');
    const deathOverlay = document.getElementById('deathOverlay');
    
    // Fade out death scene
    deathScene.classList.remove('death-scene-visible');
    
    // After fade out, hide the scene and reset overlay
    setTimeout(() => {
        deathScene.style.display = 'none';
        deathOverlay.classList.remove('death-fade');
    }, 1000); // Wait for fade out to complete
}

function respawnPlayer() {
    console.log("Player respawning...");
    hideDeathScene();
    
    // Reset player state
    health = 100;
    updateHealthBar();
    
    // Reset level progression
    currentLevel = 1;
    normalEnemyKills = 0;
    stamina = 0;
    staminaCharges = 0;
    isStaminaMode = false;
    miniBossSpawnThreshold = 65;
    
    // Add brief invincibility after respawn
    if (player) {
        player.userData.invincible = true;
        player.userData.invincibilityTime = 3000;
    }
    
    // Return to home dimension
    currentDimension = 'home';
    scene = homeScene;
    
    // Remove player from current scene and add to home
    if (player && player.parent) {
        player.parent.remove(player);
    }
    if (player) {
        homeScene.add(player);
        player.position.set(0, 0.5, 0); // Reset to spawn position
    }
    
    // Clear all enemies and bosses
    enemies.forEach(enemy => {
        if (enemy.parent) enemy.parent.remove(enemy);
    });
    enemies = [];
    
    if (miniBoss && miniBoss.parent) {
        miniBoss.parent.remove(miniBoss);
    }
    miniBoss = null;
    miniBossActive = false;
    
    // Clean up progression portals
    if (window.progressionPortals) {
        window.progressionPortals.forEach(portal => {
            if (portal.ring && portal.ring.parent) {
                portal.ring.parent.remove(portal.ring);
            }
            if (portal.center && portal.center.parent) {
                portal.center.parent.remove(portal.center);
            }
        });
        window.progressionPortals = [];
    }
    
    // Switch to peaceful home music
    playMusic('home');
    
    // Update all UI elements
    updateStaminaUI();
    updateMiniBossUI();
    updateLevelUI();
    
    // Resume game
    gameState = 'playing';
    showGameUI();
    
    console.log("Player respawned in home dimension with full reset");
}

function returnToMenuFromDeath() {
    console.log("Returning to main menu from death scene");
    hideDeathScene();
    showMainMenu();
}

// Initialize the menu system when page loads
function initializeApp() {
    console.log("Initializing application...");
    
    // Mark as initialized
    window.gameInitialized = true;
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("DOM loaded, initializing menu system...");
            initializeMenuSystem();
            setupEarlyAudioInit();
        });
    } else {
        // DOM is already loaded
        initializeMenuSystem();
        setupEarlyAudioInit();
    }
    
    // Start the animation loop (but game logic only runs when playing)
    animate();
    
    // Add a backup initialization after a short delay
    setTimeout(() => {
        console.log("Backup initialization check...");
        // Re-check if buttons exist and re-attach listeners if needed
        const playButton = document.getElementById('playButton');
        if (playButton && !playButton.onclick) {
            console.log("Re-initializing menu system...");
            initializeMenuSystem();
        }
    }, 1000);
}

function setupEarlyAudioInit() {
    console.log("🎵 Setting up immediate audio initialization...");
    
    // Initialize audio immediately without waiting for user interaction
    initializeAudio();
    
    // Set up multiple event listeners to catch the first user interaction
    const events = ['click', 'keydown', 'touchstart', 'mousedown', 'mousemove'];
    
    function handleFirstInteraction() {
        console.log("🎵 First user interaction detected - ensuring audio is playing!");
        
        // Hide the audio prompt
        const audioPrompt = document.getElementById('audioPrompt');
        if (audioPrompt) {
            audioPrompt.style.display = 'none';
        }
        
        // Ensure audio is initialized
        if (!audioInitialized) {
            initializeAudio();
            audioInitialized = true;
        }
        
        // Force start menu music immediately
        setTimeout(() => {
            playMusic('menu');
            console.log("🎵 Forcing Bốn Vị Bất Tử music to play!");
        }, 50);
        
        // Remove all event listeners after first interaction
        events.forEach(event => {
            document.removeEventListener(event, handleFirstInteraction, true);
        });
    }
    
    // Add event listeners for first interaction
    events.forEach(event => {
        document.addEventListener(event, handleFirstInteraction, true);
    });
    
    // Try to start music immediately (will likely be blocked by browser)
    setTimeout(() => {
        console.log("🎵 Attempting immediate music start...");
        playMusic('menu');
    }, 500);
    
    console.log("🎵 Audio will start immediately or on first user interaction");
}

// Rename the old init function to initializeGame
function initializeGame() {
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
    // animate(); // Removed - now called from initializeApp
    
    // Initialize stamina UI
    updateStaminaUI();
    
    // Initialize mini boss UI
    updateMiniBossUI();
    
    // Initialize level UI
    updateLevelUI();
    
    // Initialize stamina decay timing
    lastEnemyHitTime = Date.now();
    lastStaminaDecayTime = Date.now();
    
    console.log("Game loop started");
}

function initializeAudio() {
    try {
        // Create audio objects for all scenes
        homeMusic = new Audio('assets/audio/home-music.mp3');
        warMusic = new Audio('assets/audio/war-music.mp3');
        menuMusic = new Audio('Bốn Vị Bất Tử.mp3'); // Use the specific Vietnamese music file
        
        // Configure home music (peaceful, looping)
        homeMusic.loop = true;
        homeMusic.volume = musicVolume;
        homeMusic.preload = 'auto';
        
        // Configure war music (intense, looping)
        warMusic.loop = true;
        warMusic.volume = musicVolume;
        warMusic.preload = 'auto';
        
        // Configure menu music (atmospheric, looping) - "Bốn Vị Bất Tử"
        menuMusic.loop = true;
        menuMusic.volume = musicVolume;
        menuMusic.preload = 'auto';
        
        console.log("🎵 Audio files loaded successfully (including Bốn Vị Bất Tử.mp3 for menu)");
        
        // Add error handling for all music tracks
        homeMusic.addEventListener('error', (e) => {
            console.warn("Home music failed to load:", e);
        });
        
        warMusic.addEventListener('error', (e) => {
            console.warn("War music failed to load:", e);
        });
        
        menuMusic.addEventListener('error', (e) => {
            console.warn("Menu music (Bốn Vị Bất Tử.mp3) failed to load:", e);
        });
        
        // Add loaded event listeners with immediate play attempt
        homeMusic.addEventListener('canplaythrough', () => {
            console.log("Home music ready to play");
        });
        
        warMusic.addEventListener('canplaythrough', () => {
            console.log("War music ready to play");
        });
        
        menuMusic.addEventListener('canplaythrough', () => {
            console.log("🎵 Menu music (Bốn Vị Bất Tử.mp3) ready to play");
            // Try to start menu music immediately if we're in a menu state
            if (gameState === 'intro' || gameState === 'menu' || gameState === 'settings') {
                setTimeout(() => {
                    playMusic('menu');
                }, 100);
            }
        });
        
        // Immediately try to start appropriate music based on current state
        setTimeout(() => {
            if (gameState === 'menu' || gameState === 'intro' || gameState === 'settings') {
                playMusic('menu');
                console.log("🎵 Attempting to start Bốn Vị Bất Tử music immediately");
            } else if (currentDimension === 'home') {
                playMusic('home');
            } else if (currentDimension === 'war') {
                playMusic('war');
            }
        }, 200);
        
    } catch (error) {
        console.error("Failed to initialize audio:", error);
    }
}

function playMusic(musicType) {
    try {
        console.log(`🎵 Attempting to play ${musicType} music...`);
        
        // Stop current music if playing
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0;
        }
        
        // Select and play new music
        if (musicType === 'home' && homeMusic) {
            currentMusic = homeMusic;
            homeMusic.play().then(() => {
                console.log("✅ Home music started successfully");
                audioInitialized = true;
            }).catch(e => {
                console.warn("❌ Could not play home music:", e);
                // Try again after a short delay
                setTimeout(() => {
                    if (gameState === 'playing' && currentDimension === 'home') {
                        homeMusic.play().catch(() => {});
                    }
                }, 1000);
            });
        } else if (musicType === 'war' && warMusic) {
            currentMusic = warMusic;
            warMusic.play().then(() => {
                console.log("✅ War music started successfully");
                audioInitialized = true;
            }).catch(e => {
                console.warn("❌ Could not play war music:", e);
                setTimeout(() => {
                    if (gameState === 'playing' && currentDimension === 'war') {
                        warMusic.play().catch(() => {});
                    }
                }, 1000);
            });
        } else if (musicType === 'menu' && menuMusic) {
            currentMusic = menuMusic;
            menuMusic.play().then(() => {
                console.log("✅ Menu music (Bốn Vị Bất Tử.mp3) started successfully");
                audioInitialized = true;
            }).catch(e => {
                console.warn("❌ Could not play menu music (Bốn Vị Bất Tử.mp3):", e);
                console.log("🔄 Will retry when user interacts with page...");
                // Keep trying every few seconds
                setTimeout(() => {
                    if (gameState === 'intro' || gameState === 'menu' || gameState === 'settings') {
                        menuMusic.play().catch(() => {});
                    }
                }, 2000);
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
    if (menuMusic) menuMusic.volume = musicVolume;
    
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
    const wallHeight = 6; // Taller walls for better visibility
    const wallThickness = 1; // Thicker walls
    const worldSize = 50;
    
    // Enhanced peaceful wall material - light stone with better visibility
    const homeWallMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xE6D3A3, // Lighter tan/beige color for better visibility
        transparent: false
    });
    
    // Create complete solid walls (no gaps)
    const walls = [
        // North wall (complete)
        { pos: [0, wallHeight / 2, worldSize + wallThickness / 2], size: [100 + wallThickness * 2, wallHeight, wallThickness] },
        // South wall (complete)
        { pos: [0, wallHeight / 2, -worldSize - wallThickness / 2], size: [100 + wallThickness * 2, wallHeight, wallThickness] },
        // East wall (complete)
        { pos: [worldSize + wallThickness / 2, wallHeight / 2, 0], size: [wallThickness, wallHeight, 100] },
        // West wall (complete)
        { pos: [-worldSize - wallThickness / 2, wallHeight / 2, 0], size: [wallThickness, wallHeight, 100] }
    ];
    
    walls.forEach(wallData => {
        const wallGeometry = new THREE.BoxGeometry(...wallData.size);
        const wall = new THREE.Mesh(wallGeometry, homeWallMaterial);
        wall.position.set(...wallData.pos);
        wall.castShadow = true;
        wall.receiveShadow = true;
        homeScene.add(wall);
    });
    
    // Add decorative corner pillars for better visual appeal
    const pillarHeight = wallHeight + 2;
    const pillarSize = 2;
    const pillarMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xD2B48C, // Slightly darker for contrast
        transparent: false
    });
    
    const cornerPositions = [
        [-worldSize - 1, pillarHeight / 2, -worldSize - 1], // Southwest
        [worldSize + 1, pillarHeight / 2, -worldSize - 1],  // Southeast
        [-worldSize - 1, pillarHeight / 2, worldSize + 1],  // Northwest
        [worldSize + 1, pillarHeight / 2, worldSize + 1]    // Northeast
    ];
    
    cornerPositions.forEach(pos => {
        const pillarGeometry = new THREE.BoxGeometry(pillarSize, pillarHeight, pillarSize);
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(...pos);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        homeScene.add(pillar);
    });
    
    // Store wall boundaries for collision detection in home dimension
    window.homeBounds = {
        minX: -worldSize,
        maxX: worldSize,
        minZ: -worldSize,
        maxZ: worldSize
    };
    
    console.log("Complete home walls created with collision boundaries:", window.homeBounds);
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
        
        // Clear mini boss if active
        if (miniBoss && miniBoss.parent) {
            miniBoss.parent.remove(miniBoss);
        }
        miniBoss = null;
        miniBossActive = false;
        
        // Reset progression states
        normalEnemyKills = 0;
        
        console.log("All enemies and bosses despawned - home is peaceful");
        
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
        
        // Test commands for debugging
        if (event.code === 'KeyT' && event.ctrlKey) {
            // Test stamina decay - add some stamina and reset timer
            stamina = Math.min(maxStamina, stamina + 10);
            lastEnemyHitTime = Date.now() - 12000; // Set last hit to 12 seconds ago
            updateStaminaUI();
            console.log(`🧪 Test: Added stamina (${stamina}) and set last hit to 12s ago`);
        }
        
        if (event.code === 'KeyR' && event.ctrlKey) {
            // Reset stamina decay timer
            lastEnemyHitTime = Date.now();
            console.log(`🔄 Test: Reset stamina decay timer`);
        }
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
    
    // Check wall collision - both dimensions now have walls
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
    } else if (currentDimension === 'home' && window.homeBounds) {
        const playerRadius = 0.5; // Half the player cube size for collision buffer
        
        // Clamp position to home boundaries
        newPosition.x = Math.max(
            window.homeBounds.minX + playerRadius,
            Math.min(window.homeBounds.maxX - playerRadius, newPosition.x)
        );
        newPosition.z = Math.max(
            window.homeBounds.minZ + playerRadius,
            Math.min(window.homeBounds.maxZ - playerRadius, newPosition.z)
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
            
            // Record enemy hit for stamina decay system
            recordEnemyHit();
            
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
                handleEnemyDeath(enemy, index);
                console.log("Enemy defeated!");
                
                // Skip to next enemy since current one was removed
                return;
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
    // Check if we can use stamina charge (no cooldown)
    const canUseStaminaCharge = useStaminaCharge();
    
    if (!canUseStaminaCharge && abilityCooldown > 0) {
        console.log("Ability on cooldown and no stamina charges available");
        return;
    }
    
    const immortal = immortals[currentImmortal];
    
    // Only apply cooldown if not using stamina charge
    if (!canUseStaminaCharge) {
        abilityCooldown = immortal.abilityCooldown;
        document.getElementById('abilityStatus').textContent = 'Cooling Down';
    } else {
        console.log("🔥 Using stamina charge - no cooldown! 🔥");
        document.getElementById('abilityStatus').textContent = 'STAMINA MODE!';
    }
    
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
    console.log("🔥 Flame Circle Burst! 🔥");
    
    // Flame ability creates perfect circle damage around the player
    const skillRange = immortals[currentImmortal].attackRange * 1.5; // Skills have longer range
    const abilityDamage = immortals[currentImmortal].attackDamage; // Same damage as melee attack
    
    console.log(`Flame circle: ${abilityDamage} damage in ${skillRange} unit radius`);
    
    let hitCount = 0;
    
    // Check enemies within perfect circle range from player
    enemies.forEach((enemy, index) => {
        const distance = player.position.distanceTo(enemy.position);
        if (distance <= skillRange) { // Perfect circle damage
            enemy.health -= abilityDamage;
            hitCount++;
            
            // Record enemy hit for stamina decay system
            recordEnemyHit();
            
            // Create individual flame burst at each enemy
            createFlameHitEffect(enemy.position);
            
            console.log(`🔥 Flame circle hit enemy ${hitCount} at distance ${distance.toFixed(2)} for ${abilityDamage} damage`);
            
            if (enemy.health <= 0) {
                handleEnemyDeath(enemy, index);
            }
        }
    });
    
    // Create expanding circle fire effect around the player
    createFlameCircleEffect(skillRange);
    
    console.log(`🔥 Flame circle burst hit ${hitCount} enemies in ${skillRange} unit radius`);
}

function createFlameCircleEffect(radius) {
    // Create main expanding fire circle
    const circleGeometry = new THREE.CircleGeometry(radius, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4400, 
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    const fireCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    fireCircle.position.copy(player.position);
    fireCircle.position.y = 0.05;
    fireCircle.rotation.x = -Math.PI / 2;
    
    scene.add(fireCircle);
    
    // Create ring border for better visibility
    const ringGeometry = new THREE.RingGeometry(radius - 0.2, radius, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600, 
        transparent: true, 
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const fireRing = new THREE.Mesh(ringGeometry, ringMaterial);
    fireRing.position.copy(player.position);
    fireRing.position.y = 0.1;
    fireRing.rotation.x = -Math.PI / 2;
    
    scene.add(fireRing);
    
    // Create flame particles around the circle
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const particlePos = player.position.clone();
        particlePos.x += Math.cos(angle) * radius;
        particlePos.z += Math.sin(angle) * radius;
        
        createFlameParticle(particlePos);
    }
    
    // Animate the circle effect
    let effectTime = 0;
    const animateCircle = () => {
        effectTime += 16;
        const progress = effectTime / 1000; // 1 second effect
        
        // Animate main circle
        const scale = 1 + progress * 0.5;
        fireCircle.scale.set(scale, scale, 1);
        fireCircle.material.opacity = Math.max(0, 0.6 - progress * 0.6);
        fireCircle.rotation.z += 0.02;
        
        // Animate ring
        fireRing.scale.set(scale, scale, 1);
        fireRing.material.opacity = Math.max(0, 0.9 - progress * 0.9);
        fireRing.rotation.z -= 0.03;
        
        if (progress < 1) {
            requestAnimationFrame(animateCircle);
        } else {
            if (fireCircle.parent) scene.remove(fireCircle);
            if (fireRing.parent) scene.remove(fireRing);
        }
    };
    
    animateCircle();
}

function createFlameHitEffect(position) {
    // Create flame burst at enemy hit location
    const burstGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const burstMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff3300, 
        transparent: true, 
        opacity: 1.0
    });
    
    const flameBurst = new THREE.Mesh(burstGeometry, burstMaterial);
    flameBurst.position.copy(position);
    flameBurst.position.y = 0.5;
    
    scene.add(flameBurst);
    
    // Animate flame burst
    let burstTime = 0;
    const animateBurst = () => {
        burstTime += 16;
        const progress = burstTime / 400; // 400ms effect
        
        // Scale and fade
        const scale = 1 + progress * 2;
        flameBurst.scale.set(scale, scale, scale);
        flameBurst.material.opacity = Math.max(0, 1 - progress);
        
        if (progress < 1) {
            requestAnimationFrame(animateBurst);
        } else {
            if (flameBurst.parent) scene.remove(flameBurst);
        }
    };
    
    animateBurst();
}

function createFlameParticle(position) {
    // Create small flame particle
    const particleGeometry = new THREE.SphereGeometry(0.2, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600, 
        transparent: true, 
        opacity: 0.8
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    particle.position.y = 0.2;
    
    scene.add(particle);
    
    // Animate particle
    let particleTime = 0;
    const animateParticle = () => {
        particleTime += 16;
        const progress = particleTime / 600; // 600ms effect
        
        // Move upward and fade
        particle.position.y += 0.02;
        particle.material.opacity = Math.max(0, 0.8 - progress * 0.8);
        
        // Slight random movement
        particle.position.x += (Math.random() - 0.5) * 0.01;
        particle.position.z += (Math.random() - 0.5) * 0.01;
        
        if (progress < 1) {
            requestAnimationFrame(animateParticle);
        } else {
            if (particle.parent) scene.remove(particle);
        }
    };
    
    animateParticle();
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
        
        // Record enemy hit for stamina decay system
        recordEnemyHit();
        
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
            if (index !== -1) {
                handleEnemyDeath(targetEnemy, index);
            }
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
    console.log("🏔️ Mountain Line Creation! 🏔️");
    
    // Calculate direction from player to mouse position
    const direction = new THREE.Vector3();
    direction.subVectors(mouseWorldPos, player.position);
    direction.normalize();
    
    const mountainRange = immortals[currentImmortal].attackRange * 2; // 5 unit range
    const mountainCount = 5; // Number of mountains in the line
    const mountainSpacing = mountainRange / mountainCount; // Space between mountains
    
    console.log(`Creating ${mountainCount} mountains in a line, range: ${mountainRange} units`);
    
    let hitCount = 0;
    
    // Create mountains along the line and check for enemy damage
    for (let i = 1; i <= mountainCount; i++) {
        const mountainPos = player.position.clone();
        mountainPos.add(direction.clone().multiplyScalar(i * mountainSpacing));
        
        // Create mountain visual
        setTimeout(() => {
            createMountain(mountainPos, i);
        }, i * 200); // Stagger mountain creation
        
        // Check for enemies near this mountain position
        enemies.forEach((enemy, index) => {
            const distanceToMountain = enemy.position.distanceTo(mountainPos);
            if (distanceToMountain <= 2) { // Mountain damage radius
                enemy.health -= 60; // Mountain damage
                hitCount++;
                
                // Record enemy hit for stamina decay system
                recordEnemyHit();
                
                // Knockback from mountain
                const knockDirection = new THREE.Vector3();
                knockDirection.subVectors(enemy.position, mountainPos);
                knockDirection.normalize();
                knockDirection.multiplyScalar(2);
                enemy.position.add(knockDirection);
                
                console.log(`🏔️ Mountain ${i} hit enemy for 60 damage at distance ${distanceToMountain.toFixed(2)}`);
                
                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy, index);
                }
            }
        });
    }
    
    // Create ground crack effect along the line
    createMountainLineEffect(player.position, direction, mountainRange);
    
    // Camera shake for mountain creation
    if (cameraSystem) {
        cameraSystem.shake(0.8, 1500);
    }
    
    console.log(`🏔️ Mountain line created! Hit ${hitCount} enemies`);
}

function createMountain(position, mountainIndex) {
    // Create mountain base (wider at bottom)
    const baseGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const baseMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x654321, // Brown mountain color
        transparent: false
    });
    
    const mountainBase = new THREE.Mesh(baseGeometry, baseMaterial);
    mountainBase.position.copy(position);
    mountainBase.position.y = 1.5; // Half height above ground
    
    scene.add(mountainBase);
    
    // Create mountain peak (smaller, lighter color)
    const peakGeometry = new THREE.ConeGeometry(0.8, 1.5, 6);
    const peakMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x8b7355, // Lighter brown for peak
        transparent: false
    });
    
    const mountainPeak = new THREE.Mesh(peakGeometry, peakMaterial);
    mountainPeak.position.copy(position);
    mountainPeak.position.y = 3.75; // On top of base
    
    scene.add(mountainPeak);
    
    // Create snow cap (white tip)
    const snowGeometry = new THREE.ConeGeometry(0.4, 0.8, 6);
    const snowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, // White snow
        transparent: false
    });
    
    const snowCap = new THREE.Mesh(snowGeometry, snowMaterial);
    snowCap.position.copy(position);
    snowCap.position.y = 4.9; // On top of peak
    
    scene.add(snowCap);
    
    // Animate mountain rising from ground
    let mountainTime = 0;
    const originalBaseY = mountainBase.position.y;
    const originalPeakY = mountainPeak.position.y;
    const originalSnowY = snowCap.position.y;
    
    // Start mountains underground
    mountainBase.position.y = -1.5;
    mountainPeak.position.y = -1.5;
    snowCap.position.y = -1.5;
    
    const animateMountainRise = () => {
        mountainTime += 16;
        const progress = Math.min(1, mountainTime / 1000); // 1 second rise
        
        // Ease-out animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        mountainBase.position.y = -1.5 + (originalBaseY + 1.5) * easeProgress;
        mountainPeak.position.y = -1.5 + (originalPeakY + 1.5) * easeProgress;
        snowCap.position.y = -1.5 + (originalSnowY + 1.5) * easeProgress;
        
        if (progress < 1) {
            requestAnimationFrame(animateMountainRise);
        }
    };
    
    animateMountainRise();
    
    // Remove mountains after 10 seconds
    setTimeout(() => {
        if (mountainBase.parent) scene.remove(mountainBase);
        if (mountainPeak.parent) scene.remove(mountainPeak);
        if (snowCap.parent) scene.remove(snowCap);
    }, 10000);
}

function createMountainLineEffect(startPos, direction, range) {
    // Create ground crack effect along the mountain line
    const crackGeometry = new THREE.PlaneGeometry(range, 0.5);
    const crackMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4a4a4a, // Dark crack color
        transparent: true, 
        opacity: 0.8
    });
    
    const groundCrack = new THREE.Mesh(crackGeometry, crackMaterial);
    groundCrack.position.copy(startPos);
    groundCrack.position.add(direction.clone().multiplyScalar(range / 2));
    groundCrack.position.y = 0.01; // Slightly above ground
    groundCrack.rotation.x = -Math.PI / 2;
    
    // Orient crack along the direction
    const angle = Math.atan2(direction.z, direction.x);
    groundCrack.rotation.z = angle;
    
    scene.add(groundCrack);
    
    // Create dust particles along the line
    for (let i = 0; i < 10; i++) {
        const dustPos = startPos.clone();
        dustPos.add(direction.clone().multiplyScalar(Math.random() * range));
        createDustParticle(dustPos);
    }
    
    // Remove crack after 5 seconds
    setTimeout(() => {
        if (groundCrack.parent) scene.remove(groundCrack);
    }, 5000);
}

function createDustParticle(position) {
    const dustGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const dustMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x8b7355, 
        transparent: true, 
        opacity: 0.6
    });
    
    const dust = new THREE.Mesh(dustGeometry, dustMaterial);
    dust.position.copy(position);
    dust.position.y = 0.2;
    
    scene.add(dust);
    
    // Animate dust rising and fading
    let dustTime = 0;
    const animateDust = () => {
        dustTime += 16;
        const progress = dustTime / 2000; // 2 second effect
        
        dust.position.y += 0.02; // Rise up
        dust.material.opacity = Math.max(0, 0.6 - progress * 0.6);
        
        // Random drift
        dust.position.x += (Math.random() - 0.5) * 0.01;
        dust.position.z += (Math.random() - 0.5) * 0.01;
        
        if (progress < 1) {
            requestAnimationFrame(animateDust);
        } else {
            if (dust.parent) scene.remove(dust);
        }
    };
    
    animateDust();
}

function shadowAbility() {
    console.log("🌑 Shadow Form Transformation! 🌑");
    
    // Check if already in shadow form
    if (player.userData.shadowForm) {
        console.log("Already in shadow form!");
        return;
    }
    
    // Activate shadow form
    player.userData.shadowForm = true;
    player.userData.shadowFormTime = 2500; // 4 seconds
    player.userData.invincible = true; // Invulnerable while in shadow form
    
    console.log("🌑 Player transformed into shadow form");
    
    // Transform player appearance to flat shadow
    transformToShadowForm();
    
    // Create shadow transformation effect
    createShadowTransformationEffect();
    
    // Set timer to end shadow form
    setTimeout(() => {
        if (player.userData.shadowForm) {
            endShadowForm();
        }
    }, 2500);
}

function transformToShadowForm() {
    // Store original player properties
    if (!player.userData.originalMaterial) {
        player.userData.originalMaterial = player.material.clone();
        player.userData.originalScale = player.scale.clone();
    }
    
    // Change player to flat shadow appearance
    player.material.color.setHex(0x000000); // Pure black
    player.material.transparent = true;
    player.material.opacity = 0.7; // Semi-transparent
    
    // Flatten the player (make them look like a shadow)
    player.scale.y = 0.1; // Very flat
    player.position.y = 0.05; // Lower to ground level
    
    console.log("🌑 Player appearance transformed to flat shadow");
}

function endShadowForm() {
    if (!player.userData.shadowForm) return;
    
    console.log("🌑 Shadow form ending - returning to normal");
    
    // Restore original appearance
    if (player.userData.originalMaterial) {
        player.material.color.copy(player.userData.originalMaterial.color);
        player.material.transparent = player.userData.originalMaterial.transparent;
        player.material.opacity = player.userData.originalMaterial.opacity;
    }
    
    if (player.userData.originalScale) {
        player.scale.copy(player.userData.originalScale);
    }
    
    // Restore normal position
    player.position.y = 0.5;
    
    // End shadow form state
    player.userData.shadowForm = false;
    player.userData.shadowFormTime = 0;
    player.userData.invincible = false;
    
    // Create transformation back effect
    createShadowReturnEffect();
    
    console.log("🌑 Player returned to normal form");
}

function createShadowTransformationEffect() {
    // Create expanding dark ring effect
    const transformGeometry = new THREE.RingGeometry(0.2, 3, 16);
    const transformMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const transformEffect = new THREE.Mesh(transformGeometry, transformMaterial);
    transformEffect.position.copy(player.position);
    transformEffect.position.y = 0.01;
    transformEffect.rotation.x = -Math.PI / 2;
    
    scene.add(transformEffect);
    
    // Create shadow particles
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const particlePos = player.position.clone();
        particlePos.x += Math.cos(angle) * 2;
        particlePos.z += Math.sin(angle) * 2;
        
        createShadowParticle(particlePos);
    }
    
    // Animate transformation effect
    let effectTime = 0;
    const animateTransform = () => {
        effectTime += 16;
        const progress = effectTime / 1000; // 1 second effect
        
        // Expand and fade
        const scale = 1 + progress * 2;
        transformEffect.scale.set(scale, scale, 1);
        transformEffect.material.opacity = Math.max(0, 0.8 - progress * 0.8);
        transformEffect.rotation.z += 0.05;
        
        if (progress < 1) {
            requestAnimationFrame(animateTransform);
        } else {
            if (transformEffect.parent) scene.remove(transformEffect);
        }
    };
    
    animateTransform();
}

function createShadowReturnEffect() {
    // Create implosion effect when returning to normal
    const returnGeometry = new THREE.RingGeometry(2, 0.2, 16);
    const returnMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x444444, 
        transparent: true, 
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const returnEffect = new THREE.Mesh(returnGeometry, returnMaterial);
    returnEffect.position.copy(player.position);
    returnEffect.position.y = 0.01;
    returnEffect.rotation.x = -Math.PI / 2;
    
    scene.add(returnEffect);
    
    // Animate return effect (implosion)
    let effectTime = 0;
    const animateReturn = () => {
        effectTime += 16;
        const progress = effectTime / 800; // 0.8 second effect
        
        // Shrink and fade
        const scale = 2 - progress * 1.8; // Shrink from 2 to 0.2
        returnEffect.scale.set(scale, scale, 1);
        returnEffect.material.opacity = Math.max(0, 0.9 - progress * 0.9);
        returnEffect.rotation.z -= 0.08;
        
        if (progress < 1) {
            requestAnimationFrame(animateReturn);
        } else {
            if (returnEffect.parent) scene.remove(returnEffect);
        }
    };
    
    animateReturn();
}

function createShadowParticle(position) {
    const particleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x222222, 
        transparent: true, 
        opacity: 0.8
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    particle.position.y = 0.3;
    
    scene.add(particle);
    
    // Animate particle moving toward player
    let particleTime = 0;
    const animateParticle = () => {
        particleTime += 16;
        const progress = particleTime / 800; // 0.8 second effect
        
        // Move toward player center
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, particle.position);
        direction.multiplyScalar(0.05);
        particle.position.add(direction);
        
        // Fade out
        particle.material.opacity = Math.max(0, 0.8 - progress * 0.8);
        
        if (progress < 1 && particle.position.distanceTo(player.position) > 0.5) {
            requestAnimationFrame(animateParticle);
        } else {
            if (particle.parent) scene.remove(particle);
        }
    };
    
    animateParticle();
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
    
    // Check wall collision for dodge destination - both dimensions
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
    } else if (currentDimension === 'home' && window.homeBounds) {
        const playerRadius = 0.5;
        
        // Clamp dodge destination to home boundaries
        endPos.x = Math.max(
            window.homeBounds.minX + playerRadius,
            Math.min(window.homeBounds.maxX - playerRadius, endPos.x)
        );
        endPos.z = Math.max(
            window.homeBounds.minZ + playerRadius,
            Math.min(window.homeBounds.maxZ - playerRadius, endPos.z)
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

function handleEnemyDeath(enemy, index) {
    // Remove enemy from scene and array
    scene.remove(enemy);
    enemies.splice(index, 1);
    
    // Check if this was a mini boss
    if (enemy.isMiniBoss) {
        console.log("🏆 MINI BOSS DEFEATED! 🏆");
        miniBossActive = false;
        miniBoss = null;
        
        // Mini boss gives extra stamina
        addStamina(5); // 5 stamina for mini boss kill
        
        // Create special victory effect
        createMiniBossDeathEffect(enemy.position);
        
        // Reset mini boss progress
        normalEnemyKills = 0;
        updateMiniBossUI();
        
        // Create progression portal to next level
        createProgressionPortal(enemy.position);
        
    } else {
        // Normal enemy death
        normalEnemyKills++;
        addStamina(1);
        
        console.log(`Enemy defeated! Normal kills: ${normalEnemyKills}/${miniBossSpawnThreshold}`);
        
        // Check if we should spawn a mini boss
        if (normalEnemyKills >= miniBossSpawnThreshold && !miniBossActive) {
            spawnMiniBoss();
        } else {
            // Spawn new normal enemy to maintain challenge
            if (enemies.length < 3) {
                spawnNewEnemy();
            }
        }
    }
    
    updateMiniBossUI();
}

function addStamina(amount) {
    stamina = Math.min(maxStamina, stamina + amount);
    enemyKillCount += amount;
    
    // Update UI
    updateStaminaUI();
    
    // Check if stamina is full
    if (stamina >= maxStamina && !isStaminaMode) {
        activateStaminaMode();
    }
}

function activateStaminaMode() {
    isStaminaMode = true;
    staminaCharges = maxStaminaCharges;
    
    console.log("🔥 STAMINA MODE ACTIVATED! 🔥");
    console.log(`You can now use ${maxStaminaCharges} skills without cooldown!`);
    
    // Update UI
    updateStaminaUI();
    
    // Create visual effect for stamina activation
    createStaminaActivationEffect();
    
    // Add screen effect
    if (cameraSystem) {
        cameraSystem.shake(0.8, 600);
    }
}

function useStaminaCharge() {
    if (isStaminaMode && staminaCharges > 0) {
        staminaCharges--;
        updateStaminaUI();
        
        console.log(`Stamina charge used! Remaining: ${staminaCharges}`);
        
        // Check if stamina mode should end
        if (staminaCharges <= 0) {
            deactivateStaminaMode();
        }
        
        return true; // Skill can be used without cooldown
    }
    return false; // Normal cooldown applies
}

function deactivateStaminaMode() {
    isStaminaMode = false;
    staminaCharges = 0;
    stamina = 0; // Reset stamina after using all charges
    
    console.log("Stamina mode ended. Stamina reset to 0.");
    
    // Update UI
    updateStaminaUI();
    
    // Create deactivation effect
    createStaminaDeactivationEffect();
}

function updateHealthBar() {
    const healthValue = document.getElementById('healthValue');
    const healthFill = document.getElementById('healthFill');
    const maxHealth = 100;
    
    if (healthValue && healthFill) {
        healthValue.textContent = Math.max(0, Math.floor(health));
        
        // Calculate percentage and update bar width
        const healthPercentage = Math.max(0, (health / maxHealth) * 100);
        healthFill.style.width = healthPercentage + '%';
        
        // Change color based on health level
        if (healthPercentage > 60) {
            healthFill.style.background = 'linear-gradient(180deg, #ff6b6b 0%, #ee5a52 50%, #dc3545 100%)';
        } else if (healthPercentage > 30) {
            healthFill.style.background = 'linear-gradient(180deg, #ffa500 0%, #ff8c00 50%, #ff7f00 100%)';
        } else {
            healthFill.style.background = 'linear-gradient(180deg, #ff4444 0%, #cc0000 50%, #990000 100%)';
        }
    }
}

function updateStaminaBar() {
    const staminaValue = document.getElementById('staminaValue');
    const staminaFill = document.getElementById('staminaFill');
    const maxStaminaElement = document.getElementById('maxStaminaValue');
    
    if (staminaValue && staminaFill && maxStaminaElement) {
        staminaValue.textContent = stamina;
        maxStaminaElement.textContent = maxStamina;
        
        // Calculate percentage and update bar width
        const staminaPercentage = Math.max(0, (stamina / maxStamina) * 100);
        staminaFill.style.width = staminaPercentage + '%';
        
        // Change color based on stamina mode
        if (isStaminaMode) {
            staminaFill.style.background = 'linear-gradient(180deg, #ffd700 0%, #ffb347 50%, #ff8c00 100%)';
        } else {
            staminaFill.style.background = 'linear-gradient(180deg, #4ecdc4 0%, #45b7aa 50%, #3ba99c 100%)';
        }
    }
}

function updateStaminaUI() {
    // Update the modern stamina bar
    updateStaminaBar();
    
    // Update stamina charges display
    const staminaChargesElement = document.getElementById('staminaCharges');
    if (staminaChargesElement) {
        staminaChargesElement.textContent = staminaCharges;
        
        // Change color based on stamina mode
        if (isStaminaMode) {
            staminaChargesElement.style.color = '#ffff00'; // Yellow when active
            staminaChargesElement.style.fontWeight = 'bold';
        } else {
            staminaChargesElement.style.color = '#ffffff'; // White when inactive
            staminaChargesElement.style.fontWeight = 'normal';
        }
    }
}
    const staminaElement = document.getElementById('stamina');
    const maxStaminaElement = document.getElementById('maxStamina');
    const staminaChargesElement = document.getElementById('staminaCharges');
    
    if (staminaElement) staminaElement.textContent = stamina;
    if (maxStaminaElement) maxStaminaElement.textContent = maxStamina;
    if (staminaChargesElement) {
        staminaChargesElement.textContent = staminaCharges;
        
        // Change color based on stamina mode
        if (isStaminaMode) {
            staminaChargesElement.style.color = '#ffff00'; // Yellow when active
            staminaChargesElement.style.fontWeight = 'bold';
        } else {
            staminaChargesElement.style.color = '#ffffff'; // White when inactive
            staminaChargesElement.style.fontWeight = 'normal';
        }
    }

function createStaminaActivationEffect() {
    if (!player) return;
    
    // Create golden energy explosion
    const effectGeometry = new THREE.RingGeometry(0.5, 4, 24);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffd700, // Gold color
        transparent: true, 
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const staminaEffect = new THREE.Mesh(effectGeometry, effectMaterial);
    staminaEffect.position.copy(player.position);
    staminaEffect.position.y = 0.1;
    staminaEffect.rotation.x = -Math.PI / 2;
    
    scene.add(staminaEffect);
    
    // Create energy particles
    const particles = [];
    for (let i = 0; i < 12; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffd700,
            transparent: true, 
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(player.position);
        
        const angle = (i / 12) * Math.PI * 2;
        particle.position.x += Math.cos(angle) * 2;
        particle.position.z += Math.sin(angle) * 2;
        particle.position.y = 0.5 + Math.random() * 1;
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate stamina activation effect
    let effectTime = 0;
    const animateStaminaEffect = () => {
        effectTime += 16;
        const progress = effectTime / 800; // 800ms effect
        
        // Animate main ring
        staminaEffect.scale.set(1 + progress * 2, 1 + progress * 2, 1);
        staminaEffect.material.opacity = Math.max(0, 0.9 - progress * 0.9);
        staminaEffect.rotation.z += 0.1;
        
        // Animate particles
        particles.forEach((particle, index) => {
            particle.position.y += 0.03;
            particle.material.opacity = Math.max(0, 0.8 - progress * 0.8);
            particle.rotation.y += 0.1;
        });
        
        if (progress < 1) {
            requestAnimationFrame(animateStaminaEffect);
        } else {
            // Clean up effects
            scene.remove(staminaEffect);
            particles.forEach(particle => scene.remove(particle));
        }
    };
    
    animateStaminaEffect();
}

function createStaminaDeactivationEffect() {
    if (!player) return;
    
    // Create fading energy effect
    const effectGeometry = new THREE.RingGeometry(1, 2, 16);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x888888, // Gray color for deactivation
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    const fadeEffect = new THREE.Mesh(effectGeometry, effectMaterial);
    fadeEffect.position.copy(player.position);
    fadeEffect.position.y = 0.1;
    fadeEffect.rotation.x = -Math.PI / 2;
    
    scene.add(fadeEffect);
    
    // Animate fade effect
    let fadeTime = 0;
    const animateFadeEffect = () => {
        fadeTime += 16;
        const progress = fadeTime / 400; // 400ms effect
        
        fadeEffect.scale.set(1 - progress * 0.5, 1 - progress * 0.5, 1);
        fadeEffect.material.opacity = Math.max(0, 0.6 - progress * 0.6);
        
        if (progress < 1) {
            requestAnimationFrame(animateFadeEffect);
        } else {
            scene.remove(fadeEffect);
        }
    };
    
    animateFadeEffect();
}

function spawnMiniBoss() {
    if (miniBossActive) return; // Don't spawn if one already exists
    
    console.log("🔥 MINI BOSS SPAWNING! 🔥");
    console.log("Clearing battlefield of all normal enemies...");
    
    // Clear all existing enemies before spawning mini boss
    enemies.forEach(enemy => {
        if (!enemy.isMiniBoss && enemy.parent) {
            enemy.parent.remove(enemy);
        }
    });
    enemies = []; // Clear the enemies array
    
    miniBossActive = true;
    
    // Create mini boss with larger model
    const miniBossGeometry = new THREE.BoxGeometry(2, 2, 2); // 2x larger than normal enemies
    const miniBossMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, // Red color for mini boss
        transparent: false
    });
    
    miniBoss = new THREE.Mesh(miniBossGeometry, miniBossMaterial);
    
    // Spawn at a distance from player
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDistance = 15;
    const finalPosition = new THREE.Vector3(
        Math.cos(spawnAngle) * spawnDistance,
        1, // Higher Y position for bigger model
        Math.sin(spawnAngle) * spawnDistance
    );
    
    // Start underground for dramatic entrance
    miniBoss.position.copy(finalPosition);
    miniBoss.position.y = -3;
    miniBoss.scale.set(0.1, 0.1, 0.1);
    
    miniBoss.castShadow = true;
    
    // Mini boss stats
    miniBoss.health = 200; // Much more health than normal enemies
    miniBoss.maxHealth = 200;
    miniBoss.type = 'miniboss';
    miniBoss.isMiniBoss = true;
    miniBoss.speed = 0.02; // Slower but more dangerous
    
    // Mini boss attack properties
    miniBoss.attackRange = 4.0; // Longer range
    miniBoss.attackDamage = 40; // Higher damage
    miniBoss.attackCooldown = 2000; // Slower attacks but more powerful
    miniBoss.hitboxType = 'miniboss';
    miniBoss.damageRadius = 3.0;
    
    // Mini boss skills
    miniBoss.skill1Cooldown = 0;
    miniBoss.skill2Cooldown = 0;
    miniBoss.skill1Timer = 5000; // First skill every 5 seconds
    miniBoss.skill2Timer = 8000; // Second skill every 8 seconds
    miniBoss.lastSkill1Time = 0;
    miniBoss.lastSkill2Time = 0;
    
    // Deploy state
    miniBoss.isDeploying = true;
    miniBoss.deployTime = 2000; // Longer deploy time for dramatic effect
    
    // Add to war scene
    if (warScene) {
        warScene.add(miniBoss);
    } else {
        scene.add(miniBoss);
    }
    enemies.push(miniBoss);
    
    // Create dramatic spawn effect
    createMiniBossSpawnEffect(miniBoss, finalPosition);
    
    // Animate deployment
    animateMiniBossDeploy(miniBoss, finalPosition);
    
    console.log("Mini Boss deployed with 200 HP and 2 special skills!");
}

function createMiniBossSpawnEffect(boss, position) {
    // Create dramatic red energy explosion
    const effectGeometry = new THREE.RingGeometry(1, 6, 24);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, // Red color
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const spawnEffect = new THREE.Mesh(effectGeometry, effectMaterial);
    spawnEffect.position.copy(position);
    spawnEffect.position.y = 0.1;
    spawnEffect.rotation.x = -Math.PI / 2;
    
    scene.add(spawnEffect);
    
    // Create fire particles
    const particles = [];
    for (let i = 0; i < 16; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.3, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(0, 1, 0.5 + Math.random() * 0.3),
            transparent: true, 
            opacity: 0.9
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        
        const angle = (i / 16) * Math.PI * 2;
        particle.position.x += Math.cos(angle) * 3;
        particle.position.z += Math.sin(angle) * 3;
        particle.position.y = 0.5 + Math.random() * 2;
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate spawn effect
    let effectTime = 0;
    const animateSpawnEffect = () => {
        effectTime += 16;
        const progress = effectTime / 1200; // 1.2 second effect
        
        // Animate main ring
        spawnEffect.scale.set(1 + progress * 3, 1 + progress * 3, 1);
        spawnEffect.material.opacity = Math.max(0, 0.8 - progress * 0.8);
        spawnEffect.rotation.z += 0.08;
        
        // Animate particles
        particles.forEach((particle, index) => {
            particle.position.y += 0.04;
            particle.material.opacity = Math.max(0, 0.9 - progress * 0.9);
            particle.rotation.y += 0.1;
            particle.scale.multiplyScalar(1.02);
        });
        
        if (progress < 1) {
            requestAnimationFrame(animateSpawnEffect);
        } else {
            // Clean up effects
            scene.remove(spawnEffect);
            particles.forEach(particle => scene.remove(particle));
        }
    };
    
    animateSpawnEffect();
}

function animateMiniBossDeploy(boss, finalPosition) {
    const startTime = Date.now();
    const deployDuration = 2000; // 2 seconds
    
    const animateDeploy = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / deployDuration, 1);
        
        // Dramatic ease-out animation
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        // Animate position (rise from underground)
        boss.position.y = -3 + (finalPosition.y + 3) * easeProgress;
        
        // Animate scale (grow dramatically)
        const scale = 0.1 + 0.9 * easeProgress;
        boss.scale.set(scale, scale, scale);
        
        // Add rotation and screen shake
        boss.rotation.y = (1 - progress) * Math.PI * 4;
        
        // Screen shake during deployment
        if (cameraSystem && progress < 0.8) {
            cameraSystem.shake(0.3, 50);
        }
        
        if (progress < 1) {
            requestAnimationFrame(animateDeploy);
        } else {
            // Deploy complete
            boss.isDeploying = false;
            boss.position.copy(finalPosition);
            boss.scale.set(1, 1, 1);
            boss.rotation.y = 0;
            console.log("🔥 MINI BOSS READY FOR BATTLE! 🔥");
        }
    };
    
    animateDeploy();
}

function createMiniBossDeathEffect(position) {
    // Create massive explosion effect
    const explosionGeometry = new THREE.RingGeometry(2, 8, 32);
    const explosionMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffd700, // Gold color for victory
        transparent: true, 
        opacity: 1.0,
        side: THREE.DoubleSide
    });
    
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    explosion.position.y = 0.1;
    explosion.rotation.x = -Math.PI / 2;
    
    scene.add(explosion);
    
    // Create victory particles
    const particles = [];
    for (let i = 0; i < 20; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(0.15, 1, 0.6 + Math.random() * 0.4),
            transparent: true, 
            opacity: 1.0
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 6;
        particle.position.z += (Math.random() - 0.5) * 6;
        particle.position.y = Math.random() * 3;
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate victory effect
    let effectTime = 0;
    const animateVictoryEffect = () => {
        effectTime += 16;
        const progress = effectTime / 1500; // 1.5 second effect
        
        // Animate explosion
        explosion.scale.set(1 + progress * 4, 1 + progress * 4, 1);
        explosion.material.opacity = Math.max(0, 1.0 - progress);
        explosion.rotation.z += 0.05;
        
        // Animate particles
        particles.forEach(particle => {
            particle.position.y += 0.05;
            particle.material.opacity = Math.max(0, 1.0 - progress);
            particle.rotation.x += 0.1;
            particle.rotation.y += 0.1;
        });
        
        if (progress < 1) {
            requestAnimationFrame(animateVictoryEffect);
        } else {
            // Clean up effects
            scene.remove(explosion);
            particles.forEach(particle => scene.remove(particle));
        }
    };
    
    animateVictoryEffect();
}

function updateMiniBossUI() {
    const miniBossProgressElement = document.getElementById('miniBossProgress');
    if (miniBossProgressElement) {
        if (miniBossActive) {
            miniBossProgressElement.textContent = 'BOSS ACTIVE!';
            miniBossProgressElement.style.color = '#ff0000';
            miniBossProgressElement.style.fontWeight = 'bold';
        } else {
            miniBossProgressElement.textContent = normalEnemyKills;
            miniBossProgressElement.style.color = '#ffffff';
            miniBossProgressElement.style.fontWeight = 'normal';
        }
    }
}

function createProgressionPortal(position) {
    if (currentLevel >= maxLevel) {
        console.log("🎉 CONGRATULATIONS! You've completed all levels! 🎉");
        return;
    }
    
    console.log(`🌟 Creating portal to Level ${currentLevel + 1}! 🌟`);
    
    // Create progression portal
    const portalGeometry = new THREE.RingGeometry(2, 3.5, 24);
    const portalMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff88, // Green-cyan color for progression
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    nextLevelPortal = new THREE.Mesh(portalGeometry, portalMaterial);
    nextLevelPortal.position.copy(position);
    nextLevelPortal.position.y = 0.1;
    nextLevelPortal.rotation.x = -Math.PI / 2;
    
    scene.add(nextLevelPortal);
    
    // Create portal center effect
    const centerGeometry = new THREE.CircleGeometry(2, 24);
    const centerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff88,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    
    const portalCenter = new THREE.Mesh(centerGeometry, centerMaterial);
    portalCenter.position.copy(position);
    portalCenter.position.y = 0.12;
    portalCenter.rotation.x = -Math.PI / 2;
    
    scene.add(portalCenter);
    
    // Store portal data for collision detection
    if (!window.progressionPortals) window.progressionPortals = [];
    window.progressionPortals.push({
        position: position.clone(),
        radius: 3.5,
        ring: nextLevelPortal,
        center: portalCenter,
        targetLevel: currentLevel + 1
    });
    
    // Animate portal
    animateProgressionPortal(nextLevelPortal, portalCenter);
    
    console.log("Step into the portal to advance to the next level!");
}

function animateProgressionPortal(ring, center) {
    const animatePortal = () => {
        if (ring && ring.parent && center && center.parent) {
            // Rotate portal rings
            ring.rotation.z += 0.03;
            center.rotation.z -= 0.02;
            
            // Pulse opacity
            const time = Date.now() * 0.002;
            ring.material.opacity = 0.8 + Math.sin(time) * 0.2;
            center.material.opacity = 0.4 + Math.sin(time * 1.2) * 0.1;
            
            requestAnimationFrame(animatePortal);
        }
    };
    
    animatePortal();
}

function checkProgressionPortalCollision() {
    if (!player || !window.progressionPortals) return;
    
    window.progressionPortals.forEach((portal, index) => {
        const distance = player.position.distanceTo(portal.position);
        
        if (distance <= portal.radius) {
            console.log(`🌟 Advancing to Level ${portal.targetLevel}! 🌟`);
            
            // Clean up current portal
            if (portal.ring && portal.ring.parent) {
                portal.ring.parent.remove(portal.ring);
            }
            if (portal.center && portal.center.parent) {
                portal.center.parent.remove(portal.center);
            }
            
            // Remove portal from array
            window.progressionPortals.splice(index, 1);
            
            // Advance to next level
            advanceToNextLevel();
        }
    });
}

function advanceToNextLevel() {
    currentLevel++;
    
    console.log(`🎮 Welcome to Level ${currentLevel}! 🎮`);
    
    // Update UI
    updateLevelUI();
    
    // Create teleport effect
    createLevelTransitionEffect();
    
    // Create new level scene (copy of war scene with modifications)
    createNextLevelScene();
    
    // Reset player position
    player.position.set(0, 0.5, 0);
    
    // Reset progression counters
    normalEnemyKills = 0;
    stamina = 0;
    staminaCharges = 0;
    isStaminaMode = false;
    
    // Update all UI elements
    updateStaminaUI();
    updateMiniBossUI();
    updateLevelUI();
    
    // Spawn new enemies for the new level
    setTimeout(() => {
        createEnemies();
    }, 1000); // Delay to let transition effect play
}

function createNextLevelScene() {
    // For now, we'll modify the existing war scene with level-specific changes
    // In a full implementation, you could create entirely different scenes
    
    // Change background color based on level
    const levelColors = [
        0x1a1a2e, // Level 1 - Dark blue (original)
        0x2e1a1a, // Level 2 - Dark red
        0x1a2e1a, // Level 3 - Dark green
        0x2e2e1a, // Level 4 - Dark yellow
        0x2e1a2e  // Level 5 - Dark purple
    ];
    
    if (warScene && currentLevel <= levelColors.length) {
        warScene.background = new THREE.Color(levelColors[currentLevel - 1]);
        console.log(`Level ${currentLevel} environment created with new atmosphere`);
    }
    
    // Increase enemy difficulty based on level
    miniBossSpawnThreshold = Math.max(40, 65 - (currentLevel - 1) * 5); // Faster mini boss spawns
    console.log(`Level ${currentLevel}: Mini boss spawns after ${miniBossSpawnThreshold} kills`);
}

function createLevelTransitionEffect() {
    if (!player) return;
    
    // Create level transition effect
    const transitionGeometry = new THREE.RingGeometry(0.5, 8, 32);
    const transitionMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff88,
        transparent: true, 
        opacity: 1.0,
        side: THREE.DoubleSide
    });
    
    const transitionEffect = new THREE.Mesh(transitionGeometry, transitionMaterial);
    transitionEffect.position.copy(player.position);
    transitionEffect.position.y = 0.1;
    transitionEffect.rotation.x = -Math.PI / 2;
    
    scene.add(transitionEffect);
    
    // Create level up particles
    const particles = [];
    for (let i = 0; i < 24; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff88,
            transparent: true, 
            opacity: 1.0
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(player.position);
        
        const angle = (i / 24) * Math.PI * 2;
        particle.position.x += Math.cos(angle) * 4;
        particle.position.z += Math.sin(angle) * 4;
        particle.position.y = 0.5 + Math.random() * 2;
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate transition effect
    let effectTime = 0;
    const animateTransition = () => {
        effectTime += 16;
        const progress = effectTime / 1500; // 1.5 second effect
        
        // Animate main ring
        transitionEffect.scale.set(1 + progress * 4, 1 + progress * 4, 1);
        transitionEffect.material.opacity = Math.max(0, 1.0 - progress);
        transitionEffect.rotation.z += 0.1;
        
        // Animate particles
        particles.forEach((particle, index) => {
            particle.position.y += 0.06;
            particle.material.opacity = Math.max(0, 1.0 - progress);
            particle.rotation.y += 0.15;
        });
        
        if (progress < 1) {
            requestAnimationFrame(animateTransition);
        } else {
            // Clean up effects
            scene.remove(transitionEffect);
            particles.forEach(particle => scene.remove(particle));
        }
    };
    
    animateTransition();
    
    // Add camera shake for dramatic effect
    if (cameraSystem) {
        cameraSystem.shake(0.8, 800);
    }
}

function updateLevelUI() {
    const currentLevelElement = document.getElementById('currentLevel');
    const maxLevelElement = document.getElementById('maxLevel');
    
    if (currentLevelElement) currentLevelElement.textContent = currentLevel;
    if (maxLevelElement) maxLevelElement.textContent = maxLevel;
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
            // Enhanced chain lightning with visual effects
            const chainRange = 4; // Range for each chain jump
            const maxChains = 3; // Maximum number of chain jumps
            const chainDamage = 15; // Damage per chain
            
            // Create sample lightning effects around the hit enemy first
            createSampleLightning(enemy.position);
            
            // Start chaining from the hit enemy
            let currentTarget = enemy;
            let chainCount = 0;
            const hitTargets = new Set([enemy]); // Track hit enemies to avoid double-hitting
            
            while (chainCount < maxChains && currentTarget) {
                let nextTarget = null;
                let closestDistance = Infinity;
                
                // Find the next enemy to chain to
                enemies.forEach(otherEnemy => {
                    if (!hitTargets.has(otherEnemy)) {
                        const distance = currentTarget.position.distanceTo(otherEnemy.position);
                        
                        // Check if enemy is within chain range
                        if (distance <= chainRange && distance < closestDistance) {
                            closestDistance = distance;
                            nextTarget = otherEnemy;
                        }
                    }
                });
                
                if (nextTarget) {
                    // Damage the next target
                    nextTarget.health -= chainDamage;
                    hitTargets.add(nextTarget);
                    
                    // Record enemy hit for stamina decay system
                    recordEnemyHit();
                    
                    // Create visual chain lightning effect
                    createChainLightning(currentTarget.position, nextTarget.position);
                    
                    // Create sample lightning at the new target
                    setTimeout(() => {
                        createSampleLightning(nextTarget.position);
                    }, chainCount * 100); // Stagger the effects
                    
                    console.log(`Chain lightning ${chainCount + 1}: ${chainDamage} damage to enemy at distance ${closestDistance.toFixed(2)}`);
                    
                    // Move to next target
                    currentTarget = nextTarget;
                    chainCount++;
                } else {
                    // No more valid targets
                    break;
                }
            }
            break;
        case 'earth':
            // Enhanced knockback with earth effects
            const direction = new THREE.Vector3();
            direction.subVectors(enemy.position, player.position);
            direction.normalize();
            direction.multiplyScalar(2.5); // Stronger knockback
            enemy.position.add(direction);
            
            // Create small earth burst at enemy
            createMiniEarthBurst(enemy.position);
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

function createSampleLightning(position) {
    // Create multiple lightning bolts around the hit enemy
    const lightningCount = 5;
    const effects = [];
    
    for (let i = 0; i < lightningCount; i++) {
        const angle = (i / lightningCount) * Math.PI * 2;
        const radius = 1.5 + Math.random() * 1; // Random radius between 1.5 and 2.5
        const height = 3 + Math.random() * 2; // Random height between 3 and 5
        
        // Calculate lightning bolt position
        const lightningPos = position.clone();
        lightningPos.x += Math.cos(angle) * radius;
        lightningPos.z += Math.sin(angle) * radius;
        
        // Create lightning bolt geometry
        const lightningGeometry = new THREE.CylinderGeometry(0.03, 0.03, height);
        const lightningMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.8 + Math.random() * 0.2 // Slight opacity variation
        });
        
        const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
        lightning.position.copy(lightningPos);
        lightning.position.y = height / 2;
        
        // Add slight random rotation for more natural look
        lightning.rotation.x = (Math.random() - 0.5) * 0.3;
        lightning.rotation.z = (Math.random() - 0.5) * 0.3;
        
        scene.add(lightning);
        effects.push(lightning);
        
        // Animate lightning bolt
        const animateLightning = () => {
            let opacity = lightning.material.opacity;
            opacity -= 0.05;
            lightning.material.opacity = Math.max(0, opacity);
            
            // Add flickering effect
            if (Math.random() < 0.3) {
                lightning.material.opacity *= 0.5;
            }
            
            if (opacity > 0) {
                requestAnimationFrame(animateLightning);
            } else {
                if (lightning.parent) scene.remove(lightning);
            }
        };
        
        // Start animation with slight delay for each bolt
        setTimeout(() => {
            animateLightning();
        }, i * 50);
    }
    
    // Create central electric sphere
    const sphereGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 1.0
    });
    
    const electricSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    electricSphere.position.copy(position);
    electricSphere.position.y = 0.5;
    
    scene.add(electricSphere);
    
    // Animate electric sphere
    let sphereTime = 0;
    const animateSphere = () => {
        sphereTime += 16;
        const progress = sphereTime / 800; // 800ms duration
        
        // Pulsing effect
        const scale = 1 + Math.sin(sphereTime * 0.02) * 0.3;
        electricSphere.scale.set(scale, scale, scale);
        
        // Fade out
        electricSphere.material.opacity = Math.max(0, 1 - progress);
        
        // Color shift from white to cyan
        const colorProgress = Math.min(1, progress * 2);
        electricSphere.material.color.setRGB(
            1 - colorProgress * 0.5,
            1 - colorProgress * 0.5,
            1
        );
        
        if (progress < 1) {
            requestAnimationFrame(animateSphere);
        } else {
            if (electricSphere.parent) scene.remove(electricSphere);
        }
    };
    
    animateSphere();
    
    // Create electric particles
    for (let i = 0; i < 8; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        particle.position.y = 0.3;
        
        // Random velocity for particles
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 2 + 1,
            (Math.random() - 0.5) * 4
        );
        
        scene.add(particle);
        
        // Animate particles
        let particleTime = 0;
        const animateParticle = () => {
            particleTime += 16;
            const progress = particleTime / 600; // 600ms duration
            
            // Move particle
            particle.position.add(velocity.clone().multiplyScalar(0.016));
            
            // Apply gravity
            velocity.y -= 0.1;
            
            // Fade out
            particle.material.opacity = Math.max(0, 0.8 - progress * 0.8);
            
            if (progress < 1 && particle.position.y > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                if (particle.parent) scene.remove(particle);
            }
        };
        
        // Start particle animation with slight delay
        setTimeout(() => {
            animateParticle();
        }, i * 25);
    }
}

function createChainLightning(fromPos, toPos) {
    // Create lightning bolt between two positions
    const direction = new THREE.Vector3().subVectors(toPos, fromPos);
    const distance = direction.length();
    const midPoint = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
    
    // Create lightning bolt geometry
    const lightningGeometry = new THREE.CylinderGeometry(0.05, 0.05, distance);
    const lightningMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.9
    });
    
    const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
    lightning.position.copy(midPoint);
    lightning.position.y = 0.5;
    
    // Orient lightning bolt towards target
    lightning.lookAt(toPos);
    lightning.rotateX(Math.PI / 2);
    
    scene.add(lightning);
    
    // Add electric spark at target
    const sparkGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const sparkMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 1.0
    });
    
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    spark.position.copy(toPos);
    spark.position.y = 0.5;
    
    scene.add(spark);
    
    // Remove effects after short duration
    setTimeout(() => {
        if (lightning.parent) scene.remove(lightning);
        if (spark.parent) scene.remove(spark);
    }, 300);
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
        
        // Mini boss special AI
        if (enemy.isMiniBoss) {
            updateMiniBossAI(enemy);
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
            
            // Debug: Log enemy movement occasionally
            if (Math.random() < 0.01) { // 1% chance to log per frame
                console.log(`Enemy ${enemy.type} moving toward player. Distance: ${distanceToPlayer.toFixed(2)}, Range: ${enemy.attackRange}`);
            }
        } else {
            // In attack range - try to attack
            const currentTime = Date.now();
            const timeSinceLastAttack = currentTime - enemy.lastAttackTime;
            
            // Debug logging for attack attempts
            if (timeSinceLastAttack >= enemy.attackCooldown) {
                console.log(`Enemy ${enemy.type} attacking player! Distance: ${distanceToPlayer.toFixed(2)}, Range: ${enemy.attackRange}`);
                enemyAttack(enemy);
                enemy.lastAttackTime = currentTime;
            } else {
                // Log when enemy is in range but on cooldown (occasionally)
                if (Math.random() < 0.02) { // 2% chance to log per frame
                    console.log(`Enemy ${enemy.type} in range but on cooldown. Time left: ${(enemy.attackCooldown - timeSinceLastAttack).toFixed(0)}ms`);
                }
            }
        }
        
        enemy.position.y = 0.4; // Keep cubes at proper height
    });
}

function updateMiniBossAI(miniBoss) {
    const currentTime = Date.now();
    const direction = new THREE.Vector3();
    direction.subVectors(player.position, miniBoss.position);
    const distanceToPlayer = direction.length();
    direction.normalize();
    
    // Mini boss movement (slower but more deliberate)
    if (distanceToPlayer > miniBoss.attackRange) {
        direction.multiplyScalar(miniBoss.speed);
        miniBoss.position.add(direction);
    }
    
    // Keep mini boss at proper height
    miniBoss.position.y = 1;
    
    // Check for skill usage
    if (currentTime - miniBoss.lastSkill1Time >= miniBoss.skill1Timer) {
        useMiniBossSkill1(miniBoss);
        miniBoss.lastSkill1Time = currentTime;
    }
    
    if (currentTime - miniBoss.lastSkill2Time >= miniBoss.skill2Timer) {
        useMiniBossSkill2(miniBoss);
        miniBoss.lastSkill2Time = currentTime;
    }
    
    // Regular attack
    if (distanceToPlayer <= miniBoss.attackRange) {
        if (currentTime - miniBoss.lastAttackTime >= miniBoss.attackCooldown) {
            enemyAttack(miniBoss);
            miniBoss.lastAttackTime = currentTime;
        }
    }
}

function useMiniBossSkill1(miniBoss) {
    console.log("🔥 Mini Boss Skill 1: Fire Wave! 🔥");
    
    // 🏠 HOME DIMENSION PROTECTION - No mini boss attacks in home
    if (currentDimension === 'home') {
        console.log("🏠 Mini boss skill blocked - player is safe in home dimension!");
        return;
    }
    
    // Create expanding fire wave
    const waveGeometry = new THREE.RingGeometry(1, 8, 24);
    const waveMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4400,
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const fireWave = new THREE.Mesh(waveGeometry, waveMaterial);
    fireWave.position.copy(miniBoss.position);
    fireWave.position.y = 0.1;
    fireWave.rotation.x = -Math.PI / 2;
    
    scene.add(fireWave);
    
    // Check for player damage
    const distanceToPlayer = miniBoss.position.distanceTo(player.position);
    if (distanceToPlayer <= 8 && !isDodging && !player.userData.invincible) {
        // Player takes heavy damage
        health -= 50;
        updateHealthBar();
        console.log("Player hit by Fire Wave for 50 damage!");
        
        // Visual feedback
        if (cameraSystem) {
            cameraSystem.shake(0.6, 300);
        }
        
        // Player flash effect
        const originalColor = player.material.color.clone();
        player.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (player.material) {
                player.material.color.copy(originalColor);
            }
        }, 150);
        
        // Check for death
        if (health <= 0) {
            handlePlayerDeath();
        }
    }
    
    // Animate fire wave
    let waveTime = 0;
    const animateWave = () => {
        waveTime += 16;
        const progress = waveTime / 1000; // 1 second expansion
        
        fireWave.scale.set(1 + progress * 2, 1 + progress * 2, 1);
        fireWave.material.opacity = Math.max(0, 0.7 - progress * 0.7);
        fireWave.rotation.z += 0.05;
        
        if (progress < 1) {
            requestAnimationFrame(animateWave);
        } else {
            scene.remove(fireWave);
        }
    };
    
    animateWave();
}

function useMiniBossSkill2(miniBoss) {
    console.log("⚡ Mini Boss Skill 2: Lightning Barrage! ⚡");
    
    // 🏠 HOME DIMENSION PROTECTION - No mini boss attacks in home
    if (currentDimension === 'home') {
        console.log("🏠 Mini boss skill blocked - player is safe in home dimension!");
        return;
    }
    
    // Create multiple lightning strikes around player
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const angle = (i / 5) * Math.PI * 2;
            const strikePos = player.position.clone();
            strikePos.x += Math.cos(angle) * 3;
            strikePos.z += Math.sin(angle) * 3;
            
            // Create lightning bolt
            const lightningGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8);
            const lightningMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff,
                transparent: true, 
                opacity: 0.9
            });
            
            const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
            lightning.position.copy(strikePos);
            lightning.position.y = 4;
            
            scene.add(lightning);
            
            // Check for player damage
            const distanceToStrike = player.position.distanceTo(strikePos);
            if (distanceToStrike <= 2 && !isDodging && !player.userData.invincible) {
                // Player takes damage
                health -= 30;
                updateHealthBar();
                console.log("Player hit by Lightning Strike for 30 damage!");
                
                // Visual feedback
                if (cameraSystem) {
                    cameraSystem.shake(0.4, 200);
                }
                
                // Check for death
                if (health <= 0) {
                    handlePlayerDeath();
                }
            }
            
            // Remove lightning after short time
            setTimeout(() => {
                if (lightning.parent) {
                    scene.remove(lightning);
                }
            }, 300);
            
        }, i * 200); // Stagger the strikes
    }
}

function enemyAttack(enemy) {
    console.log(`Enemy ${enemy.type} attempting attack. Distance to player: ${enemy.position.distanceTo(player.position).toFixed(2)}`);
    
    // 🏠 HOME DIMENSION PROTECTION - No enemy attacks can damage player in home
    if (currentDimension === 'home') {
        console.log("🏠 Player is safe in home dimension - enemy attack blocked!");
        return; // No damage in peaceful home dimension
    }
    
    if (isDodging) {
        console.log("Player dodged enemy attack!");
        return; // Player is dodging, attack misses
    }
    
    const distanceToPlayer = enemy.position.distanceTo(player.position);
    
    // Check if player is within attack range
    if (distanceToPlayer > enemy.attackRange) {
        console.log(`Enemy out of attack range. Distance: ${distanceToPlayer.toFixed(2)}, Range: ${enemy.attackRange}`);
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
                console.log(`Precise attack hit! Distance: ${distanceToPlayer.toFixed(2)}, Damage radius: ${enemy.damageRadius}`);
            }
            break;
            
        case 'circle':
            // Normal enemies - area attack around them
            if (distanceToPlayer <= enemy.damageRadius) {
                hitPlayer = true;
                console.log(`Circle attack hit! Distance: ${distanceToPlayer.toFixed(2)}, Damage radius: ${enemy.damageRadius}`);
            }
            break;
            
        case 'curve':
            // Curve enemies - sweeping curve attack
            const curveHit = calculateEnemyCurveAttack(enemy, player.position);
            if (curveHit.hit) {
                hitPlayer = true;
                damageMultiplier = curveHit.damageMultiplier;
                console.log(`Curve attack hit! Multiplier: ${damageMultiplier.toFixed(2)}`);
            }
            break;
            
        case 'miniboss':
            // Mini boss attacks - larger area attack
            if (distanceToPlayer <= enemy.damageRadius) {
                hitPlayer = true;
                console.log(`Mini boss attack hit! Distance: ${distanceToPlayer.toFixed(2)}, Damage radius: ${enemy.damageRadius}`);
            }
            break;
    }
    
    console.log(`Enemy attack attempt: Type=${enemy.hitboxType}, Distance=${distanceToPlayer.toFixed(2)}, Hit=${hitPlayer}`);
    
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
        updateHealthBar();
        
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
            handlePlayerDeath();
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

function handlePlayerDeath() {
    console.log("💀 Player has died! 💀");
    
    // Create death effect at death position
    createDeathEffect();
    
    // Start the dramatic death transition
    startDeathTransition();
    
    console.log("Death transition started - screen will fade to black");
}

function startDeathTransition() {
    // Disable player controls during death transition
    gameState = 'dying';
    
    // Add red flash effect first
    createRedFlashEffect();
    
    // Start fade to black after brief delay
    setTimeout(() => {
        const deathOverlay = document.getElementById('deathOverlay');
        deathOverlay.classList.add('death-fade');
    }, 500); // Small delay after red flash
    
    // Add dramatic camera shake
    if (cameraSystem) {
        cameraSystem.shake(1.0, 2000);
    }
    
    // After fade completes, show death scene
    setTimeout(() => {
        showDeathScene();
    }, 3500); // 3.5 seconds total (500ms delay + 3000ms fade)
    
    console.log("Screen fading to black...");
}

function createRedFlashEffect() {
    // Create red flash overlay
    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'absolute';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100%';
    flashOverlay.style.height = '100%';
    flashOverlay.style.background = 'rgba(255, 0, 0, 0.8)';
    flashOverlay.style.zIndex = '499';
    flashOverlay.style.pointerEvents = 'none';
    flashOverlay.style.opacity = '1';
    flashOverlay.style.transition = 'opacity 0.5s ease-out';
    
    document.getElementById('gameContainer').appendChild(flashOverlay);
    
    // Fade out the red flash
    setTimeout(() => {
        flashOverlay.style.opacity = '0';
        
        // Remove the flash element after fade
        setTimeout(() => {
            if (flashOverlay.parentNode) {
                flashOverlay.parentNode.removeChild(flashOverlay);
            }
        }, 500);
    }, 100); // Very brief red flash
    
    console.log("Red flash effect triggered");
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

function updateStaminaDecay() {
    const currentTime = Date.now();
    
    // Only decay stamina if we have some and we're not in stamina mode
    if (stamina > 0 && !isStaminaMode && currentDimension === 'war') {
        // Check if enough time has passed since last enemy hit
        const timeSinceLastHit = currentTime - lastEnemyHitTime;
        
        // Debug logging every 5 seconds
        if (Math.floor(timeSinceLastHit / 5000) > Math.floor((timeSinceLastHit - 16) / 5000)) {
            console.log(`Stamina decay check: ${Math.floor(timeSinceLastHit / 1000)}s since last hit (need ${staminaDecayDelay / 1000}s)`);
        }
        
        if (timeSinceLastHit >= staminaDecayDelay) {
            // Check if enough time has passed since last decay
            const timeSinceLastDecay = currentTime - lastStaminaDecayTime;
            
            if (timeSinceLastDecay >= staminaDecayRate) {
                // Decay stamina by 1 point
                stamina = Math.max(0, stamina - 1);
                lastStaminaDecayTime = currentTime;
                
                console.log(`🔻 Stamina decayed to ${stamina} (no enemy hits for ${Math.floor(timeSinceLastHit / 1000)}s)`);
                
                // Update UI
                updateStaminaUI();
                
                // Create visual effect for stamina decay
                createStaminaDecayEffect();
            }
        }
    } else if (stamina > 0) {
        // Debug why decay isn't happening
        const reasons = [];
        if (isStaminaMode) reasons.push("in stamina mode");
        if (currentDimension !== 'war') reasons.push(`in ${currentDimension} dimension`);
        
        // Log once every 10 seconds when conditions aren't met
        const timeSinceLastHit = currentTime - lastEnemyHitTime;
        if (Math.floor(timeSinceLastHit / 10000) > Math.floor((timeSinceLastHit - 16) / 10000)) {
            console.log(`Stamina decay disabled: ${reasons.join(', ')}`);
        }
    }
}

function createStaminaDecayEffect() {
    if (!player) return;
    
    // Create red decay effect around player
    const decayGeometry = new THREE.RingGeometry(0.5, 2, 16);
    const decayMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4444, // Red color for decay
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    const decayEffect = new THREE.Mesh(decayGeometry, decayMaterial);
    decayEffect.position.copy(player.position);
    decayEffect.position.y = 0.1;
    decayEffect.rotation.x = -Math.PI / 2;
    
    scene.add(decayEffect);
    
    // Animate decay effect
    let effectTime = 0;
    const animateDecay = () => {
        effectTime += 16;
        const progress = effectTime / 600; // 600ms effect
        
        // Shrink and fade
        const scale = 1 - progress * 0.5;
        decayEffect.scale.set(scale, scale, 1);
        decayEffect.material.opacity = Math.max(0, 0.6 - progress * 0.6);
        decayEffect.rotation.z -= 0.05; // Rotate opposite to stamina gain
        
        if (progress < 1) {
            requestAnimationFrame(animateDecay);
        } else {
            if (decayEffect.parent) scene.remove(decayEffect);
        }
    };
    
    animateDecay();
}

function recordEnemyHit() {
    // Record the time when an enemy was hit
    lastEnemyHitTime = Date.now();
    
    // Reset decay timer
    lastStaminaDecayTime = Date.now();
    
    console.log(`🎯 Enemy hit recorded - stamina decay timer reset`);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Only run game logic when actually playing (not during death transition)
    if (gameState !== 'playing' && gameState !== 'dying') {
        return;
    }
    
    // During dying state, only update camera and render (no game logic)
    if (gameState === 'dying') {
        if (cameraSystem) {
            cameraSystem.update();
        }
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        return;
    }
    
    // Update game logic
    handleMovement();
    updateEnemies();
    checkPortalCollision();
    checkProgressionPortalCollision();
    updatePortalEffects();
    
    // Update camera system
    if (cameraSystem) {
        cameraSystem.update();
    }
    
    // Update cooldowns
    if (attackCooldown > 0) {
        attackCooldown -= 16; // Approximate frame time
    }
    
    if (abilityCooldown > 0) {
        abilityCooldown -= 16;
        if (abilityCooldown <= 0) {
            if (isStaminaMode) {
                document.getElementById('abilityStatus').textContent = 'STAMINA MODE!';
            } else {
                document.getElementById('abilityStatus').textContent = 'Ready';
            }
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
    
    // Update stamina decay system
    updateStaminaDecay();
    
    // Render the scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Start the app when page loads
window.addEventListener('load', () => {
    console.log("Window loaded, checking Three.js...");
    
    if (typeof THREE === 'undefined') {
        console.error("THREE.js is not loaded!");
        alert("Game failed to load: THREE.js library missing");
        return;
    }
    
    console.log("THREE.js loaded successfully, initializing app...");
    initializeApp();
});

// Also try DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, setting up fallback initialization...");
    
    // If the game hasn't started after 2 seconds, try again
    setTimeout(() => {
        if (!window.gameInitialized) {
            console.log("Game not initialized yet, trying fallback...");
            if (typeof THREE !== 'undefined') {
                initializeApp();
            } else {
                console.error("THREE.js still not available");
            }
        }
    }, 2000);
});

// Debug function to test buttons (can be called from console)
window.testButtons = function() {
    console.log("=== BUTTON TEST ===");
    
    const buttons = [
        'playButton',
        'settingsButton', 
        'quitButton',
        'backToMenuButton',
        'muteButton',
        'respawnButton',
        'returnToMenuButton',
        'introSkip'
    ];
    
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            console.log(`✅ ${buttonId}: Found`);
            // Test click
            try {
                button.click();
                console.log(`✅ ${buttonId}: Click works`);
            } catch (error) {
                console.log(`❌ ${buttonId}: Click error:`, error);
            }
        } else {
            console.log(`❌ ${buttonId}: NOT FOUND`);
        }
    });
    
    console.log("=== END BUTTON TEST ===");
};