/**
 * Meta Progression System - Handles permanent unlocks and progression
 */
export class ProgressionSystem {
    constructor() {
        this.playerData = {
            totalRuns: 0,
            totalDeaths: 0,
            totalVictories: 0,
            immortalStats: {
                flame: { runs: 0, victories: 0, totalDamage: 0 },
                storm: { runs: 0, victories: 0, totalDamage: 0 },
                earth: { runs: 0, victories: 0, totalDamage: 0 },
                shadow: { runs: 0, victories: 0, totalDamage: 0 }
            },
            unlockedAbilities: new Set(),
            unlockedWeapons: new Set(),
            unlockedBlessings: new Set(),
            metaCurrency: 0,
            loreFragments: new Set(),
            difficultyModifiersUnlocked: new Set()
        };
        
        this.runHistory = [];
        this.currentRun = null;
    }

    startRun(immortalType) {
        this.currentRun = {
            immortal: immortalType,
            startTime: Date.now(),
            endTime: null,
            victory: false,
            zonesReached: 0,
            bossesDefeated: 0,
            damageDealt: 0,
            damageTaken: 0,
            blessingsCollected: [],
            relicsCollected: [],
            deathCause: null
        };
        
        this.playerData.totalRuns++;
        this.playerData.immortalStats[immortalType].runs++;
    }

    endRun(victory = false, deathCause = null) {
        if (!this.currentRun) return;
        
        this.currentRun.endTime = Date.now();
        this.currentRun.victory = victory;
        this.currentRun.deathCause = deathCause;
        
        // Update stats
        if (victory) {
            this.playerData.totalVictories++;
            this.playerData.immortalStats[this.currentRun.immortal].victories++;
        } else {
            this.playerData.totalDeaths++;
        }
        
        // Award meta currency based on performance
        const currencyEarned = this.calculateMetaCurrency();
        this.playerData.metaCurrency += currencyEarned;
        
        // Check for unlocks
        this.checkForUnlocks();
        
        // Save run to history
        this.runHistory.push({ ...this.currentRun });
        this.currentRun = null;
        
        return {
            currencyEarned,
            newUnlocks: this.getNewUnlocks()
        };
    }

    calculateMetaCurrency() {
        if (!this.currentRun) return 0;
        
        let currency = 0;
        
        // Base currency for attempting
        currency += 10;
        
        // Bonus for zones reached
        currency += this.currentRun.zonesReached * 5;
        
        // Bonus for bosses defeated
        currency += this.currentRun.bossesDefeated * 15;
        
        // Victory bonus
        if (this.currentRun.victory) {
            currency += 50;
        }
        
        // Performance bonuses
        if (this.currentRun.damageDealt > 1000) currency += 10;
        if (this.currentRun.damageTaken < 200) currency += 15;
        
        return currency;
    }

    checkForUnlocks() {
        const stats = this.playerData;
        
        // Unlock new abilities based on immortal usage
        Object.entries(stats.immortalStats).forEach(([immortal, data]) => {
            if (data.runs >= 5 && !stats.unlockedAbilities.has(`${immortal}_advanced`)) {
                stats.unlockedAbilities.add(`${immortal}_advanced`);
            }
            
            if (data.victories >= 3 && !stats.unlockedAbilities.has(`${immortal}_master`)) {
                stats.unlockedAbilities.add(`${immortal}_master`);
            }
        });
        
        // Unlock difficulty modifiers after first victory
        if (stats.totalVictories >= 1 && !stats.difficultyModifiersUnlocked.has('speed_boost')) {
            stats.difficultyModifiersUnlocked.add('speed_boost');
        }
        
        if (stats.totalVictories >= 3 && !stats.difficultyModifiersUnlocked.has('extra_phases')) {
            stats.difficultyModifiersUnlocked.add('extra_phases');
        }
        
        // Unlock weapons based on total runs
        if (stats.totalRuns >= 10 && !stats.unlockedWeapons.has('flame_sword')) {
            stats.unlockedWeapons.add('flame_sword');
        }
        
        // Unlock blessings based on performance
        if (stats.totalDeaths >= 5 && !stats.unlockedBlessings.has('resilience')) {
            stats.unlockedBlessings.add('resilience');
        }
    }

    purchaseUpgrade(upgradeId, cost) {
        if (this.playerData.metaCurrency < cost) {
            return { success: false, reason: 'Insufficient currency' };
        }
        
        this.playerData.metaCurrency -= cost;
        
        // Apply upgrade based on ID
        switch(upgradeId) {
            case 'health_boost':
                // Permanent health increase
                break;
            case 'damage_boost':
                // Permanent damage increase
                break;
            case 'ability_cooldown':
                // Reduce ability cooldowns
                break;
            default:
                return { success: false, reason: 'Unknown upgrade' };
        }
        
        return { success: true };
    }

    unlockLoreFragment(fragmentId) {
        this.playerData.loreFragments.add(fragmentId);
    }

    getMostUsedImmortal() {
        let maxRuns = 0;
        let mostUsed = 'flame';
        
        Object.entries(this.playerData.immortalStats).forEach(([immortal, stats]) => {
            if (stats.runs > maxRuns) {
                maxRuns = stats.runs;
                mostUsed = immortal;
            }
        });
        
        return mostUsed;
    }

    getRunHistory() {
        return {
            totalDefeats: this.runHistory.filter(run => !run.victory).length,
            mostUsedImmortal: this.getMostUsedImmortal(),
            averageZonesReached: this.runHistory.reduce((sum, run) => sum + run.zonesReached, 0) / this.runHistory.length || 0,
            bestRun: this.runHistory.reduce((best, run) => 
                run.zonesReached > (best?.zonesReached || 0) ? run : best, null)
        };
    }

    getNewUnlocks() {
        // Return recently unlocked content for UI display
        return {
            abilities: Array.from(this.playerData.unlockedAbilities),
            weapons: Array.from(this.playerData.unlockedWeapons),
            blessings: Array.from(this.playerData.unlockedBlessings),
            difficultyModifiers: Array.from(this.playerData.difficultyModifiersUnlocked)
        };
    }

    save() {
        // Save to localStorage or server
        localStorage.setItem('fourImmortals_progression', JSON.stringify(this.playerData));
    }

    load() {
        // Load from localStorage or server
        const saved = localStorage.getItem('fourImmortals_progression');
        if (saved) {
            const data = JSON.parse(saved);
            this.playerData = { ...this.playerData, ...data };
            
            // Convert arrays back to Sets
            this.playerData.unlockedAbilities = new Set(data.unlockedAbilities || []);
            this.playerData.unlockedWeapons = new Set(data.unlockedWeapons || []);
            this.playerData.unlockedBlessings = new Set(data.unlockedBlessings || []);
            this.playerData.loreFragments = new Set(data.loreFragments || []);
            this.playerData.difficultyModifiersUnlocked = new Set(data.difficultyModifiersUnlocked || []);
        }
    }
}