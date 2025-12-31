/**
 * Boss Variation System - Generates modular boss variations per run
 */
export class BossVariationSystem {
    constructor() {
        this.offensiveModifiers = [
            { name: 'chainAttacks', weight: 1.0 },
            { name: 'elementalInfusion', weight: 1.0, elements: ['frost', 'shadow', 'lightning'] },
            { name: 'fasterTelegraphs', weight: 0.8 }
        ];

        this.defensiveModifiers = [
            { name: 'armorPhases', weight: 1.0 },
            { name: 'damageReflection', weight: 0.7 },
            { name: 'summonedShields', weight: 0.9 }
        ];

        this.environmentalModifiers = [
            { name: 'shrinkingArena', weight: 0.6 },
            { name: 'rotatingHazards', weight: 0.8 },
            { name: 'icyFloor', weight: 0.7 }
        ];
    }

    generateBossVariation(baseBoss, runSeed = null) {
        // Use seed for deterministic generation if provided
        const rng = runSeed ? this.createSeededRNG(runSeed) : Math.random;
        
        const variations = [];
        const maxVariations = 2;
        const minVariations = 1;
        
        const variationCount = minVariations + Math.floor(rng() * (maxVariations - minVariations + 1));
        
        // Select random modifiers from different categories
        const availableCategories = ['offensive', 'defensive', 'environmental'];
        const selectedCategories = this.shuffleArray(availableCategories, rng).slice(0, variationCount);
        
        selectedCategories.forEach(category => {
            const modifier = this.selectWeightedModifier(category, rng);
            if (modifier) {
                variations.push({
                    type: category,
                    ...modifier
                });
            }
        });

        return {
            baseBoss,
            variations,
            seed: runSeed,
            description: this.generateVariationDescription(variations)
        };
    }

    selectWeightedModifier(category, rng = Math.random) {
        let modifiers;
        
        switch(category) {
            case 'offensive':
                modifiers = this.offensiveModifiers;
                break;
            case 'defensive':
                modifiers = this.defensiveModifiers;
                break;
            case 'environmental':
                modifiers = this.environmentalModifiers;
                break;
            default:
                return null;
        }

        const totalWeight = modifiers.reduce((sum, mod) => sum + mod.weight, 0);
        let random = rng() * totalWeight;
        
        for (const modifier of modifiers) {
            random -= modifier.weight;
            if (random <= 0) {
                const result = { ...modifier };
                
                // Handle special cases
                if (modifier.name === 'elementalInfusion') {
                    result.element = modifier.elements[Math.floor(rng() * modifier.elements.length)];
                }
                
                return result;
            }
        }
        
        return modifiers[0]; // Fallback
    }

    generateVariationDescription(variations) {
        const descriptions = variations.map(variation => {
            switch(variation.name) {
                case 'chainAttacks':
                    return 'Chains attacks together';
                case 'elementalInfusion':
                    return `Infused with ${variation.element} element`;
                case 'fasterTelegraphs':
                    return 'Attacks with faster telegraphs';
                case 'armorPhases':
                    return 'Has armored phases';
                case 'damageReflection':
                    return 'Reflects damage during certain windows';
                case 'summonedShields':
                    return 'Can summon protective shields';
                case 'shrinkingArena':
                    return 'Arena shrinks during fight';
                case 'rotatingHazards':
                    return 'Arena has rotating hazards';
                case 'icyFloor':
                    return 'Floor is slippery with ice';
                default:
                    return 'Unknown variation';
            }
        });
        
        return descriptions.join(', ');
    }

    // Northern Monster special variations (remembers previous runs)
    generateNorthernMonsterVariation(runHistory) {
        const baseVariations = this.generateBossVariation('NorthernMonster').variations;
        const memoryVariations = [];
        
        // Add variations based on run history
        if (runHistory.totalDefeats > 0) {
            memoryVariations.push({
                type: 'memory',
                name: 'newAttackPattern',
                description: 'Learned new attack patterns from previous defeats'
            });
        }
        
        if (runHistory.mostUsedImmortal) {
            memoryVariations.push({
                type: 'memory',
                name: 'elementalAdaptation',
                element: this.getCounterElement(runHistory.mostUsedImmortal),
                description: `Adapted to counter ${runHistory.mostUsedImmortal} abilities`
            });
        }
        
        if (runHistory.totalDefeats >= 3) {
            memoryVariations.push({
                type: 'memory',
                name: 'corruptedEchoes',
                description: 'Summons corrupted echoes of past bosses'
            });
        }
        
        return {
            baseBoss: 'NorthernMonster',
            variations: [...baseVariations, ...memoryVariations],
            isAdaptive: true,
            runHistory
        };
    }

    getCounterElement(immortalType) {
        const counters = {
            'flame': 'frost',
            'storm': 'earth',
            'earth': 'lightning',
            'shadow': 'light'
        };
        
        return counters[immortalType] || 'neutral';
    }

    createSeededRNG(seed) {
        let state = seed;
        return function() {
            state = (state * 9301 + 49297) % 233280;
            return state / 233280;
        };
    }

    shuffleArray(array, rng = Math.random) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}