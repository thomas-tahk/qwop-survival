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
        // Create torso
        this.character.parts.torso = this.matter.add.image(x, torsoY, 'torso', null, {
            label: 'torso',
            density: 0.01,
            frictionAir: 0.03, // Reduced air friction
            friction: 0.3,     // Increased ground friction
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create head
        this.character.parts.head = this.matter.add.image(x, torsoY - 50, 'head', null, {
            label: 'head',
            density: 0.005,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create upper arms
        this.character.parts.leftUpperArm = this.matter.add.image(x - 30, torsoY - 20, 'arm', null, {
            label: 'leftUpperArm',
            density: 0.004,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperArm = this.matter.add.image(x + 30, torsoY - 20, 'arm', null, {
            label: 'rightUpperArm',
            density: 0.004,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create lower arms (forearms)
        this.character.parts.leftLowerArm = this.matter.add.image(x - 60, torsoY - 20, 'arm', null, {
            label: 'leftLowerArm',
            density: 0.003,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLowerArm = this.matter.add.image(x + 60, torsoY - 20, 'arm', null, {
            label: 'rightLowerArm',
            density: 0.003,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create upper legs (thighs)
        this.character.parts.leftUpperLeg = this.matter.add.image(x - 15, torsoY + 30, 'leg', null, {
            label: 'leftUpperLeg',
            density: 0.005,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperLeg = this.matter.add.image(x + 15, torsoY + 30, 'leg', null, {
            label: 'rightUpperLeg',
            density: 0.005,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create lower legs (calves)
        this.character.parts.leftLowerLeg = this.matter.add.image(x - 15, torsoY + 70, 'leg', null, {
            label: 'leftLowerLeg',
            density: 0.006,
            frictionAir: 0.02,
            friction: 0.5, // Higher friction for feet to grip ground
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLowerLeg = this.matter.add.image(x + 15, torsoY + 70, 'leg', null, {
            label: 'rightLowerLeg',
            density: 0.006,
            frictionAir: 0.02,
            friction: 0.5, // Higher friction for feet to grip ground
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });
    }

    createCharacterJoints() {
        // Head to torso joint (same as before)
        this.matter.add.joint(
            this.character.parts.head,
            this.character.parts.torso,
            15, 0.4, {
                pointA: { x: 0, y: 15 },
                pointB: { x: 0, y: -40 }
            }
        );

        // Upper arm to torso joints (shoulders)
        this.matter.add.joint(
            this.character.parts.leftUpperArm,
            this.character.parts.torso,
            8, 0.4, {
                pointA: { x: 25, y: 0 },
                pointB: { x: -20, y: -30 }
            }
        );

        this.matter.add.joint(
            this.character.parts.rightUpperArm,
            this.character.parts.torso,
            8, 0.4, {
                pointA: { x: -25, y: 0 },
                pointB: { x: 20, y: -30 }
            }
        );

        // Lower arm to upper arm joints (elbows)
        this.matter.add.joint(
            this.character.parts.leftLowerArm,
            this.character.parts.leftUpperArm,
            8, 0.4, {
                pointA: { x: 25, y: 0 },
                pointB: { x: -25, y: 0 }
            }
        );

        this.matter.add.joint(
            this.character.parts.rightLowerArm,
            this.character.parts.rightUpperArm,
            8, 0.4, {
                pointA: { x: -25, y: 0 },
                pointB: { x: 25, y: 0 }
            }
        );

        // Upper leg to torso joints (hips)
        this.matter.add.joint(
            this.character.parts.leftUpperLeg,
            this.character.parts.torso,
            8, 0.4, {
                pointA: { x: 0, y: -25 },
                pointB: { x: -15, y: 30 }
            }
        );

        this.matter.add.joint(
            this.character.parts.rightUpperLeg,
            this.character.parts.torso,
            8, 0.4, {
                pointA: { x: 0, y: -25 },
                pointB: { x: 15, y: 30 }
            }
        );

        // Lower leg to upper leg joints (knees)
        this.matter.add.joint(
            this.character.parts.leftLowerLeg,
            this.character.parts.leftUpperLeg,
            8, 0.4, {
                pointA: { x: 0, y: -25 },
                pointB: { x: 0, y: 25 }
            }
        );

        this.matter.add.joint(
            this.character.parts.rightLowerLeg,
            this.character.parts.rightUpperLeg,
            8, 0.4, {
                pointA: { x: 0, y: -25 },
                pointB: { x: 0, y: 25 }
            }
        );
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
        // Define QWOP-style control keys
        this.keys = {
            // Thigh controls
            q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),

            // Calf controls
            o: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
            p: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),

            // Arm control (both arms)
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),

            // Game controls
            esc: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
            r: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),

            // Restart after game over
            restart: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };

        // Set up key events
        this.keys.esc.on('down', () => {
            this.togglePause();
        });

        this.keys.r.on('down', () => {
            this.resetGame();
        });
    }

    handleCharacterControl() {
        if (!this.gameActive || this.isPaused) return;

        const force = 0.05;

        // Thigh controls (Q and W)
        if (this.keys.q.isDown) {
            // Q: Right thigh forward, left thigh backward
            this.character.parts.rightUpperLeg.applyForce({ x: force, y: 0 });
            this.character.parts.leftUpperLeg.applyForce({ x: -force, y: 0 });
        }

        if (this.keys.w.isDown) {
            // W: Left thigh forward, right thigh backward
            this.character.parts.leftUpperLeg.applyForce({ x: force, y: 0 });
            this.character.parts.rightUpperLeg.applyForce({ x: -force, y: 0 });
        }

        // Calf controls (O and P)
        if (this.keys.o.isDown) {
            // O: Right calf forward, left calf backward
            this.character.parts.rightLowerLeg.applyForce({ x: force, y: 0 });
            this.character.parts.leftLowerLeg.applyForce({ x: -force, y: 0 });
        }

        if (this.keys.p.isDown) {
            // P: Left calf forward, right calf backward
            this.character.parts.leftLowerLeg.applyForce({ x: force, y: 0 });
            this.character.parts.rightLowerLeg.applyForce({ x: -force, y: 0 });
        }

        // Arm control (SPACE) - swing both arms forward
        if (this.keys.space.isDown) {
            this.character.parts.leftUpperArm.applyForce({ x: force, y: -force/2 });
            this.character.parts.rightUpperArm.applyForce({ x: force, y: -force/2 });
        }
    }

    applyLimbControl(upperLimbName, lowerLimbName, baseForce) {
        // Extract the limb type from the name (leftArm, rightArm, leftLeg, rightLeg)
        const limbType = upperLimbName.includes('Arm') ?
            upperLimbName.replace('Upper', '') :
            upperLimbName.replace('Upper', '');

        const upperLimb = this.character.parts[upperLimbName];
        const lowerLimb = this.character.parts[lowerLimbName];
        const control = this.controls[limbType];

        // Skip if limbs are destroyed
        if (!upperLimb || !upperLimb.active || !lowerLimb || !lowerLimb.active) return;

        // Initialize cooldown property if not exists
        if (typeof upperLimb.cooldown === 'undefined') {
            upperLimb.cooldown = 0;
        }

        // Reduce cooldown
        if (upperLimb.cooldown > 0) {
            upperLimb.cooldown--;
        }

        // Apply forces if cooldown allows
        if (upperLimb.cooldown <= 0) {
            let forceApplied = false;

            // Apply vertical forces to upper limb
            if (control.up.isDown) {
                upperLimb.applyForce({ x: 0, y: -baseForce });
                forceApplied = true;
            }
            else if (control.down.isDown) {
                upperLimb.applyForce({ x: 0, y: baseForce });
                forceApplied = true;
            }

            // Apply horizontal forces to lower limb for movement
            if (control.left.isDown) {
                lowerLimb.applyForce({ x: -baseForce, y: 0 });
                forceApplied = true;
            }
            else if (control.right.isDown) {
                lowerLimb.applyForce({ x: baseForce, y: 0 });
                forceApplied = true;
            }

            // Set cooldown if force was applied
            if (forceApplied) {
                upperLimb.cooldown = 1; // Reduced for more responsive controls
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
        // Create enemy with more noticeable appearance
        this.enemy = this.matter.add.image(x, y, 'enemy', null, {
            label: 'enemy',
            density: 0.005,
            frictionAir: 0.05,
            collisionFilter: { group: 0, category: 4, mask: 255 }
        });

        // Make enemy slightly larger
        this.enemy.setScale(1.2);

        // Create invisible mouth part at the front of the enemy
        const mouthSize = { width: 20, height: 10 };
        this.enemyMouth = this.matter.add.rectangle(
            x - 20,
            y,
            mouthSize.width,
            mouthSize.height,
            {
                label: 'enemyMouth',
                isSensor: true,
                collisionFilter: { group: 0, category: 8, mask: 2 }
            }
        );

        // Connect mouth to enemy body
        this.matter.add.joint(this.enemy, this.enemyMouth, 0, 1);

        // Store enemy properties
        this.enemy.speed = 0.001; // Faster speed to make it more threatening
        this.enemy.mouth = this.enemyMouth;

        // Add pulsing effect to make enemy more noticeable
        this.tweens.add({
            targets: this.enemy,
            alpha: 0.8,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    updateEnemies() {
        // Skip if enemy is inactive
        if (!this.enemy || !this.enemy.active) return;

        // Move enemy toward player
        const dx = this.character.parts.torso.x - this.enemy.x;
        const speed = 0.002; // Increased from 0.0005 to be more noticeable

        // Apply horizontal force toward player
        this.enemy.applyForce({ x: Math.sign(dx) * speed, y: 0 });

        // Update mouth position
        if (this.enemyMouth) {
            const mouthOffset = dx > 0 ? 20 : -20;
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
        // Initialize torso ground contact tracker
        this.torsoGroundContact = null;

        // Set up collision detection
        this.matter.world.on('collisionstart', (event) => {
            if (!this.gameActive) return;

            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check for torso touching ground
                if (this.isCollisionBetween(pair, 'torso', 'ground')) {
                    if (!this.torsoGroundContact) {
                        this.torsoGroundContact = {
                            time: this.time.now,
                            velocity: this.character.parts.torso.body.velocity.y
                        };
                    }
                    return;
                }

                // Check for reaching safehouse
                if (this.isCollisionBetween(pair, 'torso', 'safehouse')) {
                    this.winGame();
                    return;
                }

                // Check for arm collisions with enemy - more effective pushback
                const isArm = (body) => body.label && body.label.includes('Arm');
                const isEnemy = (body) => body.label === 'enemy';

                if ((isArm(bodyA) && isEnemy(bodyB)) || (isEnemy(bodyA) && isArm(bodyB))) {
                    const enemy = isEnemy(bodyA) ? bodyA.gameObject : bodyB.gameObject;

                    // Strong pushback when hitting enemy with arms
                    const pushForce = 0.001; // Increased force for more noticeable effect
                    const direction = isArm(bodyA) ? 1 : -1;

                    // Apply stronger push force to enemy
                    enemy.applyForce({ x: direction * pushForce, y: -pushForce/2 });

                    // Visual feedback
                    this.cameras.main.shake(100, 0.01);

                    // Play feedback sound if you want to add sound later
                    console.log("Enemy hit!");
                }
            });
        });

        // Add collision end detection to reset torso ground contact
        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach((pair) => {
                if (this.isCollisionBetween(pair, 'torso', 'ground')) {
                    this.torsoGroundContact = null;
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
        // Check for torso on ground for too long
        if (this.torsoGroundContact && this.time.now - this.torsoGroundContact.time > 500) {
            this.gameOver("Character fell down!");
            return;
        }

        // Check for out of bounds
        if (this.character.parts.torso) {
            const torsoX = this.character.parts.torso.x;
            const torsoY = this.character.parts.torso.y;

            if (torsoX < 0 || torsoX > 800 || torsoY < 0 || torsoY > 600) {
                this.gameOver("Out of bounds!");
                return;
            }
        }

        // Check for tilt (if torso is too rotated)
        if (this.character.parts.torso && Math.abs(this.character.parts.torso.rotation) > 1.8) {
            this.gameOver("Character fell over!");
            return;
        }

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
        // Add instructions text for QWOP controls
        this.add.text(400, 30, 'ESC to pause, R to reset', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 70, 'Classic QWOP controls:\nQ/W: Thighs, O/P: Calves\nSPACE: Swing arms to defend', {
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

        // Create simpler limb labels
        this.createLimbLabels();
    }

    // Simpler limb labels
    createLimbLabels() {
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

            limb.controlLabel = label;
        };

        // Just label the main control points
        createLabel(this.character.parts.leftUpperLeg, "W");
        createLabel(this.character.parts.rightUpperLeg, "Q");
        createLabel(this.character.parts.leftLowerLeg, "P");
        createLabel(this.character.parts.rightLowerLeg, "O");
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

        // Count active limbs (upper and lower segments)
        const activeLimbParts = [
            'leftUpperArm', 'leftLowerArm', 'rightUpperArm', 'rightLowerArm',
            'leftUpperLeg', 'leftLowerLeg', 'rightUpperLeg', 'rightLowerLeg'
        ].filter(part => this.character.parts[part] && this.character.parts[part].active).length;

        const totalLimbParts = 8; // 4 limbs * 2 segments each

        // Update debug text
        this.debugText.setText(
            `Torso: x=${Math.round(this.character.parts.torso.x)}, ` +
            `y=${Math.round(this.character.parts.torso.y)}, ` +
            `rotation=${this.character.parts.torso.rotation.toFixed(2)}\n` +
            `Limb parts: ${activeLimbParts}/${totalLimbParts}\n` +
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