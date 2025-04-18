class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Simple menu text
        this.add.text(400, 200, 'QWOP SURVIVAL', {
            fontSize: '42px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 300, 'Press SPACE to start', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Press space to start
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}