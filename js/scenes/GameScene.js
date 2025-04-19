class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // add debug display
        this.debugText = null;
    }

    create() {
        // Create ground
        this.ground = this.matter.add.image(400, 580, 'ground', null, {
            isStatic: true,
            label: 'ground'
        });
        this.ground.setScale(1, 1);

        // Calculate ground top position for placing character
        const groundTop = this.ground.y - this.ground.height / 2;

        // Create character parts and joints
        this.createCharacter(200, groundTop);

        // Set up controls
        this.setupControls();

        // Add a single enemy
        this.enemy = this.matter.add.image(600, groundTop - 30, 'enemy', null, {
            label: 'enemy'
        });
        this.enemy.health = 3;

        // Add safehouse
        this.safehouse = this.matter.add.image(700, groundTop - 40, 'safehouse', null, {
            isStatic: true,
            label: 'safehouse'
        });

        // Set up collision detection
        this.setupCollisions();

        // Add instructions text
        this.add.text(400, 50, 'Use Q/A for left arm, P/L for right arm\nW/S for left leg, O/K for right leg', {
            fontSize: '16px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add debug text to show why game resets
        this.debugText = this.add.text(400, 100, '', {
            fontSize: '14px',
            fill: '#ff0',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Game is active flag
        this.gameActive = true;
    }

    update() {
        if (!this.gameActive) return;

        // Handle character balance
        this.updateBalance();

        // Update enemy AI
        this.updateEnemies();

        // Check win/lose conditions
        this.checkGameState();

        // Update debug text
        this.updateDebugText();
    }

    // Create character with connected body parts
    createCharacter(x, groundY) {
        // Create body parts - position them so feet are on ground
        // Assuming leg height is 60, torso is 80
        const legHeight = 60;
        const torsoHeight = 80;
        const torsoY = groundY - legHeight - torsoHeight/2;

        this.torso = this.matter.add.image(x, torsoY, 'torso', null, {
            label: 'torso'
        });

        this.head = this.matter.add.image(x, torsoY - 40, 'head', null, {
            label: 'head'
        });

        this.leftArm = this.matter.add.image(x - 40, torsoY, 'arm', null, {
            label: 'leftArm'
        });
        this.rightArm = this.matter.add.image(x + 40, torsoY, 'arm', null, {
            label: 'rightArm'
        });

        this.leftLeg = this.matter.add.image(x - 15, torsoY + 50, 'leg', null, {
            label: 'leftLeg'
        });
        this.rightLeg = this.matter.add.image(x + 15, torsoY + 50, 'leg', null, {
            label: 'rightLeg'
        });

        // Connect parts with joints
        // Head to torso
        this.matter.add.joint(this.leftArm, this.torso, 0, 0.7, {
            pointA: { x: 25, y: 0 },
            pointB: { x: -20, y: -10 }
        });
        this.matter.add.joint(this.rightArm, this.torso, 0, 0.7, {
            pointA: { x: -25, y: 0 },
            pointB: { x: 20, y: -10 }
        });

        // Legs to torso
        this.matter.add.joint(this.leftLeg, this.torso, 0, 0.7, {
            pointA: { x: 0, y: -25 },
            pointB: { x: -15, y: 30 }
        });
        this.matter.add.joint(this.rightLeg, this.torso, 0, 0.7, {
            pointA: { x: 0, y: -25 },
            pointB: { x: 15, y: 30 }
        });

        // Group body parts for easier access
        this.bodyParts = [this.torso, this.head, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg];
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
        const force = 0.03;

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

        // Basic balance check - only check if torso is clearly fallen over
        // Increased threshold to avoid premature resets
        if (this.torso.y > this.ground.y - 20) {
            this.gameOver("Character fell on the ground!");
        }
        else if (Math.abs(this.torso.rotation) > 1.8) {
            this.gameOver("Character fell over!");
        }
    }

    // Set up collision detection
    setupCollisions() {
        // Check for collisions between limbs and enemies
        this.matter.world.on('collisionstart', (event) => {
            if (!this.gameActive) return;

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
        if (!enemy.active || !this.gameActive) return;
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
            const speed = 0.001;
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