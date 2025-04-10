// utils/MazeGenerator.ts
import { GameConfig } from "../config/GameConfig.ts";
import { Colors } from "../config/Colors.ts";
import { FaceName } from "../utils/FaceUtils.ts";

export class MazeGenerator {
  private THREE: any;
  private cubeContainer: any;
  private mazeSize: number;
  private cellSize: number;
  private mazes: Record<FaceName, number[][]>;
  private walls: Record<FaceName, any[]>;

  constructor(THREE: any, cubeContainer: any) {
    this.THREE = THREE;
    this.cubeContainer = cubeContainer;
    this.mazeSize = GameConfig.mazeSize;
    this.cellSize = GameConfig.cubeSize / this.mazeSize;
    this.mazes = {
      top: [],
      bottom: [],
      left: [],
      right: [],
      front: [],
      back: [],
    };
    this.walls = {
      top: [],
      bottom: [],
      left: [],
      right: [],
      front: [],
      back: [],
    };
  }

  /**
   * Generate a maze using recursive backtracking algorithm
   */
  static generateMaze(width: number, height: number): number[][] {
    // Initialize with all walls
    const maze = Array(height)
      .fill(0)
      .map(() => Array(width).fill(1));

    // Create a randomized maze using recursive backtracking
    const stack = [{ x: 1, y: 1 }];
    maze[1][1] = 0; // Start point

    const directions = [
      { dx: 0, dy: -2 }, // Up
      { dx: 2, dy: 0 }, // Right
      { dx: 0, dy: 2 }, // Down
      { dx: -2, dy: 0 }, // Left
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];

      // Fisher-Yates shuffle of directions
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }

      let moved = false;

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
          // Carve a path
          maze[ny][nx] = 0;
          maze[current.y + dir.dy / 2][current.x + dir.dx / 2] = 0;

          stack.push({ x: nx, y: ny });
          moved = true;
          break;
        }
      }

      if (!moved) {
        stack.pop();
      }
    }

    return maze;
  }

  /**
   * Create connected mazes for all cube faces with passages between faces
   */
  createConnectedMazes(): Record<FaceName, number[][]> {
    const faces: FaceName[] = ["top", "bottom", "left", "right", "front", "back"];

    // Generate a maze for each face
    for (const face of faces) {
      this.mazes[face] = MazeGenerator.generateMaze(this.mazeSize, this.mazeSize);
    }

    // Ensure connectivity between faces by carving paths at the edges
    const edgeCells = [0, this.mazeSize - 1];
    for (const cell of edgeCells) {
      // Top face connections
      this.mazes.top[cell][0] = 0; // Connect to back
      this.mazes.top[cell][this.mazeSize - 1] = 0; // Connect to front
      this.mazes.top[0][cell] = 0; // Connect to left
      this.mazes.top[this.mazeSize - 1][cell] = 0; // Connect to right

      // Bottom face connections
      this.mazes.bottom[cell][0] = 0; // Connect to back
      this.mazes.bottom[cell][this.mazeSize - 1] = 0; // Connect to front
      this.mazes.bottom[0][cell] = 0; // Connect to left
      this.mazes.bottom[this.mazeSize - 1][cell] = 0; // Connect to right

      // Left face connections
      this.mazes.left[cell][0] = 0; // Connect to back
      this.mazes.left[cell][this.mazeSize - 1] = 0; // Connect to front
      this.mazes.left[0][cell] = 0; // Connect to bottom
      this.mazes.left[this.mazeSize - 1][cell] = 0; // Connect to top

      // Right face connections
      this.mazes.right[cell][0] = 0; // Connect to front
      this.mazes.right[cell][this.mazeSize - 1] = 0; // Connect to back
      this.mazes.right[0][cell] = 0; // Connect to bottom
      this.mazes.right[this.mazeSize - 1][cell] = 0; // Connect to top

      // Front face connections
      this.mazes.front[cell][0] = 0; // Connect to left
      this.mazes.front[cell][this.mazeSize - 1] = 0; // Connect to right
      this.mazes.front[0][cell] = 0; // Connect to bottom
      this.mazes.front[this.mazeSize - 1][cell] = 0; // Connect to top

      // Back face connections
      this.mazes.back[cell][0] = 0; // Connect to right
      this.mazes.back[cell][this.mazeSize - 1] = 0; // Connect to left
      this.mazes.back[0][cell] = 0; // Connect to bottom
      this.mazes.back[this.mazeSize - 1][cell] = 0; // Connect to top
    }

    // Create wall meshes for rendering and collision
    this.createWallMeshes();

    return this.mazes;
  }

  /**
   * Create 3D wall meshes for each face based on the maze layout
   */
  private createWallMeshes() {
    const wallHeight = 1;
    const wallGeometry = new this.THREE.BoxGeometry(this.cellSize, wallHeight, this.cellSize);
    const wallMaterial = new this.THREE.MeshStandardMaterial({
      color: Colors.walls,
      roughness: 0.8,
    });

    const faces: FaceName[] = ["top", "bottom", "left", "right", "front", "back"];
    const halfSize = GameConfig.cubeSize / 2;

    for (const face of faces) {
      const maze = this.mazes[face];
      this.walls[face] = [];

      for (let y = 0; y < this.mazeSize; y++) {
        for (let x = 0; x < this.mazeSize; x++) {
          if (maze[y][x] === 1) {
            const wall = new this.THREE.Mesh(wallGeometry, wallMaterial);
            wall.castShadow = true;
            wall.receiveShadow = true;

            // Position the wall on the correct face
            const offset = -halfSize + this.cellSize / 2;
            switch (face) {
              case "top":
                wall.position.set(
                  offset + x * this.cellSize,
                  halfSize + wallHeight / 2,
                  offset + (this.mazeSize - 1 - y) * this.cellSize
                );
                break;
              case "bottom":
                wall.position.set(
                  offset + x * this.cellSize,
                  -halfSize - wallHeight / 2,
                  offset + y * this.cellSize
                );
                break;
              case "left":
                wall.position.set(
                  -halfSize - wallHeight / 2,
                  offset + (this.mazeSize - 1 - y) * this.cellSize,
                  offset + x * this.cellSize
                );
                break;
              case "right":
                wall.position.set(
                  halfSize + wallHeight / 2,
                  offset + (this.mazeSize - 1 - y) * this.cellSize,
                  offset + (this.mazeSize - 1 - x) * this.cellSize
                );
                break;
              case "front":
                wall.position.set(
                  offset + x * this.cellSize,
                  offset + (this.mazeSize - 1 - y) * this.cellSize,
                  halfSize + wallHeight / 2
                );
                break;
              case "back":
                wall.position.set(
                  offset + (this.mazeSize - 1 - x) * this.cellSize,
                  offset + (this.mazeSize - 1 - y) * this.cellSize,
                  -halfSize - wallHeight / 2
                );
                break;
            }

            this.cubeContainer.add(wall);
            this.walls[face].push(wall);
          }
        }
      }
    }
  }

  /**
   * Get the generated mazes
   */
  getMazes(): Record<FaceName, number[][]> {
    return this.mazes;
  }

  /**
   * Clean up wall meshes
   */
  dispose() {
    const faces: FaceName[] = ["top", "bottom", "left", "right", "front", "back"];
    for (const face of faces) {
      for (const wall of this.walls[face]) {
        this.cubeContainer.remove(wall);
        wall.geometry.dispose();
        wall.material.dispose();
      }
    }
  }
}