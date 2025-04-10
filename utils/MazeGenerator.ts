// utils/MazeGenerator.ts
import { GameConfig } from "../config/GameConfig.ts";
import { FaceName } from "./FaceUtils.ts";

export class MazeGenerator {
  private mazes: Record<FaceName, number[][]>;
  private THREE: any;
  private cubeContainer: any;

  constructor(THREE: any, cubeContainer: any) {
    this.THREE = THREE;
    this.cubeContainer = cubeContainer;
    const mazeSize = GameConfig.mazeSize;
    this.mazes = {
      top: [],
      bottom: [],
      left: [],
      right: [],
      front: [],
      back: [],
    };

    this.generateMazes();
    this.renderMazes();
  }

  private generateMazes() {
    const mazeSize = GameConfig.mazeSize;
    const faces: FaceName[] = ["top", "bottom", "left", "right", "front", "back"];

    const createMazeWithWalls = (): number[][] => {
      const grid: number[][] = Array(mazeSize)
        .fill(0)
        .map(() => Array(mazeSize).fill(1));

      const carvePath = (x: number, y: number) => {
        grid[y][x] = 0;

        const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        for (let i = directions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const [dx, dy] of directions) {
          const newX = x + dx;
          const newY = y + dy;
          if (
            newX > 0 && newX < mazeSize - 1 &&
            newY > 0 && newY < mazeSize - 1 &&
            grid[newY][newX] === 1
          ) {
            grid[y + dy / 2][x + dx / 2] = 0;
            carvePath(newX, newY);
          }
        }
      };

      carvePath(1, 1);

      for (let y = 1; y < mazeSize - 1; y += 2) {
        for (let x = 1; x < mazeSize - 1; x += 2) {
          if (grid[y][x] === 1) {
            grid[y][x] = 0;
          }
        }
      }

      return grid;
    };

    faces.forEach((face) => {
      this.mazes[face] = createMazeWithWalls();
    });

    const center = Math.floor(mazeSize / 2);
    const width = Math.max(1, Math.floor(GameConfig.playerRadius / (GameConfig.cubeSize / mazeSize)));

    faces.forEach((face) => {
      const grid = this.mazes[face];
      for (let x = center - width; x <= center + width; x++) {
        if (x >= 0 && x < mazeSize) {
          grid[0][x] = 0;
          if (grid[1][x] === 1) grid[1][x] = 0;
        }
      }
      for (let x = center - width; x <= center + width; x++) {
        if (x >= 0 && x < mazeSize) {
          grid[mazeSize - 1][x] = 0;
          if (grid[mazeSize - 2][x] === 1) grid[mazeSize - 2][x] = 0;
        }
      }
      for (let y = center - width; y <= center + width; y++) {
        if (y >= 0 && y < mazeSize) {
          grid[y][0] = 0;
          if (grid[y][1] === 1) grid[y][1] = 0;
        }
      }
      for (let y = center - width; y <= center + width; y++) {
        if (y >= 0 && y < mazeSize) {
          grid[y][mazeSize - 1] = 0;
          if (grid[y][mazeSize - 2] === 1) grid[y][mazeSize - 2] = 0;
        }
      }
    });

  }

  private renderMazes() {
    const mazeSize = GameConfig.mazeSize;
    const cubeSize = GameConfig.cubeSize;
    const cellSize = cubeSize / mazeSize;
    const halfSize = cubeSize / 2;
    const wallHeight = cellSize;

    for (const face in this.mazes) {
      const maze = this.mazes[face as FaceName];
      maze.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === 1) {
            const wallGeometry = new this.THREE.BoxGeometry(cellSize * 1.01, wallHeight * 1.01, cellSize * 1.01);
            const wallMaterial = new this.THREE.MeshStandardMaterial({ color: 0x888888 });
            const wall = new this.THREE.Mesh(wallGeometry, wallMaterial);
            wall.castShadow = true;
            wall.receiveShadow = true;
            wall.userData = { isWall: true }; // Add a custom property to identify walls

            let position;
            switch (face) {
              case "top":
                position = new this.THREE.Vector3(
                  -halfSize + x * cellSize + cellSize / 2,
                  halfSize,
                  -halfSize + (mazeSize - 1 - y) * cellSize + cellSize / 2
                );
                break;
              case "bottom":
                position = new this.THREE.Vector3(
                  -halfSize + x * cellSize + cellSize / 2,
                  -halfSize,
                  -halfSize + y * cellSize + cellSize / 2
                );
                break;
              case "left":
                position = new this.THREE.Vector3(
                  -halfSize,
                  -halfSize + y * cellSize + cellSize / 2,
                  -halfSize + x * cellSize + cellSize / 2
                );
                break;
              case "right":
                position = new this.THREE.Vector3(
                  halfSize,
                  -halfSize + y * cellSize + cellSize / 2,
                  -halfSize + (mazeSize - 1 - x) * cellSize + cellSize / 2
                );
                break;
              case "front":
                position = new this.THREE.Vector3(
                  -halfSize + x * cellSize + cellSize / 2,
                  -halfSize + y * cellSize + cellSize / 2,
                  halfSize
                );
                break;
              case "back":
                position = new this.THREE.Vector3(
                  -halfSize + (mazeSize - 1 - x) * cellSize + cellSize / 2,
                  -halfSize + y * cellSize + cellSize / 2,
                  -halfSize
                );
                break;
            }
            wall.position.copy(position);
            this.cubeContainer.add(wall);
          }
        });
      });
    }
  }

  getMazes(): Record<FaceName, number[][]> {
    return this.mazes;
  }

  dispose() {}
}