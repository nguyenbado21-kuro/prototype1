/**
 * Difficulty Scaling System - Implements formulas from the document
 */
export class DifficultySystem {
    constructor() {
        this.zoneIndex = 1;
        this.bossCount = 0;
        this.globalDifficulty = 1.0;
        
        // Scaling factors
        this.ZONE_FACTOR = 0.25;
        this.BOSS_FACTOR = 0.4;
        this.HEALTH_SCALING = 0.6;
        this.DAMAGE_SCALING = 0.45;
        this.POWER_REDUCTION = 0.08;
        
        // Meta difficulty modifiers (unlocked after first clear)
        this.metaModifiers = {
            enemySpeedBonus: 0,
            revivePenalty: 0,
            extraBossPhases: false,
            permanentHazards: false
        };
    }

    calculateGlobalDifficulty() {
        // GD = 1 + (ZoneIndex × ZF) + (BossCount × BF)
        this.globalDifficulty = 1 + (this.zoneIndex * this.ZONE_FACTOR) + (this.bossCount * this.BOSS_FACTOR);
        return this.globalDifficulty;
    }

    scaleEnemyHealth(baseHealth, eliteModifier = 1.0) {
        // EnemyHP = BaseHP × (1 + GD × 0.6) × EliteModifier
        return Math.floor(baseHealth * (1 + this.globalDifficulty * this.HEALTH_SCALING) * eliteModifier);
    }

    scaleEnemyDamage(baseDamage) {
        // EnemyDamage = BaseDamage × (1 + GD × 0.45)
        return Math.floor(baseDamage * (1 + this.globalDifficulty * this.DAMAGE_SCALING));
    }

    calculateEffectivePlayerPower(rawPower) {
        // EffectivePlayerPower = RawPower × (1 - (GD × 0.08))
        const reduction = 1 - (this.globalDifficulty * this.POWER_REDUCTION);
        return rawPower * Math.max(0.5, reduction); // Minimum 50% power
    }

    applyMetaModifiers(config) {
        let modifiedConfig = { ...config };
        
        // Apply speed bonus
        if (this.metaModifiers.enemySpeedBonus > 0) {
            modifiedConfig.moveSpeed *= (1 + this.metaModifiers.enemySpeedBonus);
        }
        
        // Apply extra boss phases
        if (this.metaModifiers.extraBossPhases && config.type === 'boss') {
            modifiedConfig.extraPhases = true;
        }
        
        return modifiedConfig;
    }

    unlockMetaModifier(modifierName, value) {
        if (this.metaModifiers.hasOwnProperty(modifierName)) {
            this.metaModifiers[modifierName] = value;
            console.log(`Meta modifier unlocked: ${modifierName}`);
        }
    }

    getEliteModifier(enemyType) {
        switch(enemyType) {
            case 'normal': return 1.0;
            case 'elite': return 1.5 + Math.random() * 0.7; // 1.5 - 2.2
            case 'miniboss': return 2.5 + Math.random() * 0.5; // 2.5 - 3.0
            default: return 1.0;
        }
    }

    getDifficultyInfo() {
        return {
            zone: this.zoneIndex,
            bossesDefeated: this.bossCount,
            globalDifficulty: this.globalDifficulty,
            healthScaling: `+${Math.floor(this.globalDifficulty * this.HEALTH_SCALING * 100)}%`,
            damageScaling: `+${Math.floor(this.globalDifficulty * this.DAMAGE_SCALING * 100)}%`,
            powerReduction: `-${Math.floor(this.globalDifficulty * this.POWER_REDUCTION * 100)}%`,
            metaModifiers: this.metaModifiers
        };
    }

    advanceZone() {
        this.zoneIndex++;
        this.calculateGlobalDifficulty();
        console.log(`Advanced to Zone ${this.zoneIndex}, Global Difficulty: ${this.globalDifficulty.toFixed(2)}`);
    }

    defeatBoss() {
        this.bossCount++;
        this.calculateGlobalDifficulty();
        console.log(`Boss defeated! Total: ${this.bossCount}, Global Difficulty: ${this.globalDifficulty.toFixed(2)}`);
    }

    reset() {
        this.zoneIndex = 1;
        this.bossCount = 0;
        this.calculateGlobalDifficulty();
    }
}