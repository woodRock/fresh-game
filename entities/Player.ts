// entities/Player.ts
export class Player {
  mesh: any;
  velocity: any;
  moveVelocity: any;
  isOnGround: boolean;
  isJumping: boolean;
  THREE: any;

  constructor(THREE: any, spawnPosition: any) {
    this.THREE = THREE;

    // Create player mesh (a simple sphere)
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(spawnPosition);

    // Initialize velocities
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.moveVelocity = new THREE.Vector3(0, 0, 0);

    // Ground and jump state
    this.isOnGround = true;
    this.isJumping = false;
  }

  applyMovement(targetVelocity: any, delta: number) {
    // Apply movement velocity (WASD input)
    this.moveVelocity.copy(targetVelocity);

    // Combine movement velocity with current velocity
    this.velocity.copy(this.moveVelocity);
  }

  update(delta: number) {
    // Update position based on velocity
    const velocityDelta = this.velocity.clone().multiplyScalar(delta);
    this.mesh.position.add(velocityDelta);
  }

  jump(gravityVector: any) {
    if (this.isOnGround && !this.isJumping) {
      // Apply jump velocity (disabled since gravity is off)
      this.isJumping = true;
      this.isOnGround = false;
    }
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}