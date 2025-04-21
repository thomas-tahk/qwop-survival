class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.debugText = null;
        this.gameActive = true;
        this.pauseKey = null;
        this.resetKey = null;
        this.isPaused = false;
    }

    create() {
        // Set up ground
        this.ground = this.matter.add.image(400, 580, 'ground', null, {
            isStatic: true,
            label: 'ground',
            friction: 0.5, // Add friction to the ground
            collisionFilter: { group: 0, category: 1, mask: 255 }
        });
        this.ground.setScale(1, 1);

        // Create character - placed directly on ground
        const groundTop = this.ground.y - this.ground.height / 2;
        this.createCharacter(200, groundTop);

        // Set up controls
        this.setupControls();

        // Add enemy
        this.createEnemy(600, groundTop - 30);

        // Add safehouse
        this.safehouse = this.matter.add.image(700, groundTop - 40, 'safehouse', null, {
            isStatic: true,
            label: 'safehouse'
        });

        // Set up collision detection
        this.setupCollisions();

        // Game state management
        this.setupGameStateManagement();

        // Debug info
        this.setupDebugInfo();
    }

    // display control labels on limbs
    setupLimbLabels() {
        // Create a label for each limb showing its controls
        const createLabel = (limb, text) => {
            if (!limb || !limb.active) return;

            const style = {
                fontSize: '16px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 3, y: 2 }
            };

            const label = this.add.text(limb.x, limb.y, text, style);
            label.setOrigin(0.5);
            label.setDepth(10);

            // Store reference to update position
            limb.controlLabel = label;
        };

        createLabel(this.character.parts.leftArm, "Q/A");
        createLabel(this.character.parts.rightArm, "P/L");
        createLabel(this.character.parts.leftLeg, "W/S");
        createLabel(this.character.parts.rightLeg, "O/K");

        // Debug text in corner instead of overlapping
        this.debugText = this.add.text(20, 20, '', {
            fontSize: '14px',
            fill: '#ff0',
            backgroundColor: '#333',
            padding: { x: 5, y: 5 }
        });

        // Add instructions in a different location
        this.add.text(400, 30, 'ESC to pause, R to reset', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5);
    }

    setupGameStateManagement() {
        // Game is active by default
        this.gameActive = true;
        this.isPaused = false;

        // Add pause key (ESC)
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            this.togglePause();
        });

        // Add reset key (R)
        this.resetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.resetKey.on('down', () => {
            this.resetGame();
        });

        // Add pause and reset instructions
        this.add.text(400, 30, 'ESC to pause, R to reset', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5);
    }

    setupDebugInfo() {
        // Add instructions text
        this.add.text(400, 70, 'Use Q/A for left arm, P/L for right arm\nW/S for left leg, O/K for right leg', {
            fontSize: '16px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add debug text
        this.debugText = this.add.text(150, 20, '', {
            fontSize: '14px',
            fill: '#ff0',
            backgroundColor: '#333',
            padding: { x: 5, y: 5 }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Pause the game
            this.matter.world.enabled = false;

            // Add pause text
            this.pauseText = this.add.text(400, 300, 'PAUSED\nPress ESC to resume', {
                fontSize: '32px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5);
            this.pauseText.setDepth(100);
        } else {
            // Resume the game
            this.matter.world.enabled = true;

            // Remove pause text if it exists
            if (this.pauseText) {
                this.pauseText.destroy();
                this.pauseText = null;
            }
        }
    }

    resetGame() {
        // Make sure to unpause when resetting
        this.isPaused = false;
        this.scene.restart();
    }

    update() {
        if (!this.gameActive || this.isPaused) return;

        // Handle character control
        this.handleCharacterControl();

        // Update enemy movement
        this.updateEnemies();

        // Check win/lose conditions
        this.checkGameState();

        // Update debug text
        this.updateDebugText();

        // Update limb labels
        this.updateLimbLabels();
    }

    // method to update the limb labels
    updateLimbLabels() {
        // Update position of each label to follow its limb
        Object.values(this.character.parts).forEach(part => {
            if (part && part.active && part.controlLabel) {
                part.controlLabel.setPosition(part.x, part.y);
            }
        });
    }

    createCharacter(x, groundY) {
        // Character group - for tracking all body parts
        this.character = {
            parts: {},
            health: 10
        };

        // Calculate positions
        const legHeight = 60;
        const torsoY = groundY - legHeight - 60; // Position torso above ground

        // Create torso with increased stability values
        this.character.parts.torso = this.matter.add.image(x, torsoY, 'torso', null, {
            label: 'torso',
            density: 0.01,  // Heavier torso for stability
            frictionAir: 0.05, // More air friction to reduce movement
            friction: 0.2, // Add friction to reduce sliding
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create head at top of torso
        this.character.parts.head = this.matter.add.image(x, torsoY - 50, 'head', null, {
            label: 'head',
            density: 0.005,
            frictionAir: 0.05,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create limbs with better stability
        this.character.parts.leftArm = this.matter.add.image(x - 40, torsoY - 20, 'arm', null, {
            label: 'leftArm',
            density: 0.004,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightArm = this.matter.add.image(x + 40, torsoY - 20, 'arm', null, {
            label: 'rightArm',
            density: 0.004,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.leftLeg = this.matter.add.image(x - 15, torsoY + 50, 'leg', null, {
            label: 'leftLeg',
            density: 0.006,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLeg = this.matter.add.image(x + 15, torsoY + 50, 'leg', null, {
            label: 'rightLeg',
            density: 0.006,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Improved joints - fix head connection at the TOP of torso
        this.matter.add.joint(
            this.character.parts.head,
            this.character.parts.torso,
            15, // Increased stiffness for head
            0.4,  // Lower damping to reduce oscillation
            {
                pointA: { x: 0, y: 15 }, // Bottom of head
                pointB: { x: 0, y: -40 }  // TOP of torso
            }
        );

        // Arms to torso
        this.matter.add.joint(
            this.character.parts.leftArm,
            this.character.parts.torso,
            8,
            0.4,
            {
                pointA: { x: 25, y: 0 },
                pointB: { x: -20, y: -30 }
            }
        );

        this.matter.add.joint(
            this.character.parts.rightArm,
            this.character.parts.torso,
            8,
            0.4,
            {
                pointA: { x: -25, y: 0 },
                pointB: { x: 20, y: -30 } // Higher up on torso
            }
        );

        // Legs to torso
        this.matter.add.joint(
            this.character.parts.leftLeg,
            this.character.parts.torso,
            8,
            0.4,
            {
                pointA: { x: 0, y: -25 },
                pointB: { x: -15, y: 30 }
            }
        );

        this.matter.add.joint(
            this.character.parts.rightLeg,
            this.character.parts.torso,
            8,
            0.4,
            {
                pointA: { x: 0, y: -25 },
                pointB: { x: 15, y: 30 }
            }
        );

        // Set initial limb health
        Object.keys(this.character.parts).forEach(part => {
            if (part !== 'torso' && part !== 'head') {
                this.character.parts[part].health = 3;
            }
        });
    }

    setupControls() {
        // Define control keys
        this.controls = {
            leftArm: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
            },
            rightArm: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
            },
            leftLeg: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
            },
            rightLeg: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)
            }
        };
    }

    createEnemy(x, y) {
        // Create enemy with "mouth" (a separate collision zone)
        this.enemy = this.matter.add.image(x, y, 'enemy', null, {
            label: 'enemy',
            density: 0.005,
            frictionAir: 0.05,
            collisionFilter: { group: 0, category: 4, mask: 255 }
        });

        // Create invisible mouth part at the front of the enemy
        const mouthSize = { width: 20, height: 10 };
        this.enemyMouth = this.matter.add.rectangle(
            x - 20, // Position at the "front" of the enemy
            y,
            mouthSize.width,
            mouthSize.height,
            {
                label: 'enemyMouth',
                isSensor: true, // Makes it not physically collide but still detect collisions
                collisionFilter: { group: 0, category: 8, mask: 2 } // Only collide with character parts
            }
        );

        // Connect mouth to enemy body
        this.matter.add.joint(this.enemy, this.enemyMouth, 0, 1);

        // Store enemy properties
        this.enemy.speed = 0.0005;
        this.enemy.mouth = this.enemyMouth;
    }

    handleCharacterControl() {
        // Apply controlled forces to limbs
        // Use a smaller force and add cooldown to prevent spinning
        const force = 0.03;

        // Process each limb control
        this.applyLimbControl('leftArm', force);
        this.applyLimbControl('rightArm', force);
        this.applyLimbControl('leftLeg', force);
        this.applyLimbControl('rightLeg', force);
    }

    applyLimbControl(limbName, baseForce) {
        const limb = this.character.parts[limbName];
        const control = this.controls[limbName];

        // Skip if limb is destroyed
        if (!limb || !limb.active) return;

        // Initialize cooldown property if not exists
        if (typeof limb.cooldown === 'undefined') {
            limb.cooldown = 0;
        }

        // Reduce cooldown if active
        if (limb.cooldown > 0) {
            limb.cooldown--;
        }

        // Apply forces if cooldown allows
        if (limb.cooldown <= 0) {
            let forceApplied = false;

            if (control.up.isDown) {
                limb.applyForce({ x: 0, y: -baseForce });
                forceApplied = true;
            }
            else if (control.down.isDown) {
                limb.applyForce({ x: 0, y: baseForce });
                forceApplied = true;
            }

            // Set cooldown if force was applied
            if (forceApplied) {
                limb.cooldown = 2; // Adjust this value to control responsiveness
            }
        }
    }

    setupCollisions() {
        // Set up collision detection
        this.matter.world.on('collisionstart', (event) => {
            if (!this.gameActive) return;

            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check for torso touching ground (game over)
                if (this.isCollisionBetween(pair, 'torso', 'ground')) {
                    this.gameOver("Character fell down!");
                    return;
                }

                // Check for reaching safehouse
                if (this.isCollisionBetween(pair, 'torso', 'safehouse')) {
                    this.winGame();
                    return;
                }

                // Check for enemy mouth contact with limbs (damage)
                if (bodyA.label === 'enemyMouth' || bodyB.label === 'enemyMouth') {
                    const otherBody = bodyA.label === 'enemyMouth' ? bodyB : bodyA;

                    // Skip if not a limb
                    if (!['leftArm', 'rightArm', 'leftLeg', 'rightLeg'].includes(otherBody.label)) {
                        return;
                    }

                    // Find the limb game object
                    const limb = otherBody.gameObject;
                    if (limb && limb.active) {
                        this.damageLimb(limb);
                    }
                }

                // Check for limb pushing enemy
                const isLimb = (body) => ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'].includes(body.label);
                const isEnemy = (body) => body.label === 'enemy';

                if ((isLimb(bodyA) && isEnemy(bodyB)) || (isEnemy(bodyA) && isLimb(bodyB))) {
                    const limb = isLimb(bodyA) ? bodyA.gameObject : bodyB.gameObject;
                    const enemy = isEnemy(bodyA) ? bodyA.gameObject : bodyB.gameObject;

                    // Calculate push force based on collision velocity
                    const pushForce = 0.0002;
                    const direction = isLimb(bodyA) ? 1 : -1; // Push away from limb

                    // Apply push force to enemy
                    enemy.applyForce({ x: direction * pushForce, y: 0 });
                }
            });
        });
    }

    isCollisionBetween(pair, labelA, labelB) {
        return (pair.bodyA.label === labelA && pair.bodyB.label === labelB) ||
            (pair.bodyA.label === labelB && pair.bodyB.label === labelA);
    }

    damageLimb(limb) {
        // Skip if already damaged recently (cooldown)
        if (limb.damageTime && this.time.now - limb.damageTime < 1000) {
            return;
        }

        // Set damage time
        limb.damageTime = this.time.now;

        // Decrease health
        limb.health--;

        // Visual feedback
        this.tweens.add({
            targets: limb,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        // If health depleted, remove limb
        if (limb.health <= 0) {
            // Find the corresponding key in character.parts
            const limbKey = Object.keys(this.character.parts).find(key => this.character.parts[key] === limb);

            if (limbKey) {
                // Remove the limb
                limb.setActive(false).setVisible(false);
                this.character.parts[limbKey] = null;

                // Check if all limbs are gone
                const hasLimbs = ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'].some(
                    part => this.character.parts[part] && this.character.parts[part].active
                );

                if (!hasLimbs) {
                    this.gameOver("Lost all limbs!");
                }
            }
        }
    }

    updateEnemies() {
        // Skip if enemy is inactive
        if (!this.enemy || !this.enemy.active) return;

        // Move enemy toward player
        const dx = this.character.parts.torso.x - this.enemy.x;
        const speed = this.enemy.speed;

        // Apply horizontal force toward player
        this.enemy.applyForce({ x: Math.sign(dx) * speed, y: 0 });

        // Update mouth position to stay in front of enemy
        if (this.enemyMouth) {
            // Determine which side to place the mouth based on movement direction
            const mouthOffset = dx > 0 ? 20 : -20;

            // Update mouth position
            this.matter.body.setPosition(this.enemyMouth, {
                x: this.enemy.x + mouthOffset,
                y: this.enemy.y
            });
        }
    }

    checkGameState() {
        // Game over if torso touches ground (checked in collision detection)

        // Game over if all limbs are destroyed (checked in damageLimb)

        // Check if enemy is very close to torso
        if (this.enemy && this.enemy.active && this.character.parts.torso) {
            const distance = Phaser.Math.Distance.Between(
                this.character.parts.torso.x,
                this.character.parts.torso.y,
                this.enemy.x,
                this.enemy.y
            );

            if (distance < 30) {
                this.gameOver("Enemy got too close!");
            }
        }
    }

    updateDebugText() {
        if (!this.debugText || !this.character.parts.torso) return;

        // Count active limbs
        const activeLimbs = ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'].filter(
            part => this.character.parts[part] && this.character.parts[part].active
        ).length;

        // Update debug text
        this.debugText.setText(
            `Torso: x=${Math.round(this.character.parts.torso.x)}, ` +
            `y=${Math.round(this.character.parts.torso.y)}, ` +
            `rotation=${this.character.parts.torso.rotation.toFixed(2)}\n` +
            `Limbs remaining: ${activeLimbs}/4\n` +
            (this.enemy && this.enemy.active ?
                `Enemy distance: ${Phaser.Math.Distance.Between(
                    this.character.parts.torso.x,
                    this.character.parts.torso.y,
                    this.enemy.x,
                    this.enemy.y
                ).toFixed(0)}` :
                'Enemy defeated')
        );
    }

    gameOver(reason) {
        if (!this.gameActive) return;

        this.gameActive = false;
        console.log('Game over:', reason);

        // Add game over text
        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#880000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(100);

        // Add reason text
        this.add.text(400, 350, reason, {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100);

        // Add restart instructions
        this.add.text(400, 400, 'Press SPACE to try again', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100);

        // Allow restart with spacebar
        this.input.keyboard.once('keydown-SPACE', () => {
            this.resetGame();
        });
    }

    winGame() {
        if (!this.gameActive) return;

        this.gameActive = false;
        console.log('You win!');

        // Freeze physics
        this.matter.world.enabled = false;

        // Add win text
        this.add.text(400, 300, 'YOU WIN!', {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#00aa00',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(100);

        // Add restart instructions
        this.add.text(400, 400, 'Press SPACE to play again', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#00aa00',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100);

        // Allow restart with spacebar
        this.input.keyboard.once('keydown-SPACE', () => {
            this.resetGame();
        });
    }
}