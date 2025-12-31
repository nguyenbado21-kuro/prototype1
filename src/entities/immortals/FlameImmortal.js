/**
 * Flame Immortal - High-speed melee combat with fire abilities
 */
import { BaseImmortal } from './BaseImmortal.js';

export class FlameImmortal extends BaseImmortal {
    constructor() {
        super({
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
                    execute: (immortal, targets) => this.flameBurst(targets)
                }
            ]
        });
    }

    performAttack(targets) {
        // Melee fire attack with area damage
        const hitTargets = targets.filter(target => {
            const distance = this.getDistance(target.position);
            return distance <= this.attackRange;
        });

        hitTargets.forEach(target => {
            target.takeDamage(this.attackDamage);
            // Apply burn effect
            target.applyStatusEffect('burn', { damage: 5, duration: 3000 });
        });

        return {
            type: 'melee',
            effect: 'fire',
            hitCount: hitTargets.length
        };
    }

    flameBurst(targets) {
        // Large area fire damage ability
        const burstRange = 6;
        const burstDamage = 50;
        
        const hitTargets = targets.filter(target => {
            const distance = this.getDistance(target.position);
            return distance <= burstRange;
        });

        hitTargets.forEach(target => {
            target.takeDamage(burstDamage);
            target.applyStatusEffect('burn', { damage: 10, duration: 5000 });
        });

        return {
            type: 'ability',
            effect: 'flameBurst',
            range: burstRange,
            hitCount: hitTargets.length
        };
    }

    getDistance(targetPosition) {
        const dx = this.position.x - targetPosition.x;
        const dz = this.position.z - targetPosition.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
}