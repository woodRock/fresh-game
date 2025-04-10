// utils/FaceUtils.ts
export type FaceName = "top" | "bottom" | "left" | "right" | "front" | "back";

export const FaceUtils = {
  getFaceAxes(face: FaceName, THREE: any) {
    const forwardVec = new THREE.Vector3();
    const rightVec = new THREE.Vector3();
    const upVec = new THREE.Vector3();

    switch (face) {
      case "top":
        forwardVec.set(0, 0, -1); // Forward is negative Z
        rightVec.set(1, 0, 0); // Right is positive X
        upVec.set(0, 1, 0); // Up is positive Y
        break;
      case "bottom":
        forwardVec.set(0, 0, 1); // Forward is positive Z
        rightVec.set(1, 0, 0); // Right is positive X
        upVec.set(0, -1, 0); // Up is negative Y
        break;
      case "left":
        forwardVec.set(0, 0, -1); // Forward is negative Z
        rightVec.set(0, 1, 0); // Right is positive Y
        upVec.set(-1, 0, 0); // Up is negative X
        break;
      case "right":
        forwardVec.set(0, 0, -1); // Forward is negative Z
        rightVec.set(0, -1, 0); // Right is negative Y
        upVec.set(1, 0, 0); // Up is positive X
        break;
      case "front":
        forwardVec.set(0, 1, 0); // Forward is positive Y
        rightVec.set(1, 0, 0); // Right is positive X
        upVec.set(0, 0, 1); // Up is positive Z
        break;
      case "back":
        forwardVec.set(0, -1, 0); // Forward is negative Y
        rightVec.set(1, 0, 0); // Right is positive X
        upVec.set(0, 0, -1); // Up is negative Z
        break;
    }

    return { forward: forwardVec, right: rightVec, up: upVec };
  },
};