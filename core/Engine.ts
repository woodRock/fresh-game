// core/Engine.ts
import { GameConfig } from "../config/GameConfig.ts";
import { FaceName, FaceUtils } from "../utils/FaceUtils.ts";

export class Engine {
  sceneManager: any;
  inputManager: any;
  cameraManager: any;
  player: any;
  gravitySystem: any;
  faceTransitionSystem: any;
  collisionSystem: any;
  THREE: any;
  clock: any;
  gameState: any;
  isRunning: boolean;
  faceChangeCallback: (face: FaceName) => void;
  visitCountChangeCallback: (count: number) => void;

  constructor({
    sceneManager,
    inputManager,
    cameraManager,
    player,
    gravitySystem,
    faceTransitionSystem,
    collisionSystem,
    THREE,
  }: any) {
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.cameraManager = cameraManager;
    this.player = player;
    this.gravitySystem = gravitySystem;
    this.faceTransitionSystem = faceTransitionSystem;
    this.collisionSystem = collisionSystem;
    this.THREE = THREE;

    // Initialize clock for timing
    this.clock = new THREE.Clock();
    this.isRunning = false;

    // Set up game state
    this.gameState = {
      currentFace: "top" as FaceName,
      lastFace: "top" as FaceName,
      visitedFaces: {
        top: true,
        bottom: false,
        left: false,
        right: false,
        front: false,
        back: false,
      },
      faceVisitCount: 1,
      isOnGround: true,
    };

    // Set up callbacks
    this.faceChangeCallback = () => {};
    this.visitCountChangeCallback = () => {};

    // Set up input handlers
    this.setupInputHandlers();
  }

  setupInputHandlers() {
    // Set up jump handler (disabled since gravity is off)
    this.inputManager.onJump(() => {
      // this.player.jump(this.gravitySystem.getGravityVector());
    });

    // Set up rotation toggle
    this.inputManager.onToggleRotation(() => {
      this.cameraManager.setControlsEnabled(!this.cameraManager.controls.enabled);
    });
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  onFaceChange(callback: (face: FaceName) => void) {
    this.faceChangeCallback = callback;
  }

  onVisitCountChange(callback: (count: number) => void) {
    this.visitCountChangeCallback = callback;
  }

  setRotationEnabled(enabled: boolean) {
    this.cameraManager.setControlsEnabled(enabled);
  }

  animate() {
    if (!this.isRunning) return;

    // Request next frame
    requestAnimationFrame(this.animate.bind(this));

    // Delta time for consistent movement
    const delta = this.clock.getDelta();
    console.log("Engine.animate - Delta:", delta);

    // Get the camera's orientation
    const cameraForward = new this.THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.cameraManager.camera.quaternion)
      .normalize();
    const cameraRight = new this.THREE.Vector3(1, 0, 0)
      .applyQuaternion(this.cameraManager.camera.quaternion)
      .normalize();

    // Get the face's up vector to project movement onto the face plane
    const { up } = FaceUtils.getFaceAxes(this.gameState.currentFace, this.THREE);
    this.sceneManager.cubeContainer.updateMatrixWorld();
    const worldUp = up
      .clone()
      .transformDirection(this.sceneManager.cubeContainer.matrixWorld)
      .normalize();

    // Project the camera's forward and right vectors onto the face plane
    const worldForward = cameraForward
      .clone()
      .sub(worldUp.clone().multiplyScalar(cameraForward.dot(worldUp)))
      .normalize();
    const worldRight = cameraRight
      .clone()
      .sub(worldUp.clone().multiplyScalar(cameraRight.dot(worldUp)))
      .normalize();

    // Debug movement directions
    console.log("Engine.animate - World forward (WASD):", worldForward.toArray());
    console.log("Engine.animate - World right (WASD):", worldRight.toArray());
    console.log("Engine.animate - World up (face):", worldUp.toArray());

    // Calculate target velocity based on input
    const targetVelocity = new this.THREE.Vector3(0, 0, 0);

    if (this.inputManager.keysPressed.w) targetVelocity.add(worldForward);
    if (this.inputManager.keysPressed.s) targetVelocity.sub(worldForward);
    if (this.inputManager.keysPressed.a) targetVelocity.sub(worldRight);
    if (this.inputManager.keysPressed.d) targetVelocity.add(worldRight);

    // Normalize if moving diagonally
    if (targetVelocity.length() > 0) {
      targetVelocity.normalize().multiplyScalar(GameConfig.playerSpeed);
    }

    // Debug target velocity
    console.log("Engine.animate - Target velocity (before movement):", targetVelocity.toArray());

    // Apply movement to player
    this.player.applyMovement(targetVelocity, delta);

    // Debug player velocities
    console.log("Engine.animate - Player moveVelocity (after applyMovement):", this.player.moveVelocity.toArray());
    console.log("Engine.animate - Player velocity (after applyMovement):", this.player.velocity.toArray());

    // Debug player position before update
    console.log("Engine.animate - Player position (before update):", this.player.mesh.position.toArray());

    // Update player position before collision
    const previousPosition = this.player.mesh.position.clone();
    this.player.update(delta);

    // Debug player position after update
    console.log("Engine.animate - Player position (after update):", this.player.mesh.position.toArray());

    // Calculate frame velocity
    const frameVelocity = this.player.mesh.position.clone().sub(previousPosition);
    console.log("Engine.animate - Frame velocity (before collision):", frameVelocity.toArray());

    // Handle collisions with maze walls
    const adjustedVelocity = this.collisionSystem.handleCollision(
      this.player.mesh,
      frameVelocity,
      this.gameState.currentFace,
      this.sceneManager.cubeContainer
    );

    // Debug adjusted velocity
    console.log("Engine.animate - Adjusted velocity (after collision):", adjustedVelocity.toArray());

    // Apply adjusted velocity after collision
    this.player.mesh.position.copy(previousPosition).add(adjustedVelocity);

    // Debug player position after collision
    console.log("Engine.animate - Player position (after collision):", this.player.mesh.position.toArray());

    // Check for face transitions BEFORE constraining to the current face
    this.checkFaceTransitions();

    // Constrain player to current face AFTER checking transitions
    this.constrainToFace();

    // Update camera
    this.cameraManager.update(this.player.mesh.position);

    // Render scene
    this.sceneManager.render(this.cameraManager.camera);
  }

