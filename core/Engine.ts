// core/Engine.ts
import { GameConfig } from "../config/GameConfig.ts";
import { FaceName, FaceUtils } from "../utils/FaceUtils.ts";
import { FaceTransitionSystem } from "../physics/FaceTransition.ts";

export class Engine {
  sceneManager: any;
  inputManager: any;
  cameraManager: any;
  player: any;
  gravitySystem: any;
  faceTransitionSystem: FaceTransitionSystem;
  collisionSystem: any;
  THREE: any;
  clock: any;
  gameState: any;
  isRunning: boolean;
  faceChangeCallback: (face: FaceName) => void;
  visitCountChangeCallback: (count: number) => void;
  justTransitioned: boolean;
  customUpdateCallback: ((time: number) => void) | null;

  constructor({
    sceneManager,
    inputManager,
    cameraManager,
    player,
    gravitySystem,
    faceTransitionSystem,
    collisionSystem,
    THREE,
    customUpdateCallback,
  }: any) {
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.cameraManager = cameraManager;
    this.player = player;
    this.gravitySystem = gravitySystem;
    this.faceTransitionSystem = faceTransitionSystem;
    this.collisionSystem = collisionSystem;
    this.THREE = THREE;
    this.customUpdateCallback = customUpdateCallback || null;

    this.clock = new THREE.Clock();
    this.isRunning = false;
    this.justTransitioned = false;

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

    this.faceChangeCallback = () => {};
    this.visitCountChangeCallback = () => {};

    this.setupInputHandlers();
  }

  setupInputHandlers() {
    this.inputManager.onJump(() => {
      if (this.player.isOnGround && !this.player.isJumping) {
        // Assuming Player.ts has a jump method
        // this.player.jump(this.gravitySystem.getGravityVector());
        this.inputManager.jump = false;
      }
    });

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

    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime() * 1000;

    if (this.customUpdateCallback) {
      try {
        this.customUpdateCallback(time);
      } catch (error) {
        console.error("Error in custom update callback:", error);
      }
    }

    const cameraForward = new this.THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.cameraManager.camera.quaternion)
      .normalize();
    const cameraRight = new this.THREE.Vector3(1, 0, 0)
      .applyQuaternion(this.cameraManager.camera.quaternion)
      .normalize();

    const { up } = FaceUtils.getFaceAxes(this.gameState.currentFace, this.THREE);
    this.sceneManager.cubeContainer.updateMatrixWorld();
    const worldUp = up
      .clone()
      .transformDirection(this.sceneManager.cubeContainer.matrixWorld)
      .normalize();

    const worldForward = cameraForward
      .clone()
      .sub(worldUp.clone().multiplyScalar(cameraForward.dot(worldUp)))
      .normalize();
    const worldRight = cameraRight
      .clone()
      .sub(worldUp.clone().multiplyScalar(cameraRight.dot(worldUp)))
      .normalize();

    const targetVelocity = new this.THREE.Vector3(0, 0, 0);

    // Keyboard inputs
    if (this.inputManager.keysPressed.w) targetVelocity.add(worldForward);
    if (this.inputManager.keysPressed.s) targetVelocity.sub(worldForward);
    if (this.inputManager.keysPressed.a) targetVelocity.sub(worldRight);
    if (this.inputManager.keysPressed.d) targetVelocity.add(worldRight);

    // Touch inputs
    if (this.inputManager.movement.x !== 0 || this.inputManager.movement.y !== 0) {
      const moveX = this.inputManager.movement.x; // -1 to 1
      const moveY = this.inputManager.movement.y; // -1 to 1
      targetVelocity
        .add(worldRight.clone().multiplyScalar(moveX))
        .add(worldForward.clone().multiplyScalar(-moveY)); // Invert moveY
      console.log("Touch input:", { moveX, moveY, targetVelocity: targetVelocity.toArray() });
    }

    if (targetVelocity.length() > 0) {
      targetVelocity.normalize().multiplyScalar(GameConfig.playerSpeed);
    }

    this.player.applyMovement(targetVelocity, delta);
    const previousPosition = this.player.mesh.position.clone();
    this.player.update(delta);

    const frameVelocity = this.player.mesh.position.clone().sub(previousPosition);
    const adjustedVelocity = this.collisionSystem.handleCollision(
      this.player.mesh,
      frameVelocity,
      this.gameState.currentFace,
      this.sceneManager.cubeContainer
    );

    this.player.mesh.position.copy(previousPosition).add(adjustedVelocity);

    if (this.inputManager.jump && this.player.isOnGround && !this.player.isJumping) {
      // this.player.jump(this.gravitySystem.getGravityVector());
      this.inputManager.jump = false;
    }

    this.justTransitioned = false;
    this.checkFaceTransitions();

    if (!this.justTransitioned) {
      this.constrainToFace();
    }

    this.cameraManager.update(this.player.mesh.position);
    this.sceneManager.render(this.cameraManager.camera);
  }

  checkFaceTransitions() {
    const currentPosition = this.player.mesh.position.clone();
    const transition = this.faceTransitionSystem.checkFaceTransition(
      currentPosition,
      this.gameState.currentFace
    );

    if (transition.transitioned && transition.newFace) {
      this.justTransitioned = true;

      this.gameState.lastFace = this.gameState.currentFace;
      this.gameState.currentFace = transition.newFace;

      this.player.mesh.position.copy(transition.newPosition);

      this.cameraManager.targetLookAt.copy(this.player.mesh.position);
      this.cameraManager.setCurrentFace(transition.newFace);
      this.cameraManager.recenterForFace(transition.newFace);

      this.player.velocity.set(0, 0, 0);
      this.player.moveVelocity.set(0, 0, 0);

      if (!this.gameState.visitedFaces[transition.newFace]) {
        this.gameState.visitedFaces[transition.newFace] = true;
        this.gameState.faceVisitCount++;
        this.visitCountChangeCallback(this.gameState.faceVisitCount);
      }

      this.faceChangeCallback(transition.newFace);

      console.log(
        `Engine.checkFaceTransitions - Transitioned from ${this.gameState.lastFace} to ${transition.newFace}, new position:`,
        this.player.mesh.position.toArray()
      );
    }
  }

  constrainToFace() {
    const constrainedPosition = this.faceTransitionSystem.constrainToFace(
      this.player.mesh.position,
      this.gameState.currentFace
    );
    this.player.mesh.position.copy(constrainedPosition);

    this.gameState.isOnGround = true;
    this.player.isOnGround = true;
    this.player.isJumping = false;
  }

  dispose() {
    this.stop();
    this.inputManager.dispose();
    this.cameraManager.dispose();
    this.sceneManager.dispose();
    this.player.dispose();
  }
}