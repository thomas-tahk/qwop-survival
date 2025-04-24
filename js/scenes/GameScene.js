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

    // Add distance tracking in update
    update() {
        if (!this.gameActive || this.isPaused) return;

        // Update gameplay elements
        this.handleCharacterControl();
        this.updateEnemies();
        this.updateLimbLabels();

        // Update distance marker
        if (this.character && this.character.parts.torso) {
            const distance = Math.max(0, Math.floor(this.character.parts.torso.x / 10));
            this.distanceText.setText(`Distance: ${distance}m`);
        }

        // Check for game state changes
        this.checkGameState();
    }

    //-------------------------------------------------------------------------
    // World Setup
    //-------------------------------------------------------------------------

    setupWorld() {
        // Create a wider ground for scrolling
        this.ground = this.matter.add.image(800, 580, 'ground', null, {
            isStatic: true,
            label: 'ground',
            friction: 0.5,
        });
        this.ground.setScale(3, 1); // 3x wider for scrolling

        // Store ground top position for reference
        this.groundTop = this.ground.y - this.ground.height / 2;

        // Setup camera
        this.cameras.main.setBounds(0, 0, 800 * 2, 600); // 2 screen widths

        // Set world bounds
        this.matter.world.setBounds(0, 0, 800 * 2, 600);

        // Create finish line at the end
        this.finishLine = this.matter.add.image(800 * 2 - 100, this.groundTop - 60, 'finishLine', null, {
            isStatic: true,
            label: 'finishLine',
            isSensor: true
        });
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
        // Create torso with better stability
        this.character.parts.torso = this.matter.add.image(x, torsoY, 'torso', null, {
            label: 'torso',
            density: 0.012,  // Slightly heavier for stability
            frictionAir: 0.02, // Less air friction for better movement
            friction: 0.2,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create head
        this.character.parts.head = this.matter.add.image(x, torsoY - 50, 'head', null, {
            label: 'head',
            density: 0.005,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create upper arms
        this.character.parts.leftUpperArm = this.matter.add.image(x - 30, torsoY - 20, 'arm', null, {
            label: 'leftUpperArm',
            density: 0.003,  // Lighter arms
            frictionAir: 0.03, // More air friction to limit momentum
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperArm = this.matter.add.image(x + 30, torsoY - 20, 'arm', null, {
            label: 'rightUpperArm',
            density: 0.003,  // Lighter arms
            frictionAir: 0.03, // More air friction to limit momentum
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create lower arms (forearms)
        this.character.parts.leftLowerArm = this.matter.add.image(x - 60, torsoY - 20, 'arm', null, {
            label: 'leftLowerArm',
            density: 0.002,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLowerArm = this.matter.add.image(x + 60, torsoY - 20, 'arm', null, {
            label: 'rightLowerArm',
            density: 0.002,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create upper legs (thighs) - heavier for better ground contact
        this.character.parts.leftUpperLeg = this.matter.add.image(x - 15, torsoY + 30, 'leg', null, {
            label: 'leftUpperLeg',
            density: 0.007,  // Heavier legs
            frictionAir: 0.01,  // Less air friction
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperLeg = this.matter.add.image(x + 15, torsoY + 30, 'leg', null, {
            label: 'rightUpperLeg',
            density: 0.007,  // Heavier legs
            frictionAir: 0.01,  // Less air friction
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create lower legs (calves) with high friction for gripping
        this.character.parts.leftLowerLeg = this.matter.add.image(x - 15, torsoY + 70, 'leg', null, {
            label: 'leftLowerLeg',
            density: 0.008,
            frictionAir: 0.01,
            friction: 0.7,  // High friction for ground gripping
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLowerLeg = this.matter.add.image(x + 15, torsoY + 70, 'leg', null, {
            label: 'rightLowerLeg',
            density: 0.008,
            frictionAir: 0.01,
            friction: 0.7,  // High friction for ground gripping
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

        // QWOP controls with adjusted forces
        const legForce = 0.04;   // Force for legs
        const armForce = 0.015;  // Reduced force for arms (1/3 of leg force)

        // Thigh controls (Q and W)
        if (this.keys.q.isDown) {
            // Q: Right thigh forward, left thigh backward
            this.character.parts.rightUpperLeg.applyForce({ x: legForce, y: 0 });
            this.character.parts.leftUpperLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        if (this.keys.w.isDown) {
            // W: Left thigh forward, right thigh backward
            this.character.parts.leftUpperLeg.applyForce({ x: legForce, y: 0 });
            this.character.parts.rightUpperLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        // Calf controls (O and P)
        if (this.keys.o.isDown) {
            // O: Right calf forward, left calf backward
            this.character.parts.rightLowerLeg.applyForce({ x: legForce, y: -legForce/4 });
            this.character.parts.leftLowerLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        if (this.keys.p.isDown) {
            // P: Left calf forward, right calf backward
            this.character.parts.leftLowerLeg.applyForce({ x: legForce, y: -legForce/4 });
            this.character.parts.rightLowerLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        // Space for arm defense (with cooldown)
        if (this.keys.space.isDown && (!this.lastArmSwing || this.time.now - this.lastArmSwing > 1000)) {
            this.character.parts.leftUpperArm.applyForce({ x: armForce, y: -armForce });
            this.character.parts.rightUpperArm.applyForce({ x: armForce, y: -armForce });
            this.lastArmSwing = this.time.now;
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
        // Create enemy with better appearance
        this.enemy = this.matter.add.image(x, y, 'enemy', null, {
            label: 'enemy',
            density: 0.005,
            frictionAir: 0.05,
            collisionFilter: { group: 0, category: 4, mask: 255 }
        });

        // Make enemy slightly larger
        this.enemy.setScale(1.5);

        // Create visible mouth part
        const mouthSize = { width: 30, height: 15 };
        this.enemyMouth = this.matter.add.rectangle(
            x - 30, // Position at the front
            y,
            mouthSize.width,
            mouthSize.height,
            {
                label: 'enemyMouth',
                isSensor: true,
                collisionFilter: { group: 0, category: 8, mask: 2 }
            }
        );

        // Connect mouth to enemy
        this.matter.add.joint(this.enemy, this.enemyMouth, 0, 1);

        // Store enemy properties
        this.enemy.speed = 0.001;
        this.enemy.mouth = this.enemyMouth;
    }

    // Respawn enemy when player moves to a new screen section
    updateEnemies() {
        // Skip if enemy is inactive
        if (!this.enemy || !this.enemy.active) {
            // Respawn enemy if it was destroyed
            const playerX = this.character.parts.torso.x;
            this.createEnemy(playerX + 400, this.groundTop - 50);
            return;
        }

        // Check if enemy is too far behind or ahead
        const playerX = this.character.parts.torso.x;
        const cameraX = this.cameras.main.scrollX;

        if (this.enemy.x < cameraX - 100 || this.enemy.x > cameraX + 900) {
            // Reposition enemy ahead of player
            this.enemy.destroy();
            if (this.enemyMouth) {
                this.matter.world.remove(this.enemyMouth);
            }

            // Create new enemy ahead of player
            this.createEnemy(playerX + 400, this.groundTop - 50);
            return;
        }

        // Move enemy toward player
        const dx = playerX - this.enemy.x;
        const speed = 0.001;

        // Apply horizontal force toward player
        this.enemy.applyForce({ x: Math.sign(dx) * speed, y: 0 });

        // Update mouth position
        if (this.enemyMouth) {
            const mouthOffset = dx > 0 ? 30 : -30;
            this.matter.body.setPosition(this.enemyMouth, {
                x: this.enemy.x + mouthOffset,
                y: this.enemy.y
            });
        }
    }

    //-------------------------------------------------------------------------
    // Safe House
    //-------------------------------------------------------------------------

    // Replace safehouse creation with camera setup
    createSafehouse() {
        // Set camera to follow the player
        this.cameras.main.startFollow(this.character.parts.torso, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(-200, 0); // Keep player to the left of center
    }

    //-------------------------------------------------------------------------
    // Collision Handling
    //-------------------------------------------------------------------------

    // Update collision checks for finish line
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

                // Check for reaching finish line
                if (this.isCollisionBetween(pair, 'torso', 'finishLine')) {
                    this.winGame();
                    return;
                }

                // Check for arm collisions with enemy - more effective pushback
                const isArm = (body) => body.label && body.label.includes('Arm');
                const isEnemy = (body) => body.label === 'enemy';

                if ((isArm(bodyA) && isEnemy(bodyB)) || (isEnemy(bodyA) && isArm(bodyB))) {
                    const enemy = isEnemy(bodyA) ? bodyA.gameObject : bodyB.gameObject;

                    // Strong pushback when hitting enemy with arms
                    const pushForce = 0.003; // Increased for visual effect
                    const direction = isArm(bodyA) ? 1 : -1;

                    // Apply push force to enemy
                    enemy.applyForce({ x: direction * pushForce, y: -pushForce/2 });

                    // Visual feedback
                    this.cameras.main.shake(200, 0.01);

                    // Flash enemy to show impact
                    this.tweens.add({
                        targets: enemy,
                        alpha: 0.5,
                        duration: 50,
                        yoyo: true,
                        repeat: 3
                    });
                }

                // Check for enemy mouth contact with character parts for damage
                if (bodyA.label === 'enemyMouth' || bodyB.label === 'enemyMouth') {
                    const otherBody = bodyA.label === 'enemyMouth' ? bodyB : bodyA;

                    // Skip if not a character part
                    if (!otherBody.label || (!otherBody.label.includes('Arm') && !otherBody.label.includes('Leg'))) {
                        return;
                    }

                    // Find the limb game object
                    const limb = otherBody.gameObject;
                    if (limb && limb.active) {
                        this.damageLimb(limb);

                        // Strong camera shake for damage
                        this.cameras.main.shake(300, 0.03);

                        // Flash red to indicate damage
                        this.cameras.main.flash(100, 255, 0, 0, 0.3);
                    }
                }
            });
        });

        // Add collision end detection
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

    // Simplified UI setup - remove debug text, keep only essential instructions
    setupGameUI() {
        // Add simple instruction text
        const instructionText = this.add.text(400, 30,
            'QWOP Controls: Q/W move thighs, O/P move calves\nSPACE to swing arms and defend', {
                fontSize: '16px',
                fill: '#fff',
                align: 'center',
                backgroundColor: '#000000AA',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
        instructionText.setScrollFactor(0); // Fix to camera

        // Add distance marker
        this.distanceText = this.add.text(400, 70, 'Distance: 0m', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000000AA',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.distanceText.setScrollFactor(0); // Fix to camera
    }

    // Show simplified limb labels
    createLimbLabels() {
        // Just label the main control points with small indicators
        const labels = [
            { part: 'leftUpperLeg', text: 'W' },
            { part: 'rightUpperLeg', text: 'Q' },
            { part: 'leftLowerLeg', text: 'P' },
            { part: 'rightLowerLeg', text: 'O' }
        ];

        labels.forEach(({ part, text }) => {
            const limb = this.character.parts[part];
            if (limb && limb.active) {
                const label = this.add.text(limb.x, limb.y, text, {
                    fontSize: '14px',
                    fill: '#fff',
                    backgroundColor: '#000000AA',
                    padding: { x: 2, y: 1 }
                }).setOrigin(0.5);

                limb.controlLabel = label;
            }
        });
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