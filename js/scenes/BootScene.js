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

        // Create UPPER legs WITHOUT feet
        const upperLegGraphics = this.make.graphics();
        upperLegGraphics.fillStyle(0x0000ff);
        upperLegGraphics.fillRect(0, 0, 15, 40);
        upperLegGraphics.generateTexture('upperLeg', 15, 40);
        upperLegGraphics.clear();

        // Create LOWER legs WITH feet
        const lowerLegGraphics = this.make.graphics();
        lowerLegGraphics.fillStyle(0x0000ff);
        lowerLegGraphics.fillRect(0, 0, 15, 40); // Leg part
        lowerLegGraphics.fillStyle(0x0088ff);
        lowerLegGraphics.fillRect(-15, 40, 45, 15); // Foot part - wider and flat
        lowerLegGraphics.generateTexture('lowerLeg', 45, 55);
        lowerLegGraphics.clear();

        // Keep the old 'leg' texture for backward compatibility
        this.createTextureRect('leg', 15, 60, 0x0000ff);

        // Create enemy with limbs
        const enemyGraphics = this.make.graphics();

        // Main body
        enemyGraphics.fillStyle(0xff00ff);
        enemyGraphics.fillRect(0, 0, 50, 70);

        // Arms/limbs
        enemyGraphics.fillStyle(0xff77ff);
        enemyGraphics.fillRect(-20, 20, 40, 10); // Left arm
        enemyGraphics.fillRect(30, 20, 40, 10);  // Right arm

        enemyGraphics.generateTexture('enemy', 90, 70);
        enemyGraphics.clear();

        // Create enemy arm texture
        this.createTextureRect('enemyArm', 40, 10, 0xff77ff);

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