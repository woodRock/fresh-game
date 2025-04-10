// physics/GravitySystem.ts
import { FaceName, FaceUtils } from "../utils/FaceUtils.ts";

export class GravitySystem {
  cubeContainer: any;
  THREE: any;
  gravityVector: any;

  constructor(cubeContainer: any, THREE: any) {
    if (!THREE || !THREE.Vector3) {
      throw new Error("GravitySystem: THREE is undefined or invalid");
    }
    this.cubeContainer = cubeContainer;
    this.THREE = THREE;
    this.gravityVector = new THREE.Vector3(0, -1, 0); // Default gravity (down in world space)

    // Skip initial update since gravity is disabled
    // this.updateForFace("top");
  }

  updateForFace(face: FaceName) {
    if (!this.THREE || !this.THREE.Vector3) {
      throw new Error("GravitySystem: THREE is undefined in updateForFace");
    }
    const { up } = FaceUtils.getFaceAxes(face, this.THREE);
    this.cubeContainer.updateMatrixWorld();
    const worldUp = up.clone().transformDirection(this.cubeContainer.matrixWorld).normalize();
    this.gravityVector.copy(worldUp).multiplyScalar(-1);
  }

  getGravityVector() {
    return this.gravityVector.clone();
  }
}