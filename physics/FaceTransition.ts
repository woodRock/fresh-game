// physics/FaceTransition.ts
import { FaceName, FaceUtils } from "../utils/FaceUtils.ts";
import { GameConfig } from "../config/GameConfig.ts";

export class FaceTransitionSystem {
  THREE: any;
  playerRadius: number;
  halfSize: number;
  cubeContainer: any;
  collisionSystem: any;
  mazeSize: number;

  constructor(THREE: any, cubeContainer: any, collisionSystem?: any) {
    this.THREE = THREE;
    this.playerRadius = GameConfig.playerRadius;
    this.halfSize = GameConfig.cubeSize / 2;
    this.cubeContainer = cubeContainer;
    this.collisionSystem = collisionSystem;
    this.mazeSize = GameConfig.mazeSize;
  }

  checkFaceTransition(position: any, currentFace: FaceName) {
    this.cubeContainer.updateMatrixWorld();
    const cubeInverseMatrix = this.cubeContainer.matrixWorld.clone().invert();
    const localPos = position.clone().applyMatrix4(cubeInverseMatrix);

    console.log("FaceTransition.checkFaceTransition - World position:", position.toArray());
    console.log("FaceTransition.checkFaceTransition - Local position:", localPos.toArray());
    const threshold = this.halfSize - this.playerRadius;
    console.log("FaceTransition.checkFaceTransition - Threshold:", threshold);

    let transitioned = false;
    let newFace: FaceName | null = null;
    let newPosition: any = null;
    let entryDirection: "positive" | "negative" | null = null;
    let entryAxis: "x" | "y" | "z" | null = null;

    const center = Math.floor(this.mazeSize / 2);
    const cellSize = GameConfig.cubeSize / this.mazeSize;
    const centerPos = -this.halfSize + center * cellSize + cellSize / 2;
    const inwardOffset = cellSize; // Move inward by one cell to ensure we're on a path

    switch (currentFace) {
      case "top":
        if (localPos.z <= -threshold) {
          newFace = "front";
          const newX = localPos.x;
          const newY = centerPos + inwardOffset; // Move inward (down on front face)
          const newZ = this.halfSize + this.playerRadius + 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to front");
        } else if (localPos.z >= threshold) {
          newFace = "back";
          const newX = -localPos.x;
          const newY = -centerPos - inwardOffset; // Move inward (up on back face)
          const newZ = -this.halfSize - this.playerRadius - 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to back");
        } else if (localPos.x <= -threshold) {
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01;
          const newY = localPos.y - this.halfSize;
          const newZ = centerPos - inwardOffset; // Move inward (left on left face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to left");
        } else if (localPos.x >= threshold) {
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01;
          const newY = localPos.y - this.halfSize;
          const newZ = -centerPos + inwardOffset; // Move inward (right on right face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to right");
        }
        break;
      case "bottom":
        if (localPos.z >= threshold) {
          newFace = "front";
          const newX = localPos.x;
          const newY = -centerPos - inwardOffset; // Move inward (up on front face)
          const newZ = this.halfSize + this.playerRadius + 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to front");
        } else if (localPos.z <= -threshold) {
          newFace = "back";
          const newX = -localPos.x;
          const newY = centerPos + inwardOffset; // Move inward (down on back face)
          const newZ = -this.halfSize - this.playerRadius - 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to back");
        } else if (localPos.x <= -threshold) {
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01;
          const newY = -(localPos.y + this.halfSize);
          const newZ = -centerPos + inwardOffset; // Move inward (right on left face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to left");
        } else if (localPos.x >= threshold) {
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01;
          const newY = -(localPos.y + this.halfSize);
          const newZ = centerPos - inwardOffset; // Move inward (left on right face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to right");
        }
        break;
      case "left":
        if (localPos.z <= -threshold) {
          newFace = "front";
          const newX = centerPos - inwardOffset; // Move inward (left on front face)
          const newY = localPos.y;
          const newZ = this.halfSize + this.playerRadius + 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to front");
        } else if (localPos.z >= threshold) {
          newFace = "back";
          const newX = -centerPos + inwardOffset; // Move inward (right on back face)
          const newY = localPos.y;
          const newZ = -this.halfSize - this.playerRadius - 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to back");
        } else if (localPos.y >= threshold) {
          newFace = "top";
          const newX = localPos.x + this.halfSize;
          const newY = this.halfSize + this.playerRadius + 0.01;
          const newZ = centerPos - inwardOffset; // Move inward (left on top face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom";
          const newX = localPos.x + this.halfSize;
          const newY = -this.halfSize - this.playerRadius - 0.01;
          const newZ = -centerPos + inwardOffset; // Move inward (left on bottom face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to bottom");
        }
        break;
      case "right":
        if (localPos.z <= -threshold) {
          newFace = "back";
          const newX = -centerPos - inwardOffset; // Move inward (left on back face)
          const newY = localPos.y;
          const newZ = -this.halfSize - this.playerRadius - 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to back");
        } else if (localPos.z >= threshold) {
          newFace = "front";
          const newX = centerPos + inwardOffset; // Move inward (right on front face)
          const newY = localPos.y;
          const newZ = this.halfSize + this.playerRadius + 0.01;
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to front");
        } else if (localPos.y >= threshold) {
          newFace = "top";
          const newX = localPos.x - this.halfSize;
          const newY = this.halfSize + this.playerRadius + 0.01;
          const newZ = -centerPos + inwardOffset; // Move inward (right on top face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom";
          const newX = localPos.x - this.halfSize;
          const newY = -this.halfSize - this.playerRadius - 0.01;
          const newZ = centerPos - inwardOffset; // Move inward (right on bottom face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to bottom");
        }
        break;
      case "front":
        if (localPos.y >= threshold) {
          newFace = "top";
          const newX = localPos.x;
          const newY = this.halfSize + this.playerRadius + 0.01;
          const newZ = -centerPos + inwardOffset; // Move inward (front on top face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom";
          const newX = localPos.x;
          const newY = -this.halfSize - this.playerRadius - 0.01;
          const newZ = centerPos - inwardOffset; // Move inward (back on bottom face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to bottom");
        } else if (localPos.x <= -threshold) {
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01;
          const newY = localPos.y;
          const newZ = centerPos - inwardOffset; // Move inward (left on left face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to left");
        } else if (localPos.x >= threshold) {
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01;
          const newY = localPos.y;
          const newZ = -centerPos + inwardOffset; // Move inward (right on right face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to right");
        }
        break;
      case "back":
        if (localPos.y >= threshold) {
          newFace = "top";
          const newX = -localPos.x;
          const newY = this.halfSize + this.playerRadius + 0.01;
          const newZ = centerPos - inwardOffset; // Move inward (back on top face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom";
          const newX = -localPos.x;
          const newY = -this.halfSize - this.playerRadius - 0.01;
          const newZ = -centerPos + inwardOffset; // Move inward (front on bottom face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to bottom");
        } else if (localPos.x <= -threshold) {
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01;
          const newY = localPos.y;
          const newZ = centerPos - inwardOffset; // Move inward (left on right face)
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to right");
        } else if (localPos.x >= threshold) {
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01;
          const newY = localPos.y;
          const newZ = -centerPos + inwardOffset; // Move inward (right on left face)
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to left");
        }
        break;
    }

    if (newFace) {
      transitioned = true;
      newPosition = localPos.clone().applyMatrix4(this.cubeContainer.matrixWorld);
      console.log("FaceTransition.checkFaceTransition - Initial new position on", newFace, ":", newPosition.toArray());

      // Validate position to ensure it's collision-free
      if (this.collisionSystem && this.collisionSystem.checkMazeCollision(newPosition, newFace, this.cubeContainer)) {
        console.error("FaceTransition.checkFaceTransition - Initial position collides with wall on", newFace);
        // Fallback to center of the face
        localPos.set(0, 0, 0);
        switch (newFace) {
          case "top": localPos.y = this.halfSize + this.playerRadius + 0.01; break;
          case "bottom": localPos.y = -this.halfSize - this.playerRadius - 0.01; break;
          case "left": localPos.x = -this.halfSize - this.playerRadius - 0.01; break;
          case "right": localPos.x = this.halfSize + this.playerRadius + 0.01; break;
          case "front": localPos.z = this.halfSize + this.playerRadius + 0.01; break;
          case "back": localPos.z = -this.halfSize - this.playerRadius - 0.01; break;
        }
        newPosition = localPos.clone().applyMatrix4(this.cubeContainer.matrixWorld);
        console.log("FaceTransition.checkFaceTransition - Fallback to center position on", newFace, ":", newPosition.toArray());
      } else {
        console.log("FaceTransition.checkFaceTransition - Initial position is collision-free:", newPosition.toArray());
      }
    } else {
      console.log("FaceTransition.checkFaceTransition - No face transition occurred from", currentFace);
    }

    return { transitioned, newFace, newPosition };
  }

