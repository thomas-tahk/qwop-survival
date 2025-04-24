class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create simple colored rectangles for placeholder assets
        this.createPlaceholderAssets();

        // OR load placeholder assets if you want to create them separately
        // this.load.image('torso', 'assets/placeholder/torso.png');
        // this.load.image('head', 'assets/placeholder/head.png');
        // this.load.image('arm', 'assets/placeholder/arm.png');
        // this.load.image('leg', 'assets/placeholder/leg.png');
        // this.load.image('enemy', 'assets/placeholder/enemy.png');
        // this.load.image('ground', 'assets/placeholder/ground.png');
        // this.load.image('safehouse', 'assets/placeholder/safehouse.png');
    }

    create() {
        this.scene.start('MenuScene');
    }

    createPlaceholderAssets() {
        this.createTextureRect('torso', 40, 80, 0x00ff00);
        this.createTextureRect('head', 30, 30, 0xffff00);
        this.createTextureRect('arm', 60, 15, 0xff0000);

        // Create leg with foot
        const legGraphics = this.make.graphics();
        legGraphics.fillStyle(0x0000ff);
        legGraphics.fillRect(0, 0, 15, 50); // Leg part
        legGraphics.fillStyle(0x0088ff);
        legGraphics.fillRect(-5, 50, 25, 10); // Foot part sticking out
        legGraphics.generateTexture('leg', 25, 60);
        legGraphics.clear();

        // Create enemy with "mouth"
        const enemyGraphics = this.make.graphics();
        enemyGraphics.fillStyle(0xff00ff);
        enemyGraphics.fillRect(0, 0, 50, 70); // Main body
        enemyGraphics.fillStyle(0xffffff);
        enemyGraphics.fillRect(0, 30, 15, 10); // White "teeth"
        enemyGraphics.generateTexture('enemy', 65, 70);
        enemyGraphics.clear();

        this.createTextureRect('ground', 800, 40, 0x663300);
        this.createTextureRect('finishLine', 10, 120, 0xffff00);
    }

    createTextureRect(name, width, height, color) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(name, width, height);
        graphics.clear();
    }
}