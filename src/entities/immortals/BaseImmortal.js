/**
 * Base Immortal Class - Foundation for all four immortals
 */
export class BaseImmortal {
    constructor(config) {
        this.name = config.name;
        this.color = config.color;
        this.health = config.maxHealth;
        this.maxHealth = config.maxHealth;
        
        // Combat stats
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackCooldown = config.attackCooldown;
        this.moveSpeed = config.moveSpeed;
        
        // Ability system
        this.abilities = config.abilities || [];
        this.abilityCooldowns = {};
        
        // Position and state
        this.position = { x: 0, y: 0, z: 0 };
        this.isDodging = false;
        this.isAttacking = false;
    }

    attack(targets) {
        if (this.isOnCooldown('attack')) return false;
        
        this.startCooldown('attack', this.attackCooldown);
        this.isAttacking = true;
        
        // Override in subclasses
        return this.performAttack(targets);
    }

    useAbility(abilityName, targets) {
        if (this.isOnCooldown(abilityName)) return false;
        
        const ability = this.abilities.find(a => a.name === abilityName);
        if (!ability) return false;
        
        this.startCooldown(abilityName, ability.cooldown);
        return ability.execute(this, targets);
    }

    dodge(direction) {
        if (this.isDodging) return false;
        
        this.isDodging = true;
        // Implement dodge mechanics
        setTimeout(() => {
            this.isDodging = false;
        }, 300);
        
        return true;
    }

    isOnCooldown(actionName) {
        return this.abilityCooldowns[actionName] > Date.now();
    }

    startCooldown(actionName, duration) {
        this.abilityCooldowns[actionName] = Date.now() + duration;
    }

    performAttack(targets) {
        // Override in subclasses
        throw new Error('performAttack must be implemented by subclass');
    }
}