  constrainToFace(position: any, face: FaceName) {
    this.cubeContainer.updateMatrixWorld();
    const cubeInverseMatrix = this.cubeContainer.matrixWorld.clone().invert();
    const localPos = position.clone().applyMatrix4(cubeInverseMatrix);

    const threshold = this.halfSize;

    switch (face) {
      case "top":
        localPos.y = Math.min(threshold + this.playerRadius + 0.01, localPos.y);
        localPos.x = Math.max(-threshold, Math.min(threshold, localPos.x));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "bottom":
        localPos.y = Math.max(-threshold - this.playerRadius - 0.01, localPos.y);
        localPos.x = Math.max(-threshold, Math.min(threshold, localPos.x));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "left":
        localPos.x = Math.max(-threshold - this.playerRadius - 0.01, localPos.x);
        localPos.y = Math.max(-threshold, Math.min(threshold, localPos.y));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "right":
        localPos.x = Math.min(threshold + this.playerRadius + 0.01, localPos.x);
        localPos.y = Math.max(-threshold, Math.min(threshold, localPos.y));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "front":
        localPos.z = Math.min(threshold + this.playerRadius + 0.01, localPos.z);
        localPos.x = Math.max(-threshold, Math.min(threshold, localPos.x));
        localPos.y = Math.max(-threshold, Math.min(threshold, localPos.y));
        break;
      case "back":
        localPos.z = Math.max(-threshold - this.playerRadius - 0.01, localPos.z);
        localPos.x = Math.max(-threshold, Math.min(threshold, localPos.x));
        localPos.y = Math.max(-threshold, Math.min(threshold, localPos.y));
        break;
      default:
        console.warn("FaceTransition.constrainToFace - Unknown face:", face);
    }

    const constrainedPosition = localPos.applyMatrix4(this.cubeContainer.matrixWorld);
    console.log("FaceTransition.constrainToFace - Constrained position:", constrainedPosition.toArray());
    return constrainedPosition;
  }
}