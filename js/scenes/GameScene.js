class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.debugText = null;
        this.gameActive = true;
        this.isPaused = false;
        this.character = null;
        this.enemy = null;
        this.enemyMouth = null;
        this.ground = null;
        this.safehouse = null;
        this.pauseText = null;
        this.controls = null;
    }

    //-------------------------------------------------------------------------
    // Main Game Loop Methods
    //-------------------------------------------------------------------------

    create() {
        // Setup world components
        this.setupWorld();

        // Setup gameplay elements
        this.createCharacter(200, this.groundTop);
        this.setupControls();
        this.createEnemy(600, this.groundTop - 30);
        this.createSafehouse();

        // Setup game mechanics
        this.setupCollisions();
        this.setupGameStateManagement();

        // Setup UI
        this.setupGameUI();
    }

    update() {
        if (!this.gameActive || this.isPaused) return;

        // Update gameplay elements
        this.handleCharacterControl();
        this.updateEnemies();

        // Update UI
        this.updateDebugText();
        this.updateLimbLabels();

        // Check for game state changes
        this.checkGameState();
    }

    //-------------------------------------------------------------------------
    // World Setup
    //-------------------------------------------------------------------------

    setupWorld() {
        // Create ground
        this.ground = this.matter.add.image(400, 580, 'ground', null, {
            isStatic: true,
            label: 'ground',
            friction: 0.5,
            collisionFilter: { group: 0, category: 1, mask: 255 }
        });
        this.ground.setScale(1, 1);

        // Store ground top position for reference
        this.groundTop = this.ground.y - this.ground.height / 2;
    }

    //-------------------------------------------------------------------------
    // Character Creation and Control
    //-------------------------------------------------------------------------

    createCharacter(x, groundY) {
        // Character group - for tracking all body parts
        this.character = {
            parts: {},
            health: 10
        };

        // Calculate positions
        const legHeight = 60;
        const torsoY = groundY - legHeight - 60; // Position torso above ground

        // Create body parts
        this.createCharacterParts(x, torsoY);

        // Create joints to connect body parts
        this.createCharacterJoints();

        // Set initial limb health
        this.initLimbHealth();
    }

    createCharacterParts(x, torsoY) {
        // Create torso as the main body
        this.character.parts.torso = this.matter.add.image(x, torsoY, 'torso', null, {
            label: 'torso',
            density: 0.01,
            frictionAir: 0.05,
            friction: 0.2,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create head at top of torso
        this.character.parts.head = this.matter.add.image(x, torsoY - 50, 'head', null, {
            label: 'head',
            density: 0.005,
            frictionAir: 0.05,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create arms
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

        // Create legs
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
    }

    createCharacterJoints() {
        const torso = this.character.parts.torso;
        const head = this.character.parts.head;
        const leftArm = this.character.parts.leftArm;
        const rightArm = this.character.parts.rightArm;
        const leftLeg = this.character.parts.leftLeg;
        const rightLeg = this.character.parts.rightLeg;

        // Head to torso - fix head at the TOP of torso
        this.matter.add.joint(head, torso, 15, 0.4, {
            pointA: { x: 0, y: 15 }, // Bottom of head
            pointB: { x: 0, y: -40 }  // Top of torso
        });

        // Arms to torso - position at shoulder height
        this.matter.add.joint(leftArm, torso, 8, 0.4, {
            pointA: { x: 25, y: 0 },
            pointB: { x: -20, y: -30 } // Upper torso
        });

        this.matter.add.joint(rightArm, torso, 8, 0.4, {
            pointA: { x: -25, y: 0 },
            pointB: { x: 20, y: -30 } // Upper torso
        });

        // Legs to torso - position at hip height
        this.matter.add.joint(leftLeg, torso, 8, 0.4, {
            pointA: { x: 0, y: -25 },
            pointB: { x: -15, y: 30 } // Lower torso
        });

        this.matter.add.joint(rightLeg, torso, 8, 0.4, {
            pointA: { x: 0, y: -25 },
            pointB: { x: 15, y: 30 } // Lower torso
        });
    }

    initLimbHealth() {
        // Set initial health for limbs (not torso or head)
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

    handleCharacterControl() {
        // Apply controlled forces to limbs
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
                limb.cooldown = 2; // Lower cooldown for more responsive controls
            }
        }
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

                // Remove label if it exists
                if (limb.controlLabel) {
                    limb.controlLabel.destroy();
                }

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

    //-------------------------------------------------------------------------
    // Enemy Creation and Control
    //-------------------------------------------------------------------------

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

    //-------------------------------------------------------------------------
    // Safe House
    //-------------------------------------------------------------------------

    createSafehouse() {
        this.safehouse = this.matter.add.image(700, this.groundTop - 40, 'safehouse', null, {
            isStatic: true,
            label: 'safehouse'
        });
    }

    //-------------------------------------------------------------------------
    // Collision Handling
    //-------------------------------------------------------------------------

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

    //-------------------------------------------------------------------------
    // Game State Management
    //-------------------------------------------------------------------------

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

    gameOver(reason) {
        if (!this.gameActive) return;

        this.gameActive = false;
        console.log('Game over:', reason);

        // Freeze physics
        this.matter.world.enabled = false;

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

    //-------------------------------------------------------------------------
    // UI Elements
    //-------------------------------------------------------------------------

    setupGameUI() {
        // Add instructions text
        this.add.text(400, 30, 'ESC to pause, R to reset', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 70, 'Use Q/A for left arm, P/L for right arm\nW/S for left leg, O/K for right leg', {
            fontSize: '16px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add debug text
        this.debugText = this.add.text(20, 20, '', {
            fontSize: '14px',
            fill: '#ff0',
            backgroundColor: '#333',
            padding: { x: 5, y: 5 }
        });

        // Create limb control labels
        this.createLimbLabels();
    }

    createLimbLabels() {
        // Create label for each limb
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

        // Create labels for each limb
        createLabel(this.character.parts.leftArm, "Q/A");
        createLabel(this.character.parts.rightArm, "P/L");
        createLabel(this.character.parts.leftLeg, "W/S");
        createLabel(this.character.parts.rightLeg, "O/K");
    }

    updateLimbLabels() {
        // Update position of each label to follow its limb
        Object.values(this.character.parts).forEach(part => {
            if (part && part.active && part.controlLabel) {
                part.controlLabel.setPosition(part.x, part.y);
            }
        });
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
}