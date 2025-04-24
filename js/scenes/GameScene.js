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

        this.playerHealth = 3;
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

        this.setupArmBobbing();
    }

    createCharacterParts(x, torsoY) {
        // Create torso
        this.character.parts.torso = this.matter.add.image(x, torsoY, 'torso', null, {
            label: 'torso',
            density: 0.012, // Slightly heavier
            frictionAir: 0.02, // More air resistance
            friction: 0.3, // More ground friction
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Create head
        this.character.parts.head = this.matter.add.image(x, torsoY - 50, 'head', null, {
            label: 'head',
            density: 0.005,
            frictionAir: 0.02,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // In createCharacterParts, position arms in a guard/boxing stance
        this.character.parts.leftUpperArm = this.matter.add.image(x - 25, torsoY - 30, 'arm', null, {
            label: 'leftUpperArm',
            density: 0.003,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperArm = this.matter.add.image(x + 25, torsoY - 30, 'arm', null, {
            label: 'rightUpperArm',
            density: 0.003,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // Position lower arms to be in a guard position
        this.character.parts.leftLowerArm = this.matter.add.image(x - 40, torsoY - 50, 'arm', null, {
            label: 'leftLowerArm',
            density: 0.002,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLowerArm = this.matter.add.image(x + 40, torsoY - 50, 'arm', null, {
            label: 'rightLowerArm',
            density: 0.002,
            frictionAir: 0.03,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        // and lower legs to use lowerLeg texture
        this.character.parts.leftUpperLeg = this.matter.add.image(x - 10, torsoY + 30, 'upperLeg', null, {
            label: 'leftUpperLeg',
            density: 0.007,
            frictionAir: 0.01,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightUpperLeg = this.matter.add.image(x + 10, torsoY + 30, 'upperLeg', null, {
            label: 'rightUpperLeg',
            density: 0.007,
            frictionAir: 0.01,
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

// Create lower legs with proper feet
        this.character.parts.leftLowerLeg = this.matter.add.image(x - 10, torsoY + 70, 'lowerLeg', null, {
            label: 'leftLowerLeg',
            density: 0.009,
            frictionAir: 0.02,
            friction: 0.9, // High ground friction for better stability
            collisionFilter: { group: 0, category: 2, mask: 255 }
        });

        this.character.parts.rightLowerLeg = this.matter.add.image(x + 10, torsoY + 70, 'lowerLeg', null, {
            label: 'rightLowerLeg',
            density: 0.009,
            frictionAir: 0.02,
            friction: 0.9, // High ground friction for better stability
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
            // r: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),

            // Restart after game over
            restart: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };

        // Set up key events
        // this.keys.r.on('down', () => {
        //     this.resetGame();
        // });
    }

    setupArmBobbing() {
        // Create a subtle bobbing effect for arms in guard position
        this.armBobbingTween = this.tweens.add({
            targets: [this.character.parts.leftLowerArm, this.character.parts.rightLowerArm],
            y: '-=5', // Move up by 5 pixels
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Improve punch mechanics for jab-style punches
    handleCharacterControl() {
        if (!this.gameActive || this.isPaused) return;

        // QWOP controls for legs remain the same
        const legForce = 0.15;

        // Thigh controls (Q and W)
        if (this.keys.q.isDown) {
            this.character.parts.rightUpperLeg.applyForce({ x: legForce, y: 0 });
            this.character.parts.leftUpperLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        if (this.keys.w.isDown) {
            this.character.parts.leftUpperLeg.applyForce({ x: legForce, y: 0 });
            this.character.parts.rightUpperLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        // Calf controls (O and P)
        if (this.keys.o.isDown) {
            this.character.parts.rightLowerLeg.applyForce({ x: legForce, y: -legForce/4 });
            this.character.parts.leftLowerLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        if (this.keys.p.isDown) {
            this.character.parts.leftLowerLeg.applyForce({ x: legForce, y: -legForce/4 });
            this.character.parts.rightLowerLeg.applyForce({ x: -legForce/2, y: 0 });
        }

        // handling punches
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            // Alternate between left and right jabs
            this.useLeftArm = !this.useLeftArm;

            // Get the arm to use
            const upperArm = this.useLeftArm
                ? this.character.parts.leftUpperArm
                : this.character.parts.rightUpperArm;

            const lowerArm = this.useLeftArm
                ? this.character.parts.leftLowerArm
                : this.character.parts.rightLowerArm;

            if (upperArm && upperArm.active && lowerArm && lowerArm.active) {
                // Stronger jab force
                const jabForce = 0.35; // Increased slightly

                // Apply jab forces - more direct punching action
                upperArm.setVelocity(0, 0); // Clear existing velocity first
                lowerArm.setVelocity(0, 0);

                // Apply stronger, more directed punch force
                upperArm.applyForce({ x: jabForce * 0.3, y: -0.08 }); // Reduced forward momentum
                lowerArm.applyForce({ x: jabForce * 0.5, y: -0.1 });  // Reduced forward momentum

                // Visual feedback for punch
                this.tweens.add({
                    targets: lowerArm,
                    alpha: 0.7,
                    duration: 50,
                    yoyo: true,
                    repeat: 1
                });

                // Small camera shake for impact
                this.cameras.main.shake(100, 0.005);
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
        // Create enemy with arms/limbs
        this.enemy = this.matter.add.image(x, y, 'enemy', null, {
            label: 'enemy',
            density: 0.008,
            frictionAir: 0.02,
            friction: 0.2,
            collisionFilter: { group: 0, category: 4, mask: 255 }
        });

        // Scale enemy
        this.enemy.setScale(1.8);
        this.enemy.setFriction(0.05); // Add surface friction
        this.enemy.setFrictionAir(0.1); // Increase air friction to prevent sliding
        this.enemy.setBounce(0); // Prevent bouncing entirely
        // Make enemy face the right way (add right after creating the enemy)
        if (x > this.character.parts.torso.x) {
            this.enemy.setFlipX(true); // Face left if starting to the right of player
        }

        // Create enemy limbs that can interact with player
        this.enemyLeftArm = this.matter.add.image(x - 40, y, 'enemyArm', null, {
            label: 'enemyArm',
            density: 0.003,
            frictionAir: 0.01,
            collisionFilter: { group: 0, category: 8, mask: 255 }
        });

        this.enemyRightArm = this.matter.add.image(x + 40, y, 'enemyArm', null, {
            label: 'enemyArm',
            density: 0.003,
            frictionAir: 0.01,
            collisionFilter: { group: 0, category: 8, mask: 255 }
        });

        // Connect arms to enemy body
        this.matter.add.joint(this.enemy, this.enemyLeftArm, 10, 0.5, {
            pointA: { x: -25, y: 0 },
            pointB: { x: 20, y: 0 }
        });

        this.matter.add.joint(this.enemy, this.enemyRightArm, 10, 0.5, {
            pointA: { x: 25, y: 0 },
            pointB: { x: -20, y: 0 }
        });

        // Store for reference
        this.enemy.leftArm = this.enemyLeftArm;
        this.enemy.rightArm = this.enemyRightArm;
        this.enemy.speed = 0.002;

        // Set up enemy attack pattern
        this.setupEnemyAttacks();
    }

    // Add enemy attack pattern method
    setupEnemyAttacks() {
        // Set up a timer for enemy attacks
        this.enemyAttackTimer = this.time.addEvent({
            delay: 2000, // Attack every 2 seconds
            callback: this.enemyAttack,
            callbackScope: this,
            loop: true
        });
    }

    // Enemy attack method
    enemyAttack() {
        if (!this.enemy || !this.enemy.active || !this.gameActive || this.isPaused) return;

        // Get distance to player
        const dx = this.character.parts.torso.x - this.enemy.x;
        const distance = Math.abs(dx);

        // Only attack if within range
        if (distance < 150) {
            // Determine which arm to use based on player position
            const arm = dx > 0 ? this.enemy.rightArm : this.enemy.leftArm;

            if (arm && arm.active) {
                // Apply punch force
                const punchForce = 0.02;
                arm.applyForce({
                    x: Math.sign(dx) * punchForce,
                    y: -punchForce/2
                });

                // Visual feedback
                this.tweens.add({
                    targets: arm,
                    alpha: 0.6,
                    duration: 50,
                    yoyo: true,
                    repeat: 1
                });
            }
        }
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
            // Remove old enemy and its arms
            this.enemy.leftArm.destroy();
            this.enemy.rightArm.destroy();
            this.enemy.destroy();

            // Create new enemy ahead of player
            this.createEnemy(playerX + 400, this.groundTop - 50);
            return;
        }

        // Calculate distance to player
        const dx = this.character.parts.torso.x - this.enemy.x;
        const distance = Math.abs(dx);

        // STOP applying forces constantly - instead set velocity directly when needed
        // reduce initial rush speed
        if (distance > 100) {
            // Slower initial speed
            const speed = 0.05;
            this.enemy.setVelocityX(Math.sign(dx) * speed);

            const maxSpeed = 0.3;
            if (Math.abs(this.enemy.body.velocity.x) > maxSpeed) {
                this.enemy.setVelocityX(Math.sign(this.enemy.body.velocity.x) * maxSpeed);
            }
        } else {
            // Stronger deceleration when close
            this.enemy.setVelocityX(this.enemy.body.velocity.x * 0.5);
        }

        // Also make sure the enemy doesn't get too much vertical velocity
        if (Math.abs(this.enemy.body.velocity.y) > 0.2) {
            this.enemy.setVelocityY(this.enemy.body.velocity.y * 0.8);
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

                // Check for finish line collision
                if ((bodyA.label === 'finishLine' && bodyB.gameObject &&
                        Object.values(this.character.parts).includes(bodyB.gameObject)) ||
                    (bodyB.label === 'finishLine' && bodyA.gameObject &&
                        Object.values(this.character.parts).includes(bodyA.gameObject))) {

                    // Only win if torso is close enough to finish line
                    const distanceToFinish = Phaser.Math.Distance.Between(
                        this.character.parts.torso.x,
                        this.character.parts.torso.y,
                        this.finishLine.x,
                        this.finishLine.y
                    );

                    if (distanceToFinish < 150) {
                        this.winGame();
                    }
                }

                // Check for player punch hitting enemy
                const isPlayerArm = (body) => body.label &&
                    (body.label === 'leftLowerArm' || body.label === 'rightLowerArm');
                const isEnemy = (body) => body.label === 'enemy' || body.label === 'enemyArm';

                if ((isPlayerArm(bodyA) && isEnemy(bodyB)) ||
                    (isEnemy(bodyA) && isPlayerArm(bodyB))) {

                    const arm = isPlayerArm(bodyA) ? bodyA.gameObject : bodyB.gameObject;
                    const enemyPart = isEnemy(bodyA) ? bodyA.gameObject : bodyB.gameObject;

                    // Calculate arm velocity for impact
                    const armVelocity = arm.body.velocity;
                    const impactSpeed = Math.sqrt(
                        armVelocity.x * armVelocity.x +
                        armVelocity.y * armVelocity.y
                    );

                    // Only register significant impacts
                    if (impactSpeed > 3) {
                        // Apply knockback to enemy
                        const pushForce = 0.005 * impactSpeed;
                        const direction = isPlayerArm(bodyA) ? 1 : -1;

                        this.enemy.applyForce({
                            x: direction * pushForce,
                            y: -pushForce/2
                        });

                        // Visual feedback
                        this.cameras.main.shake(100, 0.01);

                        // Show hit effect
                        this.showHitEffect(arm.x, arm.y);
                    }
                }

                // Check for enemy arm hitting player
                const isEnemyArm = (body) => body.label === 'enemyArm';
                const isPlayerPart = (body) => body.gameObject &&
                    Object.values(this.character.parts).includes(body.gameObject);

                if ((isEnemyArm(bodyA) && isPlayerPart(bodyB)) ||
                    (isPlayerPart(bodyA) && isEnemyArm(bodyB))) {

                    // Only register hit if it's been a while since last hit
                    if (!this.lastPlayerHit || this.time.now - this.lastPlayerHit > 420) {
                        this.lastPlayerHit = this.time.now;

                        // Decrease health
                        this.playerHealth--;

                        // Update display
                        if (this.healthDisplay) {
                            this.healthDisplay.setText(`Health: ${this.playerHealth}`);
                        }

                        // Game over if no health left
                        if (this.playerHealth <= 0) {
                            this.gameOver("Hit too many times!");
                            return;
                        }

                        // Apply knockback to player
                        const knockbackForce = 0.04;
                        this.character.parts.torso.applyForce({
                            x: -knockbackForce,
                            y: -knockbackForce/2
                        });

                        // Visual feedback
                        this.cameras.main.shake(150, 0.02);

                        // Show hit effect
                        const hitPos = isEnemyArm(bodyA) ?
                            { x: bodyA.gameObject.x, y: bodyA.gameObject.y } :
                            { x: bodyB.gameObject.x, y: bodyB.gameObject.y };

                        this.showHitEffect(hitPos.x, hitPos.y);
                    }
                }
            });
        });

        // Handle collision end
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

    // Add hit effect method
    showHitEffect(x, y) {
        // Create a hit effect
        const hitEffect = this.add.circle(x, y, 15, 0xffffff, 0.7);

        // Expand and fade
        this.tweens.add({
            targets: hitEffect,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => hitEffect.destroy()
        });

        // Add a hit text
        // const hitText = this.add.text(x, y - 20, 'HIT!', {
        //     fontSize: '18px',
        //     fill: '#ffffff',
        //     backgroundColor: '#ff0000aa',
        //     padding: { x: 5, y: 2 }
        // }).setOrigin(0.5);

        // // Fade out
        // this.tweens.add({
        //     targets: hitText,
        //     y: hitText.y - 30,
        //     alpha: 0,
        //     duration: 300,
        //     onComplete: () => hitText.destroy()
        // });
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
        console.log("Toggle pause called"); // Debug output
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Stop physics
            this.matter.world.enabled = false;

            // Show pause text
            if (!this.pauseText) {
                this.pauseText = this.add.text(400, 300, 'PAUSED\nPress ESC to resume', {
                    fontSize: '32px',
                    fill: '#fff',
                    backgroundColor: '#000',
                    padding: { x: 20, y: 10 },
                    align: 'center'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
            }
        } else {
            // Resume physics
            this.matter.world.enabled = true;

            // Remove pause text
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

        // Replace the rotation check in checkGameState()
        // Check for torso on ground for longer
        if (this.torsoGroundContact) {
            // Instead of rotation, check if torso is lying on its side
            const torsoVelocity = this.character.parts.torso.body.velocity;
            const isNotMoving = Math.abs(torsoVelocity.x) < 0.5 && Math.abs(torsoVelocity.y) < 0.5;

            // If not moving for a while and on ground, game over
            if (isNotMoving && this.time.now - this.torsoGroundContact.time > 500) {
                this.gameOver("Character fell down!");
                return;
            }
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

        this.healthDisplay = this.add.text(400, 130, 'Health: 3', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000000AA',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.healthDisplay.setScrollFactor(0);
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