# The Four Immortals Against the Northern Monster

A fast-paced **roguelike action game** inspired by *Hades* and *Dead Cells*, featuring four legendary Immortals with distinct combat styles and abilities.

## 🎮 Game Overview

Players control four legendary Immortals, each wielding divine powers, as they descend into the frozen northern realms to defeat an ancient, world-devouring monster. Each run is unique with procedural generation, adaptive difficulty, and dynamic boss variations.

## 🔥 The Four Immortals

1. **Flame Immortal** - High-speed melee combat with fire abilities
2. **Storm Immortal** - Agile ranged combat with lightning powers  
3. **Earth Immortal** - Heavy tank with defensive stone abilities
4. **Shadow Immortal** - Stealth assassin with poison and teleportation

## 🏗️ Project Structure

```
src/
├── core/
│   └── GameManager.js          # Main game loop and state management
├── entities/
│   ├── immortals/
│   │   ├── BaseImmortal.js     # Base class for all immortals
│   │   └── FlameImmortal.js    # Flame immortal implementation
│   ├── enemies/
│   │   └── BaseEnemy.js        # Enemy base class with AI and scaling
│   └── bosses/
│       └── BaseBoss.js         # Boss base class with variations
├── systems/
│   ├── DifficultySystem.js     # Hades-like difficulty scaling
│   ├── BossVariationSystem.js  # Procedural boss variations
│   └── ProgressionSystem.js    # Meta progression and unlocks
└── config/
    └── GameConfig.js           # Central configuration
```

## 🎯 Core Features

### Difficulty Scaling System
- **Global Difficulty**: `GD = 1 + (ZoneIndex × 0.25) + (BossCount × 0.4)`
- **Enemy Health**: `BaseHP × (1 + GD × 0.6) × EliteModifier`
- **Enemy Damage**: `BaseDamage × (1 + GD × 0.45)`
- **Player Power Balance**: Prevents overpowered builds from trivializing content

### Boss Variation System
- **Modular Variations**: Each boss gets 1-2 random modifiers per run
- **Adaptive Behavior**: Bosses react to player tendencies
- **Northern Monster**: Final boss remembers previous runs and adapts

### Meta Progression
- **Permanent Unlocks**: New abilities, weapons, and difficulty modifiers
- **Currency System**: Earn meta currency based on performance
- **Lore Fragments**: Narrative unfolds across multiple runs

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd four-immortals-game

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🎮 Controls

- **WASD**: Move immortal
- **1-4**: Switch between immortals
- **Left Click**: Attack
- **Right Click**: Special ability
- **Spacebar**: Dodge roll

## 🔧 Development

### Framework Architecture
The game uses a modular architecture with:
- **Entity-Component System**: For flexible game objects
- **System-based Logic**: Separate systems for difficulty, progression, etc.
- **Configuration-driven**: Easy to modify game balance
- **Extensible Design**: Simple to add new immortals, enemies, and abilities

### Key Systems

1. **GameManager**: Central coordinator for game state
2. **DifficultySystem**: Implements scaling formulas from design document
3. **BossVariationSystem**: Generates unique boss encounters
4. **ProgressionSystem**: Handles meta progression and unlocks

### Adding New Content

#### New Immortal
1. Extend `BaseImmortal` class
2. Add configuration to `GameConfig.js`
3. Implement unique abilities and attack patterns

#### New Enemy Type
1. Extend `BaseEnemy` class  
2. Add AI behavior and attack patterns
3. Configure stats in `GameConfig.js`

#### New Boss
1. Extend `BaseBoss` class
2. Define phases and attack patterns
3. Add to boss variation system

## 📊 Game Balance

The game follows proven roguelike principles:
- **Skill-based progression** over stat grinding
- **Meaningful choices** in build customization  
- **Fair but challenging** difficulty scaling
- **Replayability** through procedural content

## 🎨 Technical Features

- **Three.js** for 3D graphics and rendering
- **Modular ES6** architecture
- **Vite** for fast development and building
- **Performance optimized** for smooth 60fps gameplay
- **Extensible configuration** system

## 📈 Roadmap

- [ ] Complete all four immortal implementations
- [ ] Add procedural level generation
- [ ] Implement blessing and relic systems
- [ ] Create boss encounter variations
- [ ] Add visual effects and polish
- [ ] Implement save/load system
- [ ] Add audio and music

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details