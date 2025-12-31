/**
 * Base Enemy Class with difficulty scaling
 */
export class BaseEnemy {
    constructor(config, globalDifficulty = 1.0) {
        this.type = config.type;
        this.baseHealth = config.baseHealth;
        this.baseDamage = config.baseDamage;
        this.moveSpeed = config.moveSpeed;
        this.eliteModifier = config.eliteModifier || 1.0;
        
        // Apply difficulty scaling
        this.health = this.calculateScaledHealth(globalDifficulty);
        this.maxHealth = this.health;
        this.damage = this.calculateScaledDamage(globalDifficulty);
        
        // AI and behavior
        this.aiState = 'idle';
        this.target = null;
        this.position = { x: 0, y: 0, z: 0 };
        this.statusEffects = new Map();
        
        // Combat state
        this.attackCooldown = config.attackCooldown || 1000;
        this.lastAttackTime = 0;
    }

    calculateScaledHealth(globalDifficulty) {
        // EnemyHP = BaseHP × (1 + GD × 0.6) × EliteModifier
        return Math.floor(
            this.baseHealth * (1 + globalDifficulty * 0.6) * this.eliteModifier
        );
    }

    calculateScaledDamage(globalDifficulty) {
        // EnemyDamage = BaseDamage × (1 + GD × 0.45)
        return Math.floor(
            this.baseDamage * (1 + globalDifficulty * 0.45)
        );
    }

    update(deltaTime, player) {
        this.updateStatusEffects(deltaTime);
        this.updateAI(deltaTime, player);
    }

    updateAI(deltaTime, player) {
        if (!player) return;
        
        const distanceToPlayer = this.getDistanceTo(player.position);
        
        switch(this.aiState) {
            case 'idle':
                if (distanceToPlayer < 10) {
                    this.aiState = 'pursuing';
                    this.target = player;
                }
                break;
                
            case 'pursuing':
                this.moveTowards(player.position, deltaTime);
                if (distanceToPlayer < 2) {
                    this.aiState = 'attacking';
                }
                break;
                
            case 'attacking':
                if (this.canAttack()) {
                    this.attack(player);
                }
                if (distanceToPlayer > 3) {
                    this.aiState = 'pursuing';
                }
                break;
        }
    }

    moveTowards(targetPosition, deltaTime) {
        const direction = {
            x: targetPosition.x - this.position.x,
            z: targetPosition.z - this.position.z
        };
        
        const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (distance > 0) {
            direction.x /= distance;
            direction.z /= distance;
            
            this.position.x += direction.x * this.moveSpeed * deltaTime;
            this.position.z += direction.z * this.moveSpeed * deltaTime;
        }
    }

    attack(target) {
        if (!this.canAttack()) return false;
        
        this.lastAttackTime = Date.now();
        target.takeDamage(this.damage);
        return true;
    }

    canAttack() {
        return Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    applyStatusEffect(effectType, config) {
        this.statusEffects.set(effectType, {
            ...config,
            startTime: Date.now()
        });
    }

    updateStatusEffects(deltaTime) {
        for (const [effectType, effect] of this.statusEffects) {
            const elapsed = Date.now() - effect.startTime;
            
            if (elapsed >= effect.duration) {
                this.statusEffects.delete(effectType);
                continue;
            }
            
            // Apply effect
            switch(effectType) {
                case 'burn':
                    if (elapsed % 1000 < deltaTime) { // Every second
                        this.takeDamage(effect.damage);
                    }
                    break;
                case 'poison':
                    if (elapsed % 500 < deltaTime) { // Every half second
                        this.takeDamage(effect.damage);
                    }
                    break;
            }
        }
    }

    getDistanceTo(position) {
        const dx = this.position.x - position.x;
        const dz = this.position.z - position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    die() {
        // Override in subclasses for death effects
        this.aiState = 'dead';
    }
}