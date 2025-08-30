# SVG Snake Game

A modern, responsive Snake game built with TypeScript, SVG, and D3.js. Features responsive design, multiple skins, power-ups, and smooth animations.

## Features

### 🎮 Core Gameplay
- Classic Snake gameplay with smooth controls
- Responsive board that adapts to screen size
- Power-ups and special effects

### 🎨 Visual Features
- **Multiple Skins**: Basic, Golden, and Neon themes
- **Responsive Design**: Automatically adjusts board size for different devices
- **Dynamic Eye Scaling**: Snake eyes scale with screen size for optimal visibility
- **Smooth Animations**: Fluid snake movement and transitions
- **SVG-based rendering** for crisp graphics at any resolution

### 🔊 Audio System
- **Background music during gameplay** (stops when player dies)
- Sound effects for food collection, power-ups, and game events
- **Audio controls** with volume adjustment and mute functionality
- **Proper audio management** across game state changes

### 📱 Menu System
- **Start Screen**: Game introduction and controls
- **Main Menu**: Accessible via Escape key during gameplay
- **Rules Tab**: Complete game instructions and tips
- **Skins Tab**: Skin selection and unlock information
- **Audio Controls**: Volume slider and mute toggle

## Power-ups & Effects

- **🍒 Cherry**: No effects (100 points)
- **🍌 Banana**: Slows down snake speed (120 points)
- **🥥 Coconut**: Provides temporary shield protection for 20 seconds (150 points)
- **🍍 Pineapple**: Doubles points for 15 seconds (200 points)
- **🍕 Pizza**: Increases snake speed (400 points)
- **🍄 Mushroom**: Inverts controls for 30 seconds (350 points)

## Controls

- **Arrow Keys** or **WASD**: Move snake
- **Space**: Start/Pause game
- **Escape**: Open menu
- **M**: Toggle audio
- **Mouse/Touch**: Navigate menus and select skins

## Skins & Unlock System

- **Basic Skin**: Available from start
- **Golden Skin**: Unlock at 5,000 points
- **Neon Skin**: Unlock at 10,000 points

## Technical Features

- **TypeScript** for type safety and better development experience
- **D3.js** for efficient SVG manipulation
- **Responsive CSS** with mobile-first design principles
- **Audio Web API** for cross-platform sound support
- **Local Storage** for saving high scores and preferences
- **Debounced resize handling** for smooth responsive updates

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Performance Optimizations

- **Efficient SVG rendering** with D3.js
- **Debounced resize events** to prevent performance issues
- **Optimized audio loading** with fallback handling
- **Responsive breakpoints** for optimal performance on multiple devices

## Known Issues

### Screen Resize Freezing Issue (Improved ✅)
- **Issue**: When the user changes the screen size while playing, the game freezes and can only be restarted by clicking space
- **Current Status**: Improved with user-friendly overlay message
- **Solution**: Shows "Screen resized — Click Space to Restart" overlay when freezing occurs
- **Note**: This issue occurs because the responsive board resizing temporarily interrupts the game loop, but now provides clear user guidance

### Rapid Space Spam Bug (Fixed ✅)
- **Issue**: When clicking "Start Game" and immediately spamming the space bar, the snake can speed up dramatically and teleport to the other end of the board, causing self-collision
- **Current Status**: Resolved with transition state management and debouncing
- **Solution**: Added transition state tracking and 100ms debounce for space key presses
- **Note**: The game now properly prevents rapid input during the 800ms transition animation

### HUD Component Overlap Issue
- **Issue**: When the screen height is decreased significantly compared to the width, the HUD component's white container will cover the top part of the snake board
- **Current Status**: Known issue affecting gameplay on very short screens
- **Workaround**: Ensure adequate screen height or use landscape orientation on mobile devices
- **Note**: This occurs due to fixed positioning of the HUD component not accounting for extreme aspect ratio changes

## Development

### Prerequisites
- Node.js 
- npm

### Setup
```bash
# Clone the repository
git clone https://github.com/KokoMilev/SVG-Snake-Game.git
cd SVG-Snake-Game

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Project Structure
```
SVG-Snake-Game/
├── src/
│   ├── app/           # Main application logic and event handlers
        ├── styles/    # CSS files for responsive design and UI components
│   ├── domain/        # Game domain models, logic, and constants
│   ├── ui/            # SVG renderer and UI components
│   └── assets/        # Audio files, images, and game assets
├── tests/             # Test files and configurations
├── index.html         # Main HTML file
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## AI Development Disclosure

⚠️ **AI-Assisted Development**: This project was developed with assistance from AI coding tools. While the core game logic, responsive design, and user experience are original implementations, some code structure, tests, design, error handling, and documentation improvements were suggested and implemented with AI assistance. The final product represents a collaborative effort between human creativity and AI-powered development tools.
