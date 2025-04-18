class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Create ground
        this.ground = this.matter.add.image(400, 580, 'ground', null, { isStatic: true });
        this.ground.setScale(1, 1);

        // Create character parts and joints
        this.createCharacter();

        // Set up controls
        this.setupControls();

        // Add a single enemy
        this.enemy = this.matter.add.image(600, 500, 'enemy');

        // Add safehouse
        this.safehouse = this.matter.add.image(700, 500, 'safehouse', null, { isStatic: true });

        // Set up collision detection
        this.setupCollisions();

        // Add instructions text
        this.add.text(400, 50, 'Use Q/A for left arm, P/L for right arm\nW/S for left leg, O/K for right leg', {
            fontSize: '16px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);
    }

    update() {
        // Handle character balance
        this.updateBalance();

        // Update enemy AI
        this.updateEnemies();

        // Check win/lose conditions
        this.checkGameState();
    }

    // Create character with connected body parts
    createCharacter() {
        // Create body parts
        const torsoX = 200;
        const torsoY = 400;

        this.torso = this.matter.add.image(torsoX, torsoY, 'torso');
        this.head = this.matter.add.image(torsoX, torsoY - 50, 'head');
        this.leftArm = this.matter.add.image(torsoX - 40, torsoY - 10, 'arm');
        this.rightArm = this.matter.add.image(torsoX + 40, torsoY - 10, 'arm');
        this.leftLeg = this.matter.add.image(torsoX - 15, torsoY + 50, 'leg');
        this.rightLeg = this.matter.add.image(torsoX + 15, torsoY + 50, 'leg');

        // Connect parts with joints
        // Head to torso
        this.matter.add.joint(this.head, this.torso, 0, 0.9, {
            pointA: { x: 0, y: 20 },
            pointB: { x: 0, y: -30 }
        });

        // Arms to torso
        this.matter.add.joint(this.leftArm, this.torso, 0, 0.9, {
            pointA: { x: 20, y: 0 },
            pointB: { x: -30, y: -20 }
        });
        this.matter.add.joint(this.rightArm, this.torso, 0, 0.9, {
            pointA: { x: -20, y: 0 },
            pointB: { x: 30, y: -20 }
        });

        // Legs to torso
        this.matter.add.joint(this.leftLeg, this.torso, 0, 0.9, {
            pointA: { x: 0, y: -25 },
            pointB: { x: -15, y: 30 }
        });
        this.matter.add.joint(this.rightLeg, this.torso, 0, 0.9, {
            pointA: { x: 0, y: -25 },
            pointB: { x: 15, y: 30 }
        });
    }

    // Set up key controls for limbs
    setupControls() {
        this.leftArmKeys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        };

        this.rightArmKeys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
        };

        this.leftLegKeys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        };

        this.rightLegKeys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)
        };
    }

    // Update character balance
    updateBalance() {
        // Apply forces based on key presses
        const force = 0.005;

        // Left arm control
        if (this.leftArmKeys.up.isDown) {
            this.leftArm.applyForce({ x: 0, y: -force });
        }
        if (this.leftArmKeys.down.isDown) {
            this.leftArm.applyForce({ x: 0, y: force });
        }

        // Right arm control
        if (this.rightArmKeys.up.isDown) {
            this.rightArm.applyForce({ x: 0, y: -force });
        }
        if (this.rightArmKeys.down.isDown) {
            this.rightArm.applyForce({ x: 0, y: force });
        }

        // Left leg control
        if (this.leftLegKeys.up.isDown) {
            this.leftLeg.applyForce({ x: 0, y: -force });
        }
        if (this.leftLegKeys.down.isDown) {
            this.leftLeg.applyForce({ x: 0, y: force });
        }

        // Right leg control
        if (this.rightLegKeys.up.isDown) {
            this.rightLeg.applyForce({ x: 0, y: -force });
        }
        if (this.rightLegKeys.down.isDown) {
            this.rightLeg.applyForce({ x: 0, y: force });
        }

        // Basic balance check
        // If torso falls below a certain height or tilts too much, game over
        if (this.torso.y > 550 || Math.abs(this.torso.rotation) > 1.5) {
            console.log('Character fell over!');
            this.scene.restart();
        }
    }

    // Set up collision detection
    setupCollisions() {
        // Check for collisions between limbs and enemies
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check if collision is between arm and enemy
                if ((bodyA.gameObject === this.leftArm || bodyA.gameObject === this.rightArm) &&
                    bodyB.gameObject === this.enemy) {
                    this.damageEnemy(this.enemy);
                }
                else if ((bodyB.gameObject === this.leftArm || bodyB.gameObject === this.rightArm) &&
                    bodyA.gameObject === this.enemy) {
                    this.damageEnemy(this.enemy);
                }

                // Check if player reached safehouse
                if ((bodyA.gameObject === this.torso && bodyB.gameObject === this.safehouse) ||
                    (bodyB.gameObject === this.torso && bodyA.gameObject === this.safehouse)) {
                    console.log('Reached safehouse! You win!');
                    this.add.text(400, 300, 'YOU WIN!', {
                        fontSize: '48px',
                        fill: '#fff',
                        backgroundColor: '#000',
                        padding: { x: 20, y: 10 }
                    }).setOrigin(0.5);

                    // Restart the scene after a delay
                    this.time.delayedCall(3000, () => {
                        this.scene.start('MenuScene');
                    });
                }
            });
        });
    }

    // Enemy damage function
    damageEnemy(enemy) {
        // Simple enemy health system
        if (!enemy.health) {
            enemy.health = 3;
        }

        enemy.health--;

        // Visual feedback
        this.tweens.add({
            targets: enemy,
            alpha: 0.5,
            duration: 100,
            yoyo: true
        });

        if (enemy.health <= 0) {
            enemy.destroy();
        }
    }

    // Update enemy behavior
    updateEnemies() {
        // Simple AI: move toward player
        if (this.enemy && this.enemy.active) {
            const dx = this.torso.x - this.enemy.x;
            const speed = 0.0002;
            this.enemy.applyForce({ x: Math.sign(dx) * speed, y: 0 });
        }
    }

    // Check game win/lose conditions
    checkGameState() {
        // Win: Player reached safehouse (checked in collision detection)

        // Lose: Character fell over (checked in updateBalance)

        // Additional lose condition: Enemy reaches player and player doesn't defeat it
        if (this.enemy && this.enemy.active) {
            const distance = Phaser.Math.Distance.Between(this.torso.x, this.torso.y, this.enemy.x, this.enemy.y);
            if (distance < 50) {
                console.log('Enemy caught you! Game over!');
                this.add.text(400, 300, 'GAME OVER', {
                    fontSize: '48px',
                    fill: '#fff',
                    backgroundColor: '#000',
                    padding: { x: 20, y: 10 }
                }).setOrigin(0.5);

                // Restart the scene after a delay
                this.time.delayedCall(3000, () => {
                    this.scene.restart();
                });
            }
        }
    }
}