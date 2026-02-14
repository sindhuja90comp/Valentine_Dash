# 💘 Valentine Dash

A fun, interactive Valentine's Day themed game where you collect hearts while avoiding thorns. Perfect for sharing with that special someone!

## 🎮 How to Play

1. **Collect Hearts**: Navigate your character around the canvas to collect all 12 hearts
2. **Avoid Thorns**: Watch out for 8 moving thorns that will damage you
3. **Beat the Clock**: You have 40 seconds to collect all hearts
4. **Reach the Win Screen**: Collect every heart to see your personalized Valentine's message!

## 🕹️ Controls

Use the **arrow buttons** on screen (or keyboard):
- **▲** - Move Up
- **▼** - Move Down
- **◀** - Move Left
- **▶** - Move Right

## 🚀 Getting Started

1. Start a local server in this directory (e.g., `python3 -m http.server 8000`)
2. Open `http://localhost:8000` in your web browser
3. Click to play the game
4. Use arrow buttons to move and collect all 12 hearts while avoiding thorns!

## 🎨 Features

- **Personalized Messages**: Customize the win message to include your own Valentine's greeting
- **Sound Effects**: Charming sound effects when collecting hearts and getting hit
- **Best Time Tracking**: Your best completion time is saved in browser storage
- **Responsive Design**: Works beautifully on desktop and mobile devices
- **Glassmorphism UI**: Modern, frosted glass aesthetic with Valentine's Day theme

## ⚙️ Customization

Edit the following at the top of the script in `index.html`:

```javascript
const WIN_MESSAGE = "Your personalized message here!";
const SIGNATURE = "— From: Your Name";
const SHARE_TEXT = "I just beat Valentine Dash 💘";
```

### Game Configuration

You can also adjust game difficulty:
- `hearts`: Number of hearts to collect (default: 12)
- `thorns`: Number of moving thorns (default: 8)
- `timeLimit`: Time in seconds (default: 40)
- `playerSpeed`: Player movement speed in px/s (default: 285)
- `thornSpeed`: Thorn movement speed in px/s (default: 130)
- `invuln`: Invincibility time after getting hit (default: 0.85s)

## 💻 Technologies Used

- **HTML5**: Structure and canvas API for game rendering
- **CSS3**: Modern styling with gradients, backdrop filters, and responsive design
- **JavaScript**: Game logic, collision detection, and interactions
- **Web Audio API**: Dynamic sound synthesis

## 🎯 Game Mechanics

- **Collision Detection**: Precise distance-based collision with hearts and thorns
- **Physics Simulation**: Smooth player movement and thorn AI
- **Recovery System**: Brief invincibility period after taking damage
- **Progressive Difficulty**: Thorns move faster as you progress through the game
- **Local Storage**: Best time is saved to your browser

## 📱 Browser Support

Works on all modern browsers that support:
- HTML5 Canvas
- CSS3 Backdrop Filters
- Web Audio API
- LocalStorage

## 💝 Perfect For

- Asking someone out
- Celebrating Valentine's Day
- A unique, interactive gift
- Impressing that special someone with your coding skills!
