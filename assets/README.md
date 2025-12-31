# Assets Folder Structure

This folder contains all game assets organized by type for easy management and maintenance.

## 📁 Folder Structure

### 🎵 `/audio/`
Contains all audio files for the game:
- `home-music.mp3` - Peaceful background music for home dimension
- `war-music.mp3` - Intense battle music for war dimension

### 🖼️ `/images/`
Contains background images and UI graphics:
- `home-background.png` - Background image for home dimension skybox

### 🎨 `/textures/`
Contains texture files for 3D models and materials:
- *Ready for future texture assets*

### 🎭 `/models/`
Contains 3D model files (OBJ, FBX, GLTF, etc.):
- *Ready for future 3D model assets*

### ✨ `/effects/`
Contains particle effects, shaders, and visual effect assets:
- *Ready for future effect assets*

## 📋 Asset Guidelines

### Audio Files
- **Format**: MP3 for web compatibility
- **Quality**: 128-192 kbps for balance of quality and file size
- **Looping**: Background music should loop seamlessly

### Images
- **Format**: PNG for transparency support, JPG for photos
- **Resolution**: Power of 2 dimensions (512x512, 1024x1024, etc.) for optimal GPU performance
- **Compression**: Optimize for web without losing visual quality

### Textures
- **Format**: PNG or JPG depending on alpha channel needs
- **Size**: Power of 2 dimensions for WebGL compatibility
- **Mipmaps**: Consider generating mipmaps for better performance

### Models
- **Format**: GLTF/GLB preferred for web, OBJ as fallback
- **Optimization**: Keep polygon count reasonable for web performance
- **Textures**: Include all required texture files

### Effects
- **Shaders**: GLSL format for WebGL compatibility
- **Particles**: JSON configuration files for particle systems
- **Animations**: Consider file size for web delivery

## 🔧 Usage in Code

Assets are referenced using relative paths from the project root:

```javascript
// Audio
new Audio('assets/audio/home-music.mp3')

// Images/Textures
textureLoader.load('assets/images/home-background.png')

// Models (example)
loader.load('assets/models/character.gltf')
```

## 📝 Notes

- All paths are relative to the project root
- Keep file names descriptive and consistent
- Use lowercase with hyphens for file names
- Organize by asset type, not by game feature
- Consider file sizes for web performance