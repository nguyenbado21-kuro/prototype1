/**
 * Game Configuration - Central config for all game systems
 */
export const GameConfig = {
    // Core gameplay settings
    gameplay: {
        maxHealth: 100,
        dodgeDuration: 300,
        dodgeDistance: 3,
        dodgeCooldown: 1000,
        invulnerabilityFrames: 200
    },

    // Immortal configurations
    immortals: {
        flame: {
            name: 'Flame',
            color: 0xff4444,
            maxHealth: 100,
            attackDamage: 30,
            attackRange: 3,
            attackCooldown: 400,
            moveSpeed: 0.12,
            abilities: [
                {
                    name: 'flameBurst',
                    cooldown: 2000,
                    range: 6,
                    damage: 50
                }
            ]
        },
        storm: {
            name: 'Storm',
            color: 0x4444ff,
            maxHealth: 90,
            attackDamage: 20,
            attackRange: 8,
            attackCooldown: 300,
            moveSpeed: 0.15,
            abilities: [
                {
                    name: 'lightningStrike',
                    cooldown: 3000,
                    range: 15,
                    damage: 80
                }
            ]
        },
        earth: {
            name: 'Earth',
            color: 0x8b4513,
            maxHealth: 120,
            attackDamage: 40,
            attackRange: 2,
            attackCooldown: 800,
            moveSpeed: 0.08,
            abilities: [
                {
                    name: 'stoneShield',
                    cooldown: 4000,
                    duration: 1000,
                    knockbackRange: 4
                }
            ]
        },
        shadow: {
            name: 'Shadow',
            color: 0x444444,
            maxHealth: 85,
            attackDamage: 35,
            attackRange: 2.5,
            attackCooldown: 250,
            moveSpeed: 0.18,
            abilities: [
                {
                    name: 'shadowStrike',
                    cooldown: 1500,
                    damage: 100,
                    teleportRange: 10
                }
            ]
        }
    },

    // Enemy configurations
    enemies: {
        basic: {
            baseHealth: 60,
            baseDamage: 15,
            moveSpeed: 0.025,
            attackCooldown: 1000,
            eliteModifier: 1.0
        },
        fast: {
            baseHealth: 40,
            baseDamage: 12,
            moveSpeed: 0.04,
            attackCooldown: 800,
            eliteModifier: 1.0
        },
        heavy: {
            baseHealth: 100,
            baseDamage: 25,
            moveSpeed: 0.015,
            attackCooldown: 1500,
            eliteModifier: 1.0
        },
        elite: {
            baseHealth: 80,
            baseDamage: 20,
            moveSpeed: 0.03,
            attackCooldown: 1000,
            eliteModifier: 1.8
        }
    },

    // Boss configurations
    bosses: {
        frostGuardian: {
            name: 'Frost Guardian',
            baseHealth: 500,
            baseDamage: 30,
            phases: [
                { triggerHealth: 1.0, name: 'aggressive' },
                { triggerHealth: 0.6, name: 'defensive' },
                { triggerHealth: 0.3, name: 'berserk' }
            ]
        },
        shadowLord: {
            name: 'Shadow Lord',
            baseHealth: 600,
            baseDamage: 35,
            phases: [
                { triggerHealth: 1.0, name: 'stealth' },
                { triggerHealth: 0.5, name: 'summons' },
                { triggerHealth: 0.2, name: 'desperation' }
            ]
        },
        northernMonster: {
            name: 'Northern Monster',
            baseHealth: 1000,
            baseDamage: 50,
            phases: [
                { triggerHealth: 1.0, name: 'awakening' },
                { triggerHealth: 0.7, name: 'corruption' },
                { triggerHealth: 0.4, name: 'fury' },
                { triggerHealth: 0.1, name: 'despair' }
            ],
            isAdaptive: true
        }
    },

    // Difficulty scaling
    difficulty: {
        zoneFactor: 0.25,
        bossFactor: 0.4,
        healthScaling: 0.6,
        damageScaling: 0.45,
        powerReduction: 0.08,
        eliteModifiers: {
            normal: 1.0,
            elite: { min: 1.5, max: 2.2 },
            miniboss: { min: 2.5, max: 3.0 }
        }
    },

    // Progression system
    progression: {
        metaCurrency: {
            baseReward: 10,
            zoneBonus: 5,
            bossBonus: 15,
            victoryBonus: 50,
            performanceBonuses: {
                highDamage: { threshold: 1000, reward: 10 },
                lowDamageTaken: { threshold: 200, reward: 15 }
            }
        },
        unlockThresholds: {
            advancedAbilities: 5, // runs per immortal
            masterAbilities: 3,   // victories per immortal
            difficultyModifiers: 1, // total victories
            specialWeapons: 10,   // total runs
            resilenceBlessings: 5 // total deaths
        }
    },

    // Visual and audio settings
    graphics: {
        shadowMapSize: 2048,
        ambientLightIntensity: 0.4,
        directionalLightIntensity: 0.8,
        effectFadeSpeed: 0.05,
        cameraFollowDistance: 10,
        cameraHeight: 5
    },

    // Input settings
    input: {
        keyBindings: {
            moveUp: ['KeyW', 'ArrowUp'],
            moveDown: ['KeyS', 'ArrowDown'],
            moveLeft: ['KeyA', 'ArrowLeft'],
            moveRight: ['KeyD', 'ArrowRight'],
            dodge: ['Space'],
            immortal1: ['Digit1'],
            immortal2: ['Digit2'],
            immortal3: ['Digit3'],
            immortal4: ['Digit4']
        },
        mouseBindings: {
            attack: 0, // Left click
            ability: 2  // Right click
        }
    },

    // Performance settings
    performance: {
        maxEnemies: 15,
        maxParticles: 50,
        cullDistance: 30,
        updateFrequency: 60 // FPS target
    }
};

export default GameConfig;