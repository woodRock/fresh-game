// core/CameraManager.ts
import { GameConfig } from "../config/GameConfig.ts";
import { FaceName, FaceUtils } from "../utils/FaceUtils.ts";

export class CameraManager {
  camera: any;
  controls: any;
  cubeContainer: any;
  cameraOffset: any;
  THREE: any;
  targetCameraPos: any;
  targetLookAt: any;
  currentFace: FaceName; // Track the current face for correct offset calculation

  constructor(camera: any, renderer: any, cubeContainer: any, THREE: any, OrbitControls: any) {
    this.camera = camera;
    this.cubeContainer = cubeContainer;
    this.THREE = THREE;

    // Set up orbit controls
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 50;

    // Initialize camera properties
    this.cameraOffset = new THREE.Vector3(0, 5, 10); // Offset: 5 units above, 10 units behind
    this.targetCameraPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.currentFace = "top"; // Start on the top face

    // Set initial orientation for the top face
    this.recenterForFace("top");
  }

  setControlsEnabled(enabled: boolean) {
    this.controls.enabled = enabled;
  }

  // Update the current face (called by Engine when face changes)
  setCurrentFace(face: FaceName) {
    this.currentFace = face;
  }

  // Recenter the camera for the new face to match the initial orientation on the top face
  recenterForFace(face: FaceName) {
    // Update the current face
    this.currentFace = face;

    // Get the face's axes
    const { forward, up } = FaceUtils.getFaceAxes(face, this.THREE);

    // Transform to world space
    this.cubeContainer.updateMatrixWorld();
    const worldForward = forward
      .clone()
      .transformDirection(this.cubeContainer.matrixWorld)
      .normalize();
    const worldUp = up
      .clone()
      .transformDirection(this.cubeContainer.matrixWorld)
      .normalize();

    // Calculate the camera's new position relative to the player's position
    const playerPos = this.targetLookAt.clone();
    const offsetDirection = worldForward
      .clone()
      .multiplyScalar(-this.cameraOffset.z) // 10 units behind along the face's forward direction
      .add(worldUp.clone().multiplyScalar(this.cameraOffset.y)); // 5 units above along the face's up direction
    const newCameraPos = playerPos.clone().add(offsetDirection);

    // Set the camera's position and orientation
    this.camera.position.copy(newCameraPos);
    this.camera.up.copy(worldUp); // Set the camera's up vector to the face's up direction
    this.camera.lookAt(playerPos);

    // Update targetCameraPos to prevent lerping to an incorrect position
    this.targetCameraPos.copy(newCameraPos);

    // Reset OrbitControls to match the new orientation
    this.controls.target.copy(playerPos);
    this.controls.reset(); // Reset OrbitControls to clear previous rotation state
    this.controls.update();
  }

  update(playerPosition: any) {
    // Update orbit controls if enabled
    if (this.controls.enabled) {
      this.controls.update();
    }

    // Update target positions for smooth following
    this.targetLookAt = playerPosition.clone();

    // Get the face's axes for the current face
    const { forward, up } = FaceUtils.getFaceAxes(this.currentFace, this.THREE);
    this.cubeContainer.updateMatrixWorld();
    const worldForward = forward
      .clone()
      .transformDirection(this.cubeContainer.matrixWorld)
      .normalize();
    const worldUp = up
      .clone()
      .transformDirection(this.cubeContainer.matrixWorld)
      .normalize();

    // Calculate the target camera position using the face's axes
    const offsetDirection = worldForward
      .clone()
      .multiplyScalar(-this.cameraOffset.z)
      .add(worldUp.clone().multiplyScalar(this.cameraOffset.y));
    const targetCameraPos = this.targetLookAt.clone().add(offsetDirection);

    // Smoothly interpolate the camera position
    this.targetCameraPos.lerp(targetCameraPos, 0.05);
    this.camera.position.lerp(this.targetCameraPos, 0.05);
    this.camera.lookAt(this.targetLookAt);

    // Debug camera orientation
    const cameraForward = new this.THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.camera.quaternion)
      .normalize();
  }

  dispose() {
    this.controls.dispose();
  }
}