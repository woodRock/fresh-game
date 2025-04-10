// physics/Collision.ts
import { GameConfig } from "../config/GameConfig.ts";
import { FaceName, FaceUtils } from "../utils/FaceUtils.ts";

export class CollisionSystem {
  mazes: any;
  THREE: any;

  constructor(mazes: any, THREE: any) {
    this.mazes = mazes;
    this.THREE = THREE;
  }

  checkMazeCollision(position: any, face: FaceName, cubeContainer: any) {
    cubeContainer.updateMatrixWorld();
    const cubeInverseMatrix = cubeContainer.matrixWorld.clone().invert();
    const localPos = position.clone().applyMatrix4(cubeInverseMatrix);

    const maze = this.mazes[face];
    const mazeSize = GameConfig.mazeSize;
    const cellSize = GameConfig.cubeSize / mazeSize;
    const halfSize = GameConfig.cubeSize / 2;
    const playerRadius = GameConfig.playerRadius;

    // Map local position to maze coordinates
    let x: number, z: number;
    switch (face) {
      case "top":
        x = Math.floor((localPos.x + halfSize) / cellSize);
        z = Math.floor((halfSize - localPos.z) / cellSize);
        break;
      case "bottom":
        x = Math.floor((localPos.x + halfSize) / cellSize);
        z = Math.floor((localPos.z + halfSize) / cellSize);
        break;
      case "left":
        x = Math.floor((localPos.z + halfSize) / cellSize);
        z = Math.floor((halfSize - localPos.y) / cellSize);
        break;
      case "right":
        x = Math.floor((halfSize - localPos.z) / cellSize);
        z = Math.floor((halfSize - localPos.y) / cellSize);
        break;
      case "front":
        x = Math.floor((localPos.x + halfSize) / cellSize);
        z = Math.floor((halfSize - localPos.y) / cellSize);
        break;
      case "back":
        x = Math.floor((halfSize - localPos.x) / cellSize);
        z = Math.floor((halfSize - localPos.y) / cellSize);
        break;
      default:
        x = 0;
        z = 0;
    }
    
    // Clamp coordinates to maze bounds
    x = Math.max(0, Math.min(mazeSize - 1, x));
    z = Math.max(0, Math.min(mazeSize - 1, z));

    // Check if the player is near an entry/exit point (edge of the face)
    const isNearEdge =
      x === 0 || x === mazeSize - 1 || z === 0 || z === mazeSize - 1;

    // If near an edge, be more lenient with collision detection
    if (isNearEdge) {
      // Only check the player's center cell
      if (maze[z][x] === 0) {
        return false;
      }
    }

    // Check a small area around the player's position to account for radius
    const radiusInCells = Math.ceil(playerRadius / cellSize);
    let isCollision = false;

    for (let dz = -radiusInCells; dz <= radiusInCells; dz++) {
      for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
        const checkX = x + dx;
        const checkZ = z + dz;

        // Skip if outside maze bounds
        if (checkX < 0 || checkX >= mazeSize || checkZ < 0 || checkZ >= mazeSize) {
          continue;
        }

        // Calculate the cell's center in local coordinates
        const cellCenterX = -halfSize + (checkX + 0.5) * cellSize;
        const cellCenterZ = face === "top" ? (halfSize - (checkZ + 0.5) * cellSize) :
                           face === "bottom" ? (-halfSize + (checkZ + 0.5) * cellSize) :
                           face === "left" ? (-halfSize + (checkX + 0.5) * cellSize) :
                           face === "right" ? (halfSize - (checkX + 0.5) * cellSize) :
                           face === "front" ? (-halfSize + (checkX + 0.5) * cellSize) :
                           (halfSize - (checkX + 0.5) * cellSize);

        const deltaX = face === "top" || face === "bottom" || face === "front" ? (localPos.x - cellCenterX) :
                       face === "left" ? (localPos.z - cellCenterX) :
                       face === "right" ? (-localPos.z - cellCenterX) :
                       (-localPos.x - cellCenterX);
        const deltaZ = face === "top" ? (-localPos.z - cellCenterZ) :
                       face === "bottom" ? (localPos.z - cellCenterZ) :
                       face === "left" || face === "right" || face === "front" || face === "back" ? (-localPos.y + cellCenterZ) : 0;

        const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

        if (distance <= playerRadius && maze[checkZ][checkX] === 1) {
          isCollision = true;
          break;
        }
      }
      if (isCollision) break;
    }
    return isCollision;
  }

  handleCollision(playerMesh: any, velocity: any, face: FaceName, cubeContainer: any) {
    const position = playerMesh.position.clone();
    const newPosition = position.clone().add(velocity);

    const direction = velocity.clone().normalize();
    const distance = velocity.length();
    const raycaster = new this.THREE.Raycaster(position, direction, 0, distance + GameConfig.playerRadius);

    const walls = cubeContainer.children.filter((child: any) => child.userData && child.userData.isWall === true);

    const intersections = raycaster.intersectObjects(walls);
    if (intersections.length > 0 && intersections[0].distance <= distance + GameConfig.playerRadius) {
      return new this.THREE.Vector3(0, 0, 0);
    }

    if (this.checkMazeCollision(newPosition, face, cubeContainer)) {
      return new this.THREE.Vector3(0, 0, 0);
    }

    return velocity;
  }
}