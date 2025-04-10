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

    switch (currentFace) {
      case "top": // y = halfSize
        if (localPos.z <= -threshold) {
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.x)); // Clamp x
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Map z to y, clamp
          const newZ = this.halfSize + this.playerRadius; // Just outside front face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to front");
        } else if (localPos.z >= threshold) {
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.x)); // Flip x, clamp
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Map z to y, clamp
          const newZ = -this.halfSize - this.playerRadius; // Just outside back face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to back");
        } else if (localPos.x <= -threshold) {
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize - this.playerRadius; // Just outside left face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y - this.halfSize)); // Adjust y, clamp
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Preserve z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to left");
        } else if (localPos.x >= threshold) {
          newFace = "right"; // x = halfSize
          const newX = this.halfSize + this.playerRadius; // Just outside right face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y - this.halfSize)); // Adjust y, clamp
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Flip z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to right");
        }
        break;
      case "bottom": // y = -halfSize
        if (localPos.z >= threshold) {
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.x)); // Preserve x, clamp
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Map z to y, clamp
          const newZ = this.halfSize + this.playerRadius; // Just outside front face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to front");
        } else if (localPos.z <= -threshold) {
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.x)); // Flip x, clamp
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Map z to y, clamp
          const newZ = -this.halfSize - this.playerRadius; // Just outside back face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to back");
        } else if (localPos.x <= -threshold) {
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize - this.playerRadius; // Just outside left face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, -(localPos.y + this.halfSize))); // Adjust y, clamp
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Flip z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to left");
        } else if (localPos.x >= threshold) {
          newFace = "right"; // x = halfSize
          const newX = this.halfSize + this.playerRadius; // Just outside right face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, -(localPos.y + this.halfSize))); // Adjust y, clamp
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Preserve z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to right");
        }
        break;
      case "left": // x = -halfSize
        if (localPos.z <= -threshold) {
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Map z to x, clamp
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = this.halfSize + this.playerRadius; // Just outside front face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to front");
        } else if (localPos.z >= threshold) {
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Map z to x, flipped, clamp
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = -this.halfSize - this.playerRadius; // Just outside back face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to back");
        } else if (localPos.y >= threshold) {
          newFace = "top"; // y = halfSize
          const newX = localPos.x + this.halfSize; // Adjust x to align with top
          const newY = this.halfSize + this.playerRadius; // Just outside top face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Preserve z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom"; // y = -halfSize
          const newX = localPos.x + this.halfSize; // Adjust x to align with bottom
          const newY = -this.halfSize - this.playerRadius; // Just outside bottom face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Flip z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to bottom");
        }
        break;
      case "right": // x = halfSize
        if (localPos.z <= -threshold) {
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Map z to x, flipped, clamp
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = -this.halfSize - this.playerRadius; // Just outside back face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to back");
        } else if (localPos.z >= threshold) {
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Map z to x, clamp
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = this.halfSize + this.playerRadius; // Just outside front face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to front");
        } else if (localPos.y >= threshold) {
          newFace = "top"; // y = halfSize
          const newX = localPos.x - this.halfSize; // Adjust x to align with top
          const newY = this.halfSize + this.playerRadius; // Just outside top face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.z)); // Flip z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom"; // y = -halfSize
          const newX = localPos.x - this.halfSize; // Adjust x to align with bottom
          const newY = -this.halfSize - this.playerRadius; // Just outside bottom face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.z)); // Preserve z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to bottom");
        }
        break;
      case "front": // z = halfSize
        if (localPos.y >= threshold) {
          newFace = "top"; // y = halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.x)); // Preserve x, clamp
          const newY = this.halfSize + this.playerRadius; // Just outside top face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.y)); // Map y to z, flipped, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom"; // y = -halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.x)); // Preserve x, clamp
          const newY = -this.halfSize - this.playerRadius; // Just outside bottom face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Map y to z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to bottom");
        } else if (localPos.x <= -threshold) {
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize - this.playerRadius; // Just outside left face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = localPos.z - this.halfSize; // Adjust z to align with left
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to left");
        } else if (localPos.x >= threshold) {
          newFace = "right"; // x = halfSize
          const newX = this.halfSize + this.playerRadius; // Just outside right face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.x)); // Map x to z, flipped, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to right");
        }
        break;
      case "back": // z = -halfSize
        if (localPos.y >= threshold) {
          newFace = "top"; // y = halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.x)); // Flip x, clamp
          const newY = this.halfSize + this.playerRadius; // Just outside top face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Map y to z, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to top");
        } else if (localPos.y <= -threshold) {
          newFace = "bottom"; // y = -halfSize
          const newX = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.x)); // Flip x, clamp
          const newY = -this.halfSize - this.playerRadius; // Just outside bottom face
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.y)); // Map y to z, flipped, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to bottom");
        } else if (localPos.x <= -threshold) {
          newFace = "right"; // x = halfSize
          const newX = this.halfSize + this.playerRadius; // Just outside right face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, -localPos.x)); // Map x to z, flipped, clamp
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to right");
        } else if (localPos.x >= threshold) {
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize - this.playerRadius; // Just outside left face
          const newY = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.y)); // Preserve y, clamp
          const newZ = Math.max(-this.halfSize, Math.min(this.halfSize, localPos.x)); // Map x to z, clamp
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
        // Adjust inward
        const { forward } = FaceUtils.getFaceAxes(newFace, this.THREE);
        this.cubeContainer.updateMatrixWorld();
        const worldForward = forward.clone().transformDirection(this.cubeContainer.matrixWorld).normalize();
        let adjustmentVector: any;
        if (entryAxis === "y") {
          adjustmentVector = worldForward.clone().multiplyScalar(entryDirection === "positive" ? -1 : 1);
        } else if (entryAxis === "z") {
          adjustmentVector = worldForward.clone().multiplyScalar(entryDirection === "positive" ? -1 : 1);
        } else if (entryAxis === "x") {
          adjustmentVector = worldForward.clone().multiplyScalar(entryDirection === "positive" ? -1 : 1);
        }

        let attempts = 0;
        const maxAttempts = 20;
        const stepSize = this.playerRadius * 0.05;

        while (this.collisionSystem.checkMazeCollision(newPosition, newFace, this.cubeContainer) && attempts < maxAttempts) {
          console.log("FaceTransition.checkFaceTransition - Adjusting inward, attempt", attempts + 1);
          newPosition.add(adjustmentVector.clone().multiplyScalar(stepSize));
          localPos.copy(newPosition.clone().applyMatrix4(cubeInverseMatrix));
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.error("FaceTransition.checkFaceTransition - Failed to find a collision-free position on", newFace);
          // Fallback: Move slightly inward from the outer boundary
          switch (newFace) {
            case "top":
              localPos.y = this.halfSize - this.playerRadius;
              break;
            case "bottom":
              localPos.y = -this.halfSize + this.playerRadius;
              break;
            case "left":
              localPos.x = -this.halfSize + this.playerRadius;
              break;
            case "right":
              localPos.x = this.halfSize - this.playerRadius;
              break;
            case "front":
              localPos.z = this.halfSize - this.playerRadius;
              break;
            case "back":
              localPos.z = -this.halfSize + this.playerRadius;
              break;
          }
          newPosition = localPos.clone().applyMatrix4(this.cubeContainer.matrixWorld);
          console.log("FaceTransition.checkFaceTransition - Fallback position on", newFace, ":", newPosition.toArray());
        } else {
          console.log("FaceTransition.checkFaceTransition - Found collision-free position after", attempts, "attempts:", newPosition.toArray());
        }
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
        localPos.y = Math.min(threshold + this.playerRadius, localPos.y); // Allow just outside
        localPos.x = Math.max(-threshold, Math.min(threshold, localPos.x));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "bottom":
        localPos.y = Math.max(-threshold - this.playerRadius, localPos.y); // Allow just outside
        localPos.x = Math.max(-threshold, Math.min(threshold, localPos.x));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "left":
        localPos.x = Math.max(-threshold - this.playerRadius, localPos.x); // Allow just outside
        localPos.y = Math.max(-threshold, Math.min(threshold, localPos.y));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "right":
        localPos.x = Math.min(threshold + this.playerRadius, localPos.x); // Allow just outside
        localPos.y = Math.max(-threshold, Math.min(threshold, localPos.y));
        localPos.z = Math.max(-threshold, Math.min(threshold, localPos.z));
        break;
      case "front":
        localPos.z = Math.min(threshold + this.playerRadius, localPos.z); // Allow just outside
        localPos.x = Math.max(-threshold, Math.min(threshold, localPos.x));
        localPos.y = Math.max(-threshold, Math.min(threshold, localPos.y));
        break;
      case "back":
        localPos.z = Math.max(-threshold - this.playerRadius, localPos.z); // Allow just outside
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