/**
 * Base Boss Class with variation system and adaptive behavior
 */
export class BaseBoss {
    constructor(config, variations = []) {
        this.name = config.name;
        this.baseHealth = config.baseHealth;
        this.baseDamage = config.baseDamage;
        this.phases = config.phases || [];
        this.currentPhase = 0;
        
        // Apply variations
        this.variations = variations;
        this.applyVariations();
        
        // Adaptive behavior tracking
        this.playerBehaviorTracker = {
            dodgeCount: 0,
            rangedAttackCount: 0,
            meleeAttackCount: 0,
            statusEffectCount: 0,
            faceTankCount: 0
        };
        
        // Boss state
        this.health = this.maxHealth;
        this.position = { x: 0, y: 0, z: 0 };
        this.isInvulnerable = false;
        this.currentAttackPattern = null;
    }

    applyVariations() {
        this.variations.forEach(variation => {
            switch(variation.type) {
                case 'offensive':
                    this.applyOffensiveVariation(variation);
                    break;
                case 'defensive':
                    this.applyDefensiveVariation(variation);
                    break;
                case 'environmental':
                    this.applyEnvironmentalVariation(variation);
                    break;
            }
        });
    }

    applyOffensiveVariation(variation) {
        switch(variation.name) {
            case 'chainAttacks':
                this.hasChainAttacks = true;
                break;
            case 'elementalInfusion':
                this.elementalType = variation.element;
                break;
            case 'fasterTelegraphs':
                this.telegraphSpeed *= 1.5;
                break;
        }
    }

    applyDefensiveVariation(variation) {
        switch(variation.name) {
            case 'armorPhases':
                this.hasArmorPhases = true;
                break;
            case 'damageReflection':
                this.hasDamageReflection = true;
                break;
            case 'summonedShields':
                this.canSummonShields = true;
                break;
        }
    }

    applyEnvironmentalVariation(variation) {
        switch(variation.name) {
            case 'shrinkingArena':
                this.hasShrinkingArena = true;
                break;
            case 'rotatingHazards':
                this.hasRotatingHazards = true;
                break;
            case 'icyFloor':
                this.hasIcyFloor = true;
                break;
        }
    }

    update(deltaTime, player) {
        this.trackPlayerBehavior(player);
        this.updatePhase();
        this.executeCurrentPattern(deltaTime, player);
        this.adaptToPlayerBehavior(player);
    }

    trackPlayerBehavior(player) {
        // Track player actions for adaptive behavior
        if (player.isDodging) {
            this.playerBehaviorTracker.dodgeCount++;
        }
        
        if (player.lastAttackType === 'ranged') {
            this.playerBehaviorTracker.rangedAttackCount++;
        } else if (player.lastAttackType === 'melee') {
            this.playerBehaviorTracker.meleeAttackCount++;
        }
    }

    adaptToPlayerBehavior(player) {
        const behavior = this.getDominantPlayerBehavior();
        
        switch(behavior) {
            case 'excessiveDodging':
                this.useAreaDenialAttacks();
                break;
            case 'rangedSpam':
                this.useGapClosers();
                break;
            case 'statusStacking':
                this.useCleansing();
                break;
            case 'faceTanking':
                this.useBurstPunish();
                break;
        }
    }

    getDominantPlayerBehavior() {
        const tracker = this.playerBehaviorTracker;
        const total = Object.values(tracker).reduce((sum, count) => sum + count, 0);
        
        if (tracker.dodgeCount / total > 0.4) return 'excessiveDodging';
        if (tracker.rangedAttackCount / total > 0.6) return 'rangedSpam';
        if (tracker.statusEffectCount / total > 0.3) return 'statusStacking';
        if (tracker.faceTankCount / total > 0.5) return 'faceTanking';
        
        return 'balanced';
    }

    updatePhase() {
        const healthPercentage = this.health / this.maxHealth;
        const newPhase = this.phases.findIndex(phase => healthPercentage <= phase.triggerHealth);
        
        if (newPhase !== -1 && newPhase !== this.currentPhase) {
            this.currentPhase = newPhase;
            this.onPhaseChange();
        }
    }

    onPhaseChange() {
        // Override in subclasses
        console.log(`Boss entering phase ${this.currentPhase + 1}`);
    }

    executeCurrentPattern(deltaTime, player) {
        // Override in subclasses
    }

    useAreaDenialAttacks() {
        // Response to excessive dodging
        this.currentAttackPattern = 'areaDenial';
    }

    useGapClosers() {
        // Response to ranged spam
        this.currentAttackPattern = 'gapCloser';
    }

    useCleansing() {
        // Response to status stacking
        this.currentAttackPattern = 'cleansing';
    }

    useBurstPunish() {
        // Response to face-tanking
        this.currentAttackPattern = 'burstPunish';
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Override in subclasses
        console.log(`${this.name} has been defeated!`);
    }
}