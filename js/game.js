// Main game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#4488aa',
    parent: 'game-container',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0.8 },
            debug: true // Helpful during development
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

// Initialize the game
const game = new Phaser.Game(config);