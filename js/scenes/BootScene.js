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
        // Create colored rectangles as placeholders
        this.createTextureRect('torso', 40, 80, 0x00ff00);
        this.createTextureRect('head', 30, 30, 0xffff00);
        this.createTextureRect('arm', 60, 15, 0xff0000);
        this.createTextureRect('leg', 15, 60, 0x0000ff);
        this.createTextureRect('enemy', 40, 60, 0xff00ff);
        this.createTextureRect('ground', 800, 40, 0x663300);
        this.createTextureRect('safehouse', 80, 80, 0x00ffff);
    }

    createTextureRect(name, width, height, color) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(name, width, height);
        graphics.clear();
    }
}