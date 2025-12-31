/**
 * Core Game Manager - Handles main game loop and state
 */
export class GameManager {
    constructor() {
        this.currentRun = null;
        this.globalDifficulty = 1.0;
        this.zoneIndex = 1;
        this.bossCount = 0;
        this.gameState = 'menu'; // menu, playing, paused, gameOver
    }

    startNewRun(immortalType) {
        this.currentRun = {
            immortal: immortalType,
            zone: 1,
            bossesDefeated: 0,
            blessings: [],
            relics: [],
            startTime: Date.now()
        };
        
        this.calculateGlobalDifficulty();
        this.gameState = 'playing';
    }

    calculateGlobalDifficulty() {
        // GD = 1 + (ZoneIndex × ZF) + (BossCount × BF)
        const ZF = 0.25; // Zone Factor
        const BF = 0.4;  // Boss Factor
        
        this.globalDifficulty = 1 + (this.zoneIndex * ZF) + (this.bossCount * BF);
    }

    endRun(victory = false) {
        // Handle meta progression
        this.gameState = 'gameOver';
        // Save run data for progression
    }
}