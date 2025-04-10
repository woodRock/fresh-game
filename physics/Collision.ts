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

    // Map local position to maze coordinates
    let x: number, z: number;
    switch (face) {
      case "top":
      case "bottom":
        x = Math.floor((localPos.x + halfSize) / cellSize);
        z = Math.floor((halfSize - localPos.z) / cellSize);
        break;
      case "left":
      case "right":
        x = Math.floor((localPos.z + halfSize) / cellSize);
        z = Math.floor((halfSize - localPos.y) / cellSize);
        break;
      case "front":
      case "back":
        x = Math.floor((localPos.x + halfSize) / cellSize);
        z = Math.floor((halfSize - localPos.y) / cellSize);
        break;
      default:
        x = 0;
        z = 0;
    }

    // Debug logging
    console.log(`Checking collision on ${face} at local position:`, localPos.toArray());
    console.log(`Mapped to maze cell: [${x}, ${z}]`);

    // Check if the position is within maze bounds
    if (x < 0 || x >= mazeSize || z < 0 || z >= mazeSize) {
      console.log(`Position out of maze bounds: [${x}, ${z}]`);
      return true; // Treat out-of-bounds as a collision
    }

    // Check if the cell is a wall (1) or a path (0)
    const isWall = maze[z][x] === 1;
    console.log(`Cell [${x}, ${z}] is ${isWall ? "a wall" : "a path"}`);
    return isWall;
  }

  handleCollision(playerMesh: any, velocity: any, face: FaceName, cubeContainer: any) {
    const position = playerMesh.position.clone();
    const newPosition = position.clone().add(velocity);

    // Check if the new position would result in a collision
    if (this.checkMazeCollision(newPosition, face, cubeContainer)) {
      // If there's a collision, return zero velocity to prevent movement
      console.log(`Collision detected at new position:`, newPosition.toArray());
      return new this.THREE.Vector3(0, 0, 0);
    }

    // No collision, allow the movement
    return velocity;
  }
}