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

        // Update distance marker - adjusted to start from 0
        if (this.character && this.character.parts.torso) {
            const distance = Math.max(0, Math.floor((this.character.parts.torso.x - 200) / 10));
            this.distanceText.setText(`Distance: ${distance}m`);
        }

        // Update limb health
        if (this.updateLimbHealth && this.healthText) {
            const activeLimbs = Object.keys(this.character.parts)
                .filter(key => key !== 'torso' && key !== 'head' && this.character.parts[key] && this.character.parts[key].active)
                .length;
            this.healthText.setText(`Limbs: ${activeLimbs}/8`);
        }

        // Check for game state changes
        this.checkGameState();
    }

    //-------------------------------------------------------------------------
    // World Setup
    //-------------------------------------------------------------------------

    setupWorld() {
        // Create ground
        this.ground = this.matter.add.image(800, 580, 'ground', null, {
            isStatic: true,
            label: 'ground',
            friction: 0.5,
        });
        this.ground.setScale(3, 1);

        this.groundTop = this.ground.y - this.ground.height / 2;

        // Setup camera & world bounds
        this.cameras.main.setBounds(0, 0, 800 * 2, 600);
        this.matter.world.setBounds(0, 0, 800 * 2, 600);

        // Create a MUCH larger finish line for easier detection
        this.finishLine = this.matter.add.image(800 * 2 - 100, this.groundTop - 60, 'finishLine', null, {
            isStatic: true,
            label: 'finishLine',
            isSensor: true // Important: makes it a sensor instead of solid
        });

        // Make it 5x wider & taller for better detection
        this.finishLine.setScale(5, 3);
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
            frictionAir: 0.01,
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
            density: 0.003,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperArm = this.matter.add.image(x + 30, torsoY - 20, 'arm', null, {
            label: 'rightUpperArm',
            density: 0.003,
            frictionAir: 0.03,
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

        // Create upper legs - CLOSER TOGETHER to prevent splits
        this.character.parts.leftUpperLeg = this.matter.add.image(x - 10, torsoY + 30, 'leg', null, {
            label: 'leftUpperLeg',
            density: 0.007,
            frictionAir: 0.01,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperLeg = this.matter.add.image(x + 10, torsoY + 30, 'leg', null, {
            label: 'rightUpperLeg',
            density: 0.007,
            frictionAir: 0.01,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create lower legs - CLOSER TOGETHER to prevent splits
        this.character.parts.leftLowerLeg = this.matter.add.image(x - 10, torsoY + 70, 'leg', null, {
            label: 'leftLowerLeg',
            density: 0.008,
            frictionAir: 0.01,
            friction: 0.7,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLowerLeg = this.matter.add.image(x + 10, torsoY + 70, 'leg', null, {
            label: 'rightLowerLeg',
            density: 0.008,
            frictionAir: 0.01,
            friction: 0.7,
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

        // MUCH higher forces for more dramatic movement
        const legForce = 0.15;   // Significantly increased force
        const armForce = 0.1;    // Significantly increased force

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

        // Space for arm control - stronger force
        if (this.keys.space.isDown) {
            if (!this.lastArmSwing || this.time.now - this.lastArmSwing > 300) {
                if (this.character.parts.leftUpperArm && this.character.parts.leftUpperArm.active) {
                    this.character.parts.leftUpperArm.applyForce({ x: armForce, y: -armForce });
                }

                if (this.character.parts.rightUpperArm && this.character.parts.rightUpperArm.active) {
                    this.character.parts.rightUpperArm.applyForce({ x: armForce, y: -armForce });
                }

                this.lastArmSwing = this.time.now;
            }
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
        if (!limb || !limb.active) return;

        // Longer cooldown protection
        if (limb.damageTime && this.time.now - limb.damageTime < 1500) {
            return;
        }

        limb.damageTime = this.time.now;
        console.log("Damaging limb:", limb.label); // Debug output

        // Decrease health
        if (typeof limb.health === 'undefined') {
            limb.health = 3; // Ensure health is initialized
        }

        limb.health--;

        // More dramatic visual feedback
        this.tweens.add({
            targets: limb,
            alpha: 0.3,
            duration: 150,
            yoyo: true,
            repeat: 3
        });

        // Very obvious color change
        if (limb.health === 2) {
            limb.setTint(0xffaa00);
        } else if (limb.health === 1) {
            limb.setTint(0xff0000);
        }

        // If health depleted, remove limb with particles
        if (limb.health <= 0) {
            // Find limb key
            const limbKey = Object.keys(this.character.parts)
                .find(key => this.character.parts[key] === limb);

            if (limbKey) {
                // Add particles at limb position
                const particles = this.add.particles(limb.x, limb.y, 'head', {
                    speed: { min: 50, max: 200 },
                    scale: { start: 0.2, end: 0 },
                    lifespan: 800,
                    quantity: 15,
                    blendMode: 'ADD'
                });

                // Auto-destroy particles
                this.time.delayedCall(800, () => particles.destroy());

                // Disable limb
                limb.setActive(false).setVisible(false);

                // Remove control label if exists
                if (limb.controlLabel) {
                    limb.controlLabel.destroy();
                }

                // Clear reference
                this.character.parts[limbKey] = null;

                // Very obvious notification
                const lostText = this.add.text(400, 250, `LOST ${limbKey}!`, {
                    fontSize: '36px',
                    fontStyle: 'bold',
                    fill: '#ff0000',
                    backgroundColor: '#000000',
                    padding: { x: 15, y: 10 }
                }).setOrigin(0.5);
                lostText.setScrollFactor(0);

                // Fade out notification
                this.tweens.add({
                    targets: lostText,
                    alpha: 0,
                    y: 200,
                    duration: 2000,
                    onComplete: () => lostText.destroy()
                });

                // Game over if too many limbs lost
                const activeLimbs = ['leftUpperArm', 'rightUpperArm', 'leftUpperLeg', 'rightUpperLeg']
                    .filter(part => this.character.parts[part] && this.character.parts[part].active)
                    .length;

                if (activeLimbs < 2) {
                    this.gameOver("Too many limbs lost!");
                }
            }
        }
    }

    createBrokenLimbEffect(x, y, limbKey) {
        // Create particles for broken limb effect
        const particles = this.add.particles(x, y, 'head', { // Using head texture as particle
            speed: 100,
            scale: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            quantity: 10
        });

        // Auto-destroy after animation completes
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
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
            // Respawn enemy
            const playerX = this.character.parts.torso.x;
            this.createEnemy(playerX + 400, this.groundTop - 50);
            return;
        }

        // Check if enemy is too far
        const playerX = this.character.parts.torso.x;
        const cameraX = this.cameras.main.scrollX;

        if (this.enemy.x < cameraX - 100 || this.enemy.x > cameraX + 900) {
            // Reposition enemy
            this.enemy.destroy();
            if (this.enemyMouth) {
                this.matter.world.remove(this.enemyMouth);
            }

            // Create new enemy ahead of player
            this.createEnemy(playerX + 400, this.groundTop - 50);
            return;
        }

        // MUCH more aggressive enemy movement
        const dx = this.character.parts.torso.x - this.enemy.x;
        const speed = 0.003; // 3x faster than before

        // Apply force toward player
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

                // Simplified finish line detection - check for ANY part
                if (bodyA.label === 'finishLine' || bodyB.label === 'finishLine') {
                    // Make sure one of the bodies is a character part
                    const otherBody = bodyA.label === 'finishLine' ? bodyB : bodyA;
                    if (otherBody.gameObject && otherBody.label) {
                        this.winGame();
                        return;
                    }
                }

                // More reliable enemy damage detection
                if (bodyA.label === 'enemyMouth' || bodyB.label === 'enemyMouth') {
                    const otherBody = bodyA.label === 'enemyMouth' ? bodyB : bodyA;
                    if (otherBody.gameObject && otherBody.label &&
                        (otherBody.label.includes('Arm') || otherBody.label.includes('Leg'))) {

                        // Push player back
                        this.character.parts.torso.applyForce({ x: -0.03, y: -0.01 });

                        // Damage limb
                        this.damageLimb(otherBody.gameObject);
                    }
                }
            });
        });

        // Handle collision end for ground contact
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
            // Pause physics
            this.matter.world.enabled = false;

            // Add pause overlay
            this.pauseText = this.add.text(400, 300, 'PAUSED\nPress ESC to resume', {
                fontSize: '32px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        } else {
            // Resume physics
            this.matter.world.enabled = true;

            // Remove pause overlay
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

        // Check out of bounds
        if (this.character.parts.torso) {
            const torsoX = this.character.parts.torso.x;
            const torsoY = this.character.parts.torso.y;

            if (torsoX < 0 || torsoX > 800 * 2 || torsoY < 0 || torsoY > 600) {
                this.gameOver("Out of bounds!");
                return;
            }
        }

        // More sensitive rotation check - fall over more easily
        if (this.character.parts.torso && Math.abs(this.character.parts.torso.rotation) > 1.3) { // Reduced from 1.8
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

        // Completely disable physics to prevent any processing
        this.matter.world.enabled = false;

        // Game over overlay
        const overlay = this.add.rectangle(0, 0, 2000, 1200, 0x000000, 0.5)
            .setOrigin(0).setScrollFactor(0).setDepth(900);

        // Add game over text
        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#880000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        // Add reason text
        this.add.text(400, 350, reason, {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        // Add restart instructions
        this.add.text(400, 400, 'Press SPACE to try again', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        // Allow restart with spacebar
        this.input.keyboard.once('keydown-SPACE', () => {
            this.resetGame();
        });
    }

    winGame() {
        if (!this.gameActive) return;

        this.gameActive = false;
        console.log('You win!');

        // Completely disable physics to prevent any processing
        this.matter.world.enabled = false;

        // Win overlay
        const overlay = this.add.rectangle(0, 0, 2000, 1200, 0x000000, 0.5)
            .setOrigin(0).setScrollFactor(0).setDepth(900);

        // Add win text
        this.add.text(400, 300, 'YOU WIN!', {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#00aa00',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        // Add restart instructions
        this.add.text(400, 400, 'Press SPACE to play again', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#00aa00',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

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
            'QWOP Controls: Q/W move thighs, O/P move calves\nSPACE to punch - use it to defend!', {
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

        // Add limb health indicator
        this.healthText = this.add.text(400, 100, 'Limbs: 8/8', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000000AA',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.healthText.setScrollFactor(0);

        // Update limb health in update function
        this.updateLimbHealth = true;
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