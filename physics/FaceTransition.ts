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
  lastTransitionTime: number;
  transitionCooldown: number;
  lastTransitionFace: FaceName | null;
  previousFaceBlockTime: number;
  previousFaceBlockDuration: number;

  constructor(THREE: any, cubeContainer: any, collisionSystem?: any) {
    this.THREE = THREE;
    this.playerRadius = GameConfig.playerRadius;
    this.halfSize = GameConfig.cubeSize / 2;
    this.cubeContainer = cubeContainer;
    this.collisionSystem = collisionSystem;
    this.mazeSize = GameConfig.mazeSize;
    
    // Add transition cooldown to prevent rapid face switching
    this.lastTransitionTime = 0;
    this.transitionCooldown = 500; // milliseconds - general cooldown between any transitions
    this.lastTransitionFace = null;
    
    // Add a separate, shorter block time for the previous face
    this.previousFaceBlockTime = 0;
    this.previousFaceBlockDuration = 1000; // 1 second block for previous face
  }

  checkFaceTransition(position: any, currentFace: FaceName) {
    this.cubeContainer.updateMatrixWorld();
    const cubeInverseMatrix = this.cubeContainer.matrixWorld.clone().invert();
    const localPos = position.clone().applyMatrix4(cubeInverseMatrix);

    // Check if we're within the cooldown period for any transition
    const currentTime = Date.now();
    if (currentTime - this.lastTransitionTime < this.transitionCooldown) {
      return { transitioned: false, newFace: null, newPosition: null };
    }

    // Face edges - player must be somewhat past the edge to trigger transition
    // We use a portion of the player radius as the metric for how far they need to be hanging off
    const edgeOverhang = this.playerRadius * 0.4; // Player must be 40% of radius past the edge
    
    // Where the face edge actually is - using full cube size
    const faceEdge = this.halfSize;
    
    // Buffer zone to prevent getting stuck at edges
    const edgeBuffer = 0.2;
    
    // Distance to place player from face surface after transition
    const surfaceOffset = this.playerRadius * 1.5; // Ensures player spawns outside the cube

    let transitioned = false;
    let newFace: FaceName | null = null;
    let newPosition: any = null;
    let entryDirection: "positive" | "negative" | null = null;
    let entryAxis: "x" | "y" | "z" | null = null;

    switch (currentFace) {
      case "top": // y = halfSize
        if (localPos.z <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the front edge
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Clamp x with player radius buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z - edgeBuffer)); // Map z to y, clamp with buffer
          const newZ = this.halfSize - surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition - Transitioning from top to front - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.z >= faceEdge - edgeOverhang) { // Hanging somewhat off the back edge
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Flip x, clamp with buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z - edgeBuffer)); // Map z to y, clamp with buffer
          const newZ = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition - Transitioning from top to back - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.x <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the left edge
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.y)); // Adjusted y mapping with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z)); // Preserve z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from top to left - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        } else if (localPos.x >= faceEdge - edgeOverhang) { // Hanging somewhat off the right edge
          newFace = "right"; // x = halfSize
          const newX = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.y)); // Adjusted y mapping with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z)); // Flip z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from top to right - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        }
        break;
      case "bottom": // y = -halfSize
        if (localPos.z >= faceEdge - edgeOverhang) { // Hanging somewhat off the front edge
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Preserve x, clamp with buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z - edgeBuffer)); // Map z to y, clamp with buffer
          const newZ = this.halfSize - surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "y";
          console.log("FaceTransition - Transitioning from bottom to front - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.z <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the back edge
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Flip x, clamp with buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z - edgeBuffer)); // Map z to y, clamp with buffer
          const newZ = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "y";
          console.log("FaceTransition - Transitioning from bottom to back - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.x <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the left edge
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Adjusted y mapping with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z)); // Flip z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from bottom to left - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        } else if (localPos.x >= faceEdge - edgeOverhang) { // Hanging somewhat off the right edge
          newFace = "right"; // x = halfSize
          const newX = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Adjusted y mapping with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z)); // Preserve z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from bottom to right - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        }
        break;
      case "left": // x = -halfSize
        if (localPos.z <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the front edge
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z)); // Map z to x, flipped, clamp with buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = this.halfSize - surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from left to front - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.z >= faceEdge - edgeOverhang) { // Hanging somewhat off the back edge
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z)); // Map z to x, clamp with buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from left to back - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.y >= faceEdge - edgeOverhang) { // Hanging somewhat off the top edge
          newFace = "top"; // y = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z)); // Map z to x, clamp with buffer
          const newY = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Map x to z, flipped, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from left to top - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        } else if (localPos.y <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the bottom edge
          newFace = "bottom"; // y = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z)); // Map z to x, clamp with buffer
          const newY = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Map x to z, flipped, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from left to bottom - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        }
        break;
      case "right": // x = halfSize
        if (localPos.z <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the front edge
          newFace = "back"; // z = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z)); // Map z to x, clamp with buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from right to back - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.z >= faceEdge - edgeOverhang) { // Hanging somewhat off the back edge
          newFace = "front"; // z = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z)); // Map z to x, flipped, clamp with buffer
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = this.halfSize - surfaceOffset; // Exactly on surface with offset
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from right to front - player hanging off by", Math.abs(localPos.z) - (faceEdge - edgeOverhang));
        } else if (localPos.y >= faceEdge - edgeOverhang) { // Hanging somewhat off the top edge
          newFace = "top"; // y = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.z)); // Map z to x, clamp with buffer
          const newY = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Map x to z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from right to top - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        } else if (localPos.y <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the bottom edge
          newFace = "bottom"; // y = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.z)); // Map z to x, flipped, clamp with buffer
          const newY = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Map x to z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "x";
          console.log("FaceTransition - Transitioning from right to bottom - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        }
        break;
      case "front": // z = halfSize
        if (localPos.y >= faceEdge - edgeOverhang) { // Hanging somewhat off the top edge
          newFace = "top"; // y = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Preserve x, clamp with buffer
          const newY = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.y)); // Map y to z, flipped, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from front to top - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        } else if (localPos.y <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the bottom edge
          newFace = "bottom"; // y = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Preserve x, clamp with buffer
          const newY = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Map y to z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from front to bottom - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        } else if (localPos.x <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the left edge
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Map x to z, flipped, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from front to left - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        } else if (localPos.x >= faceEdge - edgeOverhang) { // Hanging somewhat off the right edge
          newFace = "right"; // x = halfSize
          const newX = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Map x to z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from front to right - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        }
        break;
      case "back": // z = -halfSize
        if (localPos.y >= faceEdge - edgeOverhang) { // Hanging somewhat off the top edge
          newFace = "top"; // y = halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Flip x, clamp with buffer
          const newY = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Map y to z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from back to top - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        } else if (localPos.y <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the bottom edge
          newFace = "bottom"; // y = -halfSize
          const newX = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Flip x, clamp with buffer
          const newY = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.y)); // Map y to z, flipped, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from back to bottom - player hanging off by", Math.abs(localPos.y) - (faceEdge - edgeOverhang));
        } else if (localPos.x <= -(faceEdge - edgeOverhang)) { // Hanging somewhat off the left edge
          newFace = "right"; // x = halfSize
          const newX = this.halfSize - surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.x)); // Map x to z, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "negative";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from back to right - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        } else if (localPos.x >= faceEdge - edgeOverhang) { // Hanging somewhat off the right edge
          newFace = "left"; // x = -halfSize
          const newX = -this.halfSize + surfaceOffset; // Exactly on surface with offset
          const newY = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, localPos.y)); // Preserve y, clamp with buffer
          const newZ = Math.max(-this.halfSize + this.playerRadius, Math.min(this.halfSize - this.playerRadius, -localPos.x)); // Map x to z, flipped, clamp with buffer
          localPos.set(newX, newY, newZ);
          entryDirection = "positive";
          entryAxis = "z";
          console.log("FaceTransition - Transitioning from back to left - player hanging off by", Math.abs(localPos.x) - (faceEdge - edgeOverhang));
        }
        break;
    }

    // Check if we're trying to transition back to the last face we came from
    // and still within the block time for that specific face
    if (newFace === this.lastTransitionFace && 
        currentTime - this.previousFaceBlockTime < this.previousFaceBlockDuration) {
      console.log(`FaceTransition - Blocking transition back to ${newFace} (previous face) - cooldown active`);
      return { transitioned: false, newFace: null, newPosition: null };
    }

    if (newFace) {
      transitioned = true;
      newPosition = localPos.clone().applyMatrix4(this.cubeContainer.matrixWorld);
      console.log("FaceTransition - Initial new position on", newFace, ":", newPosition.toArray());

      // Validate position to ensure it's collision-free
      if (this.collisionSystem && this.collisionSystem.checkMazeCollision(newPosition, newFace, this.cubeContainer).collision) {
        console.error("FaceTransition - Initial position collides with wall on", newFace);
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
        const stepSize = this.playerRadius * 0.1; // Increased step size for better movement away from walls

        while (this.collisionSystem.checkMazeCollision(newPosition, newFace, this.cubeContainer).collision && attempts < maxAttempts) {
          console.log("FaceTransition - Adjusting inward, attempt", attempts + 1);
          newPosition.add(adjustmentVector.clone().multiplyScalar(stepSize));
          localPos.copy(newPosition.clone().applyMatrix4(cubeInverseMatrix));
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.error("FaceTransition - Failed to find a collision-free position on", newFace);
          // Improved fallback: Find the nearest safe position in the center of the face
          switch (newFace) {
            case "top":
              localPos.y = this.halfSize - surfaceOffset;
              localPos.x = 0; // Move to center of face
              localPos.z = 0; // Move to center of face
              break;
            case "bottom":
              localPos.y = -this.halfSize + surfaceOffset;
              localPos.x = 0; // Move to center of face
              localPos.z = 0; // Move to center of face
              break;
            case "left":
              localPos.x = -this.halfSize + surfaceOffset;
              localPos.y = 0; // Move to center of face
              localPos.z = 0; // Move to center of face
              break;
            case "right":
              localPos.x = this.halfSize - surfaceOffset;
              localPos.y = 0; // Move to center of face
              localPos.z = 0; // Move to center of face
              break;
            case "front":
              localPos.z = this.halfSize - surfaceOffset;
              localPos.x = 0; // Move to center of face
              localPos.y = 0; // Move to center of face
              break;
            case "back":
              localPos.z = -this.halfSize + surfaceOffset;
              localPos.x = 0; // Move to center of face
              localPos.y = 0; // Move to center of face
              break;
          }
          newPosition = localPos.clone().applyMatrix4(this.cubeContainer.matrixWorld);
          console.log("FaceTransition - Fallback position on", newFace, ":", newPosition.toArray());
        } else {
          console.log("FaceTransition - Found collision-free position after", attempts, "attempts:", newPosition.toArray());
        }
      } else {
        console.log("FaceTransition - Initial position is collision-free:", newPosition.toArray());
      }
      
      // Update last transition time
      this.lastTransitionTime = currentTime;
      
      // Set the previous face block time to prevent immediate transitions back
      this.previousFaceBlockTime = currentTime;
      
      // Remember the face we came from (current face becomes last transition face)
      this.lastTransitionFace = currentFace;
    } else {
      console.log("FaceTransition - No face transition occurred from", currentFace);
    }

    return { transitioned, newFace, newPosition };
  }

  constrainToFace(position: any, face: FaceName) {
    this.cubeContainer.updateMatrixWorld();
    const cubeInverseMatrix = this.cubeContainer.matrixWorld.clone().invert();
    const localPos = position.clone().applyMatrix4(cubeInverseMatrix);

    // Less restrictive buffer to allow player to reach and hang off edges
    const buffer = this.playerRadius * 0.4; // Reduced from 1.1 to 0.4
    const threshold = this.halfSize - buffer;
    // Surface offset to keep player outside the cube
    const surfaceOffset = this.playerRadius * 1.5;

    switch (face) {
      case "top":
        // Always stay exactly on the surface with proper offset
        localPos.y = this.halfSize + surfaceOffset;
        // Less restrictive boundary constraints to allow reaching edges
        localPos.x = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.x));
        localPos.z = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.z));
        break;
      case "bottom":
        // Always stay exactly on the surface with proper offset
        localPos.y = -this.halfSize - surfaceOffset;
        // Less restrictive boundary constraints to allow reaching edges
        localPos.x = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.x));
        localPos.z = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.z));
        break;
      case "left":
        // Always stay exactly on the surface with proper offset
        localPos.x = -this.halfSize - surfaceOffset;
        // Less restrictive boundary constraints to allow reaching edges
        localPos.y = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.y));
        localPos.z = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.z));
        break;
      case "right":
        // Always stay exactly on the surface with proper offset
        localPos.x = this.halfSize + surfaceOffset;
        // Less restrictive boundary constraints to allow reaching edges
        localPos.y = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.y));
        localPos.z = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.z));
        break;
      case "front":
        // Always stay exactly on the surface with proper offset
        localPos.z = this.halfSize + surfaceOffset;
        // Less restrictive boundary constraints to allow reaching edges
        localPos.x = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.x));
        localPos.y = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.y));
        break;
      case "back":
        // Always stay exactly on the surface with proper offset
        localPos.z = -this.halfSize - surfaceOffset;
        // Less restrictive boundary constraints to allow reaching edges
        localPos.x = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.x));
        localPos.y = Math.max(-this.halfSize - this.playerRadius*0.5, Math.min(this.halfSize + this.playerRadius*0.5, localPos.y));
        break;
      default:
        console.warn("FaceTransition.constrainToFace - Unknown face:", face);
    }

    const constrainedPosition = localPos.applyMatrix4(this.cubeContainer.matrixWorld);
    return constrainedPosition;
  }
}