  checkFaceTransitions() {
    // Get current position
    const currentPosition = this.player.mesh.position.clone();
    console.log("Engine.checkFaceTransitions - Current position:", currentPosition.toArray());
    console.log("Engine.checkFaceTransitions - Current face:", this.gameState.currentFace);

    // Check for face transitions using the FaceTransitionSystem
    const transition = this.faceTransitionSystem.checkFaceTransition(
      currentPosition,
      this.gameState.currentFace
    );

    console.log("Engine.checkFaceTransitions - Transition result:", {
      transitioned: transition.transitioned,
      newFace: transition.newFace,
      newPosition: transition.newPosition ? transition.newPosition.toArray() : null,
    });

    if (transition.transitioned && transition.newFace) {
      console.log(`Engine.checkFaceTransitions - Transitioning from ${this.gameState.currentFace} to ${transition.newFace}`);

      // Update face state FIRST
      this.gameState.lastFace = this.gameState.currentFace;
      this.gameState.currentFace = transition.newFace;

      // Update player position if provided, otherwise constrain to the new face
      if (transition.newPosition) {
        console.log("Engine.checkFaceTransitions - Setting new position:", transition.newPosition.toArray());
        this.player.mesh.position.copy(transition.newPosition);
      } else {
        // If no position provided, constrain to the new face
        const constrainedPosition = this.faceTransitionSystem.constrainToFace(
          currentPosition,
          transition.newFace
        );
        console.log("Engine.checkFaceTransitions - Constraining to new face position:", constrainedPosition.toArray());
        this.player.mesh.position.copy(constrainedPosition);
      }

      // Debug player position after transition
      console.log("Engine.checkFaceTransitions - Player position (after transition):", this.player.mesh.position.toArray());

      // Reset cubeContainer rotation to align faces with world axes
      this.sceneManager.cubeContainer.rotation.set(0, 0, 0);
      this.sceneManager.cubeContainer.updateMatrixWorld();
      console.log("Engine.checkFaceTransitions - Reset cubeContainer rotation to [0, 0, 0]");

      // Update the camera's targetLookAt to the new player position BEFORE recentering
      this.cameraManager.targetLookAt.copy(this.player.mesh.position);

      // Update the camera's current face
      this.cameraManager.setCurrentFace(transition.newFace);

      // Recenter the camera for the new face
      console.log("Engine.checkFaceTransitions - Recentering camera for face:", transition.newFace);
      this.cameraManager.recenterForFace(transition.newFace);

      // Reset player velocities to prevent carrying momentum during transition
      this.player.velocity.set(0, 0, 0);
      this.player.moveVelocity.set(0, 0, 0);

      // Debug velocities after reset
      console.log("Engine.checkFaceTransitions - Player velocity (after reset):", this.player.velocity.toArray());
      console.log("Engine.checkFaceTransitions - Player moveVelocity (after reset):", this.player.moveVelocity.toArray());

      // Update visit tracking
      if (!this.gameState.visitedFaces[transition.newFace]) {
        this.gameState.visitedFaces[transition.newFace] = true;
        this.gameState.faceVisitCount++;
        this.visitCountChangeCallback(this.gameState.faceVisitCount);
      }

      // Notify of face change
      this.faceChangeCallback(transition.newFace);
    } else {
      console.log("Engine.checkFaceTransitions - No face transition occurred in this frame");
    }
  }

  constrainToFace() {
    const constrainedPosition = this.faceTransitionSystem.constrainToFace(
      this.player.mesh.position,
      this.gameState.currentFace
    );
    this.player.mesh.position.copy(constrainedPosition);

    // Debug player position after constraint
    console.log("Engine.constrainToFace - Player position (after constrainToFace):", this.player.mesh.position.toArray());

    // Update ground state (simplified since gravity is disabled)
    this.gameState.isOnGround = true; // Assume player is always on the ground
    this.player.isOnGround = true;
    this.player.isJumping = false;

    // Debug ground state
    console.log("Engine.constrainToFace - Is on ground:", this.gameState.isOnGround);
  }

  dispose() {
    this.stop();
    this.inputManager.dispose();
    this.cameraManager.dispose();
    this.sceneManager.dispose();
    this.player.dispose();
  }
}