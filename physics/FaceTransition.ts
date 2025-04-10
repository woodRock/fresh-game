// physics/FaceTransition.ts
import { FaceName, FaceUtils } from "../utils/FaceUtils.ts";
import { GameConfig } from "../config/GameConfig.ts";

export class FaceTransitionSystem {
  THREE: any;
  playerRadius: number;
  halfSize: number;
  cubeContainer: any;
  collisionSystem: any;

  constructor(THREE: any, cubeContainer: any, collisionSystem?: any) {
    this.THREE = THREE;
    this.playerRadius = GameConfig.playerRadius;
    this.halfSize = GameConfig.cubeSize / 2;
    this.cubeContainer = cubeContainer;
    this.collisionSystem = collisionSystem;
  }

  checkFaceTransition(position: any, currentFace: FaceName) {
    this.cubeContainer.updateMatrixWorld();
    const cubeInverseMatrix = this.cubeContainer.matrixWorld.clone().invert();
    const localPos = position.clone().applyMatrix4(cubeInverseMatrix);

    // Debug logging for initial position and threshold
    console.log("FaceTransition.checkFaceTransition - World position:", position.toArray());
    console.log("FaceTransition.checkFaceTransition - Local position:", localPos.toArray());
    const threshold = this.halfSize - this.playerRadius; // Adjusted to 25 - 0.5 = 24.5
    console.log("FaceTransition.checkFaceTransition - Threshold:", threshold);
    console.log("FaceTransition.checkFaceTransition - halfSize:", this.halfSize);
    console.log("FaceTransition.checkFaceTransition - playerRadius:", this.playerRadius);

    let transitioned = false;
    let newFace: FaceName | null = null;
    let newPosition: any = null;
    let entryDirection: "positive" | "negative" | null = null;
    let entryAxis: "x" | "y" | "z" | null = null;

    // Check for transitions based on the current face
    switch (currentFace) {
      case "top":
        console.log(
          "FaceTransition.checkFaceTransition - Top face checks:",
          `z <= ${-threshold} (z: ${localPos.z}),`,
          `z >= ${threshold} (z: ${localPos.z}),`,
          `x <= ${-threshold} (x: ${localPos.x}),`,
          `x >= ${threshold} (x: ${localPos.x})`
        );
        if (localPos.z <= -threshold) {
          // Transition to front (Z <= -threshold)
          newFace = "front";
          const newX = localPos.x; // Preserve X
          const newY = localPos.z + this.halfSize; // Map Z on top to Y on front
          const newZ = this.halfSize + this.playerRadius + 0.01; // Set Z to just above front face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to front");
        } else if (localPos.z >= threshold) {
          // Transition to back (Z >= threshold)
          newFace = "back";
          const newX = -localPos.x; // Mirror X
          const newY = -(localPos.z - this.halfSize); // Map Z on top to -Y on back
          const newZ = -this.halfSize - this.playerRadius - 0.01; // Set Z to just below back face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to back");
        } else if (localPos.x <= -threshold) {
          // Transition to left (X <= -threshold)
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01; // Set X to just inside left face
          const newY = localPos.y - this.halfSize; // Map Y on top to Y on left
          const newZ = localPos.z; // Preserve Z
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to left");
        } else if (localPos.x >= threshold) {
          // Transition to right (X >= threshold)
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01; // Set X to just inside right face
          const newY = localPos.y - this.halfSize; // Map Y on top to Y on right
          const newZ = -localPos.z; // Map Z on top to -Z on right
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from top to right");
        } else {
          console.log("FaceTransition.checkFaceTransition - No transition triggered on top face");
        }
        break;
      case "bottom":
        console.log(
          "FaceTransition.checkFaceTransition - Bottom face checks:",
          `z >= ${threshold} (z: ${localPos.z}),`,
          `z <= ${-threshold} (z: ${localPos.z}),`,
          `x <= ${-threshold} (x: ${localPos.x}),`,
          `x >= ${threshold} (x: ${localPos.x})`
        );
        if (localPos.z >= threshold) {
          // Transition to front (Z >= threshold)
          newFace = "front";
          const newX = localPos.x; // Preserve X
          const newY = -(localPos.z - this.halfSize); // Map Z on bottom to -Y on front
          const newZ = this.halfSize + this.playerRadius + 0.01; // Set Z to just above front face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to front");
        } else if (localPos.z <= -threshold) {
          // Transition to back (Z <= -threshold)
          newFace = "back";
          const newX = -localPos.x; // Mirror X
          const newY = localPos.z + this.halfSize; // Map Z on bottom to Y on back
          const newZ = -this.halfSize - this.playerRadius - 0.01; // Set Z to just below back face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to back");
        } else if (localPos.x <= -threshold) {
          // Transition to left (X <= -threshold)
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01; // Set X to just inside left face
          const newY = -(localPos.y + this.halfSize); // Map Y on bottom to -Y on left
          const newZ = -localPos.z; // Map Z on bottom to -Z on left
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to left");
        } else if (localPos.x >= threshold) {
          // Transition to right (X >= threshold)
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01; // Set X to just inside right face
          const newY = -(localPos.y + this.halfSize); // Map Y on bottom to -Y on right
          const newZ = localPos.z; // Preserve Z
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from bottom to right");
        } else {
          console.log("FaceTransition.checkFaceTransition - No transition triggered on bottom face");
        }
        break;
      case "left":
        console.log(
          "FaceTransition.checkFaceTransition - Left face checks:",
          `z <= ${-threshold} (z: ${localPos.z}),`,
          `z >= ${threshold} (z: ${localPos.z}),`,
          `y >= ${threshold} (y: ${localPos.y}),`,
          `y <= ${-threshold} (y: ${localPos.y})`
        );
        if (localPos.z <= -threshold) {
          // Transition to front (Z <= -threshold)
          newFace = "front";
          const newX = localPos.x + this.halfSize; // Map X on left to X on front
          const newY = localPos.y; // Preserve Y
          const newZ = this.halfSize + this.playerRadius + 0.01; // Set Z to just above front face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to front");
        } else if (localPos.z >= threshold) {
          // Transition to back (Z >= threshold)
          newFace = "back";
          const newX = -(localPos.x + this.halfSize); // Map X on left to -X on back
          const newY = localPos.y; // Preserve Y
          const newZ = -this.halfSize - this.playerRadius - 0.01; // Set Z to just below back face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to back");
        } else if (localPos.y >= threshold) {
          // Transition to top (Y >= threshold)
          newFace = "top";
          const newX = localPos.x + this.halfSize; // Map X on left to X on top
          const newY = this.halfSize + this.playerRadius + 0.01; // Set Y to just above top face
          const newZ = localPos.z; // Preserve Z
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to top");
        } else if (localPos.y <= -threshold) {
          // Transition to bottom (Y <= -threshold)
          newFace = "bottom";
          const newX = localPos.x + this.halfSize; // Map X on left to X on bottom
          const newY = -this.halfSize - this.playerRadius - 0.01; // Set Y to just below bottom face
          const newZ = -localPos.z; // Map Z on left to -Z on bottom
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from left to bottom");
        } else {
          console.log("FaceTransition.checkFaceTransition - No transition triggered on left face");
        }
        break;
      case "right":
        console.log(
          "FaceTransition.checkFaceTransition - Right face checks:",
          `z <= ${-threshold} (z: ${localPos.z}),`,
          `z >= ${threshold} (z: ${localPos.z}),`,
          `y >= ${threshold} (y: ${localPos.y}),`,
          `y <= ${-threshold} (y: ${localPos.y})`
        );
        if (localPos.z <= -threshold) {
          // Transition to back (Z <= -threshold)
          newFace = "back";
          const newX = -(localPos.x - this.halfSize); // Map X on right to -X on back
          const newY = localPos.y; // Preserve Y
          const newZ = -this.halfSize - this.playerRadius - 0.01; // Set Z to just below back face
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to back");
        } else if (localPos.z >= threshold) {
          // Transition to front (Z >= threshold)
          newFace = "front";
          const newX = localPos.x - this.halfSize; // Map X on right to X on front
          const newY = localPos.y; // Preserve Y
          const newZ = this.halfSize + this.playerRadius + 0.01; // Set Z to just above front face
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to front");
        } else if (localPos.y >= threshold) {
          // Transition to top (Y >= threshold)
          newFace = "top";
          const newX = localPos.x - this.halfSize; // Map X on right to X on top
          const newY = this.halfSize + this.playerRadius + 0.01; // Set Y to just above top face
          const newZ = -localPos.z; // Map Z on right to -Z on top
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to top");
        } else if (localPos.y <= -threshold) {
          // Transition to bottom (Y <= -threshold)
          newFace = "bottom";
          const newX = localPos.x - this.halfSize; // Map X on right to X on bottom
          const newY = -this.halfSize - this.playerRadius - 0.01; // Set Y to just below bottom face
          const newZ = localPos.z; // Preserve Z
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition.checkFaceTransition - Transitioning from right to bottom");
        } else {
          console.log("FaceTransition.checkFaceTransition - No transition triggered on right face");
        }
        break;
      case "front":
        console.log(
          "FaceTransition.checkFaceTransition - Front face checks:",
          `y >= ${threshold} (y: ${localPos.y}),`,
          `y <= ${-threshold} (y: ${localPos.y}),`,
          `x <= ${-threshold} (x: ${localPos.x}),`,
          `x >= ${threshold} (x: ${localPos.x})`
        );
        if (localPos.y >= threshold) {
          // Transition to top (Y >= threshold)
          newFace = "top";
          const newX = localPos.x; // Preserve X
          const newY = this.halfSize + this.playerRadius + 0.01; // Set Y to just above top face
          const newZ = -(localPos.y - this.halfSize); // Map Y on front to -Z on top
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to top");
        } else if (localPos.y <= -threshold) {
          // Transition to bottom (Y <= -threshold)
          newFace = "bottom";
          const newX = localPos.x; // Preserve X
          const newY = -this.halfSize - this.playerRadius - 0.01; // Set Y to just below bottom face
          const newZ = localPos.y + this.halfSize; // Map Y on front to Z on bottom
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to bottom");
        } else if (localPos.x <= -threshold) {
          // Transition to left (X <= -threshold)
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01; // Set X to just inside left face
          const newY = localPos.y; // Preserve Y
          const newZ = localPos.z - this.halfSize; // Map Z on front to Z on left
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to left");
        } else if (localPos.x >= threshold) {
          // Transition to right (X >= threshold)
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01; // Set X to just inside right face
          const newY = localPos.y; // Preserve Y
          const newZ = -(localPos.z - this.halfSize); // Map Z on front to -Z on right
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from front to right");
        } else {
          console.log("FaceTransition.checkFaceTransition - No transition triggered on front face");
        }
        break;
      case "back":
        console.log(
          "FaceTransition.checkFaceTransition - Back face checks:",
          `y >= ${threshold} (y: ${localPos.y}),`,
          `y <= ${-threshold} (y: ${localPos.y}),`,
          `x <= ${-threshold} (x: ${localPos.x}),`,
          `x >= ${threshold} (x: ${localPos.x})`
        );
        if (localPos.y >= threshold) {
          // Transition to top (Y >= threshold)
          newFace = "top";
          const newX = -localPos.x; // Mirror X
          const newY = this.halfSize + this.playerRadius + 0.01; // Set Y to just above top face
          const newZ = localPos.y - this.halfSize; // Map Y on back to Z on top
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to top");
        } else if (localPos.y <= -threshold) {
          // Transition to bottom (Y <= -threshold)
          newFace = "bottom";
          const newX = -localPos.x; // Mirror X
          const newY = -this.halfSize - this.playerRadius - 0.01; // Set Y to just below bottom face
          const newZ = -(localPos.y + this.halfSize); // Map Y on back to -Z on bottom
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to bottom");
        } else if (localPos.x <= -threshold) {
          // Transition to right (X <= -threshold)
          newFace = "right";
          const newX = this.halfSize + this.playerRadius + 0.01; // Set X to just inside right face
          const newY = localPos.y; // Preserve Y
          const newZ = localPos.z + this.halfSize; // Map Z on back to Z on right
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to right");
        } else if (localPos.x >= threshold) {
          // Transition to left (X >= threshold)
          newFace = "left";
          const newX = -this.halfSize - this.playerRadius - 0.01; // Set X to just inside left face
          const newY = localPos.y; // Preserve Y
          const newZ = -(localPos.z + this.halfSize); // Map Z on back to -Z on left
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition.checkFaceTransition - Transitioning from back to left");
        } else {
          console.log("FaceTransition.checkFaceTransition - No transition triggered on back face");
        }
        break;
    }

    if (newFace) {
      transitioned = true;
      newPosition = localPos.clone().applyMatrix4(this.cubeContainer.matrixWorld);
      console.log("FaceTransition.checkFaceTransition - Initial new position on", newFace, ":", newPosition.toArray());

      // Validate position to ensure it's collision-free
      if (this.collisionSystem) {
        let attempts = 0;
        const maxAttempts = 100; // Allow more attempts to find a clear path
        const stepSize = this.playerRadius * 0.5;

        // Get the face's axes
        const { forward, right } = FaceUtils.getFaceAxes(newFace, this.THREE);
        this.cubeContainer.updateMatrixWorld();
        const worldForward = forward.clone().transformDirection(this.cubeContainer.matrixWorld).normalize();
        const worldRight = right.clone().transformDirection(this.cubeContainer.matrixWorld).normalize();

        // Define directions to try: forward, backward, right, left
        const directions = [
          { vector: worldForward, name: "forward", direction: 1 },
          { vector: worldForward.clone().negate(), name: "backward", direction: -1 },
          { vector: worldRight, name: "right", direction: 1 },
          { vector: worldRight.clone().negate(), name: "left", direction: -1 },
        ];

        let directionIndex = 0;
        let currentDirection = directions[directionIndex];

        // Check if the initial position is in a wall
        while (this.collisionSystem.checkMazeCollision(newPosition, newFace, this.cubeContainer) && attempts < maxAttempts) {
          console.log("FaceTransition.checkFaceTransition - Initial position collides with wall on", newFace, ", adjusting... Attempt", attempts + 1);
          console.log("FaceTransition.checkFaceTransition - Current position:", newPosition.toArray());
          console.log("FaceTransition.checkFaceTransition - Adjusting along", currentDirection.name, "axis, direction:", currentDirection.direction);
          newPosition.add(currentDirection.vector.clone().multiplyScalar(stepSize * currentDirection.direction));
          localPos.copy(newPosition.clone().applyMatrix4(cubeInverseMatrix));
          console.log("FaceTransition.checkFaceTransition - Adjusted position:", newPosition.toArray());
          attempts++;

          // Switch direction every 25 attempts
          if (attempts % 25 === 0) {
            directionIndex = (directionIndex + 1) % directions.length;
            currentDirection = directions[directionIndex];
            console.log("FaceTransition.checkFaceTransition - Switching to", currentDirection.name, "axis, direction:", currentDirection.direction);
          }
        }

        if (attempts >= maxAttempts) {
          console.error("FaceTransition.checkFaceTransition - Failed to find a collision-free position on", newFace, "after", maxAttempts, "attempts");
          console.log("FaceTransition.checkFaceTransition - Final adjusted position on", newFace, ":", newPosition.toArray());
          // Keep the last adjusted position for debugging; do not fallback to center
        } else if (attempts > 0) {
          console.log("FaceTransition.checkFaceTransition - Found collision-free position after", attempts, "attempts:", newPosition.toArray());
        } else {
          console.log("FaceTransition.checkFaceTransition - Initial position is collision-free:", newPosition.toArray());
        }
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