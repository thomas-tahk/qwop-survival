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
            gravity: { y: 1 }, // Moderate gravity
            debug: true, // Show physics bodies
            debugBodyColor: 0xffffff, // White debug bodies
            debugWireframes: true,
            debugShowInternalEdges: true
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

// Initialize the game
const game = new Phaser.Game(config);