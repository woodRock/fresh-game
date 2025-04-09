// islands/Game.tsx
import { useEffect, useRef, useState } from "preact/hooks";

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const faceIndicatorRef = useRef<HTMLSpanElement>(null);
  const visitCounterRef = useRef<HTMLSpanElement>(null);
  const [rotationEnabled, setRotationEnabled] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Dynamically import Three.js
    Promise.all([
      import("https://cdn.skypack.dev/three@0.132.2"),
      import("https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js")
    ]).then(([THREE, { OrbitControls }]) => {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);

      // Constants
      const cubeSize = 50; // Large cube
      const halfSize = cubeSize / 2;
      const mazeSize = 30; // 10x10 grid per face
      const cellSize = cubeSize / mazeSize;
      const wallHeight = 1.2; // Wall height
      
      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 5, 25);
      camera.lookAt(0, 0, 0);
      
      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      mountRef.current.appendChild(renderer.domElement);

      // Handle window resize
      window.addEventListener("resize", () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });

      // Face tracking
      let visitedFaces = {
        top: false,
        bottom: false,
        left: false,
        right: false,
        front: false,
        back: false
      };
      let faceVisitCount = 0;

      // Generate maze patterns for each face
      const generateMaze = (width, height) => {
        // Initialize with all walls
        const maze = Array(height).fill(0).map(() => Array(width).fill(1));
        
        // Create a randomized maze using recursive backtracking
        const stack = [{x: 1, y: 1}];
        maze[1][1] = 0; // Start point
        
        const directions = [
          {dx: 0, dy: -2}, // Up
          {dx: 2, dy: 0},  // Right
          {dx: 0, dy: 2},  // Down
          {dx: -2, dy: 0}  // Left
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
              maze[current.y + dir.dy/2][current.x + dir.dx/2] = 0;
              
              stack.push({x: nx, y: ny});
              moved = true;
              break;
            }
          }
          
          if (!moved) {
            stack.pop();
          }
        }
        
        return maze;
      };
      
      // Get adjacency information for faces
      const getAdjacentFaces = (face) => {
        const adjacency = {
          top: {
            top: { face: "back", edge: "top" },
            right: { face: "right", edge: "top" },
            bottom: { face: "front", edge: "top" },
            left: { face: "left", edge: "top" }
          },
          bottom: {
            top: { face: "front", edge: "bottom" },
            right: { face: "right", edge: "bottom" },
            bottom: { face: "back", edge: "bottom" },
            left: { face: "left", edge: "bottom" }
          },
          left: {
            top: { face: "top", edge: "left" },
            right: { face: "front", edge: "left" },
            bottom: { face: "bottom", edge: "left" },
            left: { face: "back", edge: "right" }
          },
          right: {
            top: { face: "top", edge: "right" },
            right: { face: "back", edge: "left" },
            bottom: { face: "bottom", edge: "right" },
            left: { face: "front", edge: "right" }
          },
          front: {
            top: { face: "top", edge: "bottom" },
            right: { face: "right", edge: "left" },
            bottom: { face: "bottom", edge: "top" },
            left: { face: "left", edge: "right" }
          },
          back: {
            top: { face: "top", edge: "top" },
            right: { face: "left", edge: "left" },
            bottom: { face: "bottom", edge: "bottom" },
            left: { face: "right", edge: "right" }
          }
        };
        
        return adjacency[face];
      };

      // Create mazes with open paths at edges
      const createConnectedMazes = () => {
        // First, generate basic mazes for each face
        const mazes = {
          top: generateMaze(mazeSize, mazeSize),
          bottom: generateMaze(mazeSize, mazeSize),
          left: generateMaze(mazeSize, mazeSize),
          right: generateMaze(mazeSize, mazeSize),
          front: generateMaze(mazeSize, mazeSize),
          back: generateMaze(mazeSize, mazeSize)
        };
        
        // Create openings at the edges to connect the mazes
        const faces = ["top", "bottom", "left", "right", "front", "back"];
        
        faces.forEach(faceName => {
          const adjacentFaces = getAdjacentFaces(faceName);
          
          // Create 1-2 openings on each edge
          const edges = ["top", "right", "bottom", "left"];
          
          edges.forEach(edge => {
            // Number of openings on this edge
            const numOpenings = 1 + Math.floor(Math.random() * 2);
            
            // Create openings
            for (let i = 0; i < numOpenings; i++) {
              // Calculate position along edge (excluding corners)
              let x, y;
              const position = 1 + Math.floor(Math.random() * (mazeSize - 3));
              
              switch(edge) {
                case "top":
                  x = position;
                  y = 0;
                  break;
                case "right":
                  x = mazeSize - 1;
                  y = position;
                  break;
                case "bottom":
                  x = position;
                  y = mazeSize - 1;
                  break;
                case "left":
                  x = 0;
                  y = position;
                  break;
              }
              
              // Create opening at edge
              mazes[faceName][y][x] = 0;
              
              // Clear path to the opening
              if (y === 0) mazes[faceName][y+1][x] = 0;
              if (y === mazeSize-1) mazes[faceName][y-1][x] = 0;
              if (x === 0) mazes[faceName][y][x+1] = 0;
              if (x === mazeSize-1) mazes[faceName][y][x-1] = 0;
              
              // Get adjacent face and edge
              const adjacentInfo = adjacentFaces[edge];
              const adjacentFace = adjacentInfo.face;
              const adjacentEdge = adjacentInfo.edge;
              
              // Calculate corresponding position on adjacent face
              let adjX, adjY;
              
              switch(adjacentEdge) {
                case "top":
                  adjX = edge === "bottom" ? mazeSize - 1 - x : x;
                  adjY = 0;
                  break;
                case "right":
                  adjX = mazeSize - 1;
                  adjY = edge === "right" ? mazeSize - 1 - y : y;
                  break;
                case "bottom":
                  adjX = edge === "top" ? mazeSize - 1 - x : x;
                  adjY = mazeSize - 1;
                  break;
                case "left":
                  adjX = 0;
                  adjY = edge === "left" ? mazeSize - 1 - y : y;
                  break;
              }
              
              // Create opening on adjacent face
              mazes[adjacentFace][adjY][adjX] = 0;
              
              // Clear path from the opening
              if (adjY === 0) mazes[adjacentFace][adjY+1][adjX] = 0;
              if (adjY === mazeSize-1) mazes[adjacentFace][adjY-1][adjX] = 0;
              if (adjX === 0) mazes[adjacentFace][adjY][adjX+1] = 0;
              if (adjX === mazeSize-1) mazes[adjacentFace][adjY][adjX-1] = 0;
            }
          });
        });
        
        return mazes;
      };
      
      // Create mazes with connected edges
      const mazes = createConnectedMazes();
      
      // Create cube with face materials
      const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      
      // Face materials with distinct colors
      const faceMaterials = [
        new THREE.MeshStandardMaterial({ color: 0xbde0fe, roughness: 0.8 }), // right - light blue
        new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.8 }), // left - yellow
        new THREE.MeshStandardMaterial({ color: 0x8eecf5, roughness: 0.8 }), // top - sky blue
        new THREE.MeshStandardMaterial({ color: 0xa2d2ff, roughness: 0.8 }), // bottom - light purple
        new THREE.MeshStandardMaterial({ color: 0xcdb4db, roughness: 0.8 }), // front - lavender
        new THREE.MeshStandardMaterial({ color: 0xffafcc, roughness: 0.8 })  // back - pink
      ];
      
      const cube = new THREE.Mesh(cubeGeometry, faceMaterials);
      cube.receiveShadow = true;
      
      // Create a container for the cube and walls
      // This allows us to rotate the view without affecting physics
      const cubeContainer = new THREE.Object3D();
      cubeContainer.add(cube);
      scene.add(cubeContainer);
      
      // Wall material
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x2b2d42,
        roughness: 0.9,
        metalness: 0.1
      });
      
      // Simple and reliable wall creation - one wall per cell
      const buildMazeWalls = (maze, faceNormal, faceName) => {
        const wallsGroup = new THREE.Group();
        wallsGroup.name = `${faceName}MazeWalls`;
        
        const rows = maze.length;
        const cols = maze[0].length;
        
        // Calculate offset to center the maze on the face
        const offset = -halfSize + cellSize/2;
        
        // Create walls for cells marked as walls (1)
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (maze[y][x] === 1) {
              // Calculate position based on grid coordinates
              let posX, posY, posZ;
              
              // Base position calculation for this cell
              const gridX = offset + x * cellSize;
              const gridY = offset + (rows - 1 - y) * cellSize; // Invert Y to match maze orientation
              
              // Position based on which face we're on
              switch (faceName) {
                case "top":
                  posX = gridX;
                  posY = halfSize; // Place on top face
                  posZ = gridY;
                  break;
                case "bottom":
                  posX = gridX;
                  posY = -halfSize; // Place on bottom face
                  posZ = -gridY; // Invert Z for proper orientation
                  break;
                case "left":
                  posX = -halfSize; // Place on left face
                  posY = gridY;
                  posZ = gridX;
                  break;
                case "right":
                  posX = halfSize; // Place on right face
                  posY = gridY;
                  posZ = -gridX; // Invert Z for proper orientation
                  break;
                case "front":
                  posX = gridX;
                  posY = gridY;
                  posZ = halfSize; // Place on front face
                  break;
                case "back":
                  posX = -gridX; // Invert X for proper orientation
                  posY = gridY;
                  posZ = -halfSize; // Place on back face
                  break;
              }
              
              // Create wall geometry - slightly smaller than cell for visual separation
              const wallSize = cellSize * 0.9; 
              const wallGeometry = new THREE.BoxGeometry(wallSize, wallHeight, wallSize);
              
              // Create wall mesh
              const wall = new THREE.Mesh(wallGeometry, wallMaterial);
              
              // Position wall
              wall.position.set(posX, posY, posZ);
              
              // Adjust Y position based on face (walls should stick out from the face)
              switch (faceName) {
                case "top":
                  wall.position.y += wallHeight/2;
                  break;
                case "bottom":
                  wall.position.y -= wallHeight/2;
                  break;
                case "left":
                  wall.position.x -= wallHeight/2;
                  break;
                case "right":
                  wall.position.x += wallHeight/2;
                  break;
                case "front":
                  wall.position.z += wallHeight/2;
                  break;
                case "back":
                  wall.position.z -= wallHeight/2;
                  break;
              }
              
              wall.castShadow = true;
              wall.receiveShadow = true;
              wallsGroup.add(wall);
            }
          }
        }
        
        cube.add(wallsGroup);
        return wallsGroup;
      };
      
      // Build walls for all faces
      const wallGroups = {
        top: buildMazeWalls(mazes.top, new THREE.Vector3(0, 1, 0), "top"),
        bottom: buildMazeWalls(mazes.bottom, new THREE.Vector3(0, -1, 0), "bottom"),
        left: buildMazeWalls(mazes.left, new THREE.Vector3(-1, 0, 0), "left"),
        right: buildMazeWalls(mazes.right, new THREE.Vector3(1, 0, 0), "right"),
        front: buildMazeWalls(mazes.front, new THREE.Vector3(0, 0, 1), "front"),
        back: buildMazeWalls(mazes.back, new THREE.Vector3(0, 0, -1), "back")
      };
      
      // Create player (ball)
      const playerRadius = 0.3;
      const playerGeometry = new THREE.SphereGeometry(playerRadius, 32, 32);
      const playerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6b6b,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0xff0000,
        emissiveIntensity: 0.2
      });
      const player = new THREE.Mesh(playerGeometry, playerMaterial);
      
      // Find a valid position (not inside a wall) for the player
      const findValidStartPosition = (maze, face) => {
        const rows = maze.length;
        const cols = maze[0].length;
        
        // Try to find a clear path cell (preferably near the center)
        // Start from center and spiral outward
        const centerX = Math.floor(cols / 2);
        const centerY = Math.floor(rows / 2);
        
        // Define spiral pattern
        const spiralSearch = [];
        const maxRadius = Math.max(centerX, centerY);
        
        // Generate spiral search pattern
        for (let radius = 0; radius <= maxRadius; radius++) {
          for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
              // Only consider points on the perimeter of the current radius
              if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < cols && y >= 0 && y < rows) {
                  spiralSearch.push({x, y});
                }
              }
            }
          }
        }
        
        // Search for a valid position
        for (const pos of spiralSearch) {
          if (maze[pos.y][pos.x] === 0) {
            // Check surrounding cells to make sure there's space
            let isValid = true;
            // Check if there's at least one adjacent path cell for movement
            let hasPath = false;
            
            const directions = [
              { dx: 0, dy: -1 }, // up
              { dx: 1, dy: 0 },  // right
              { dx: 0, dy: 1 },  // down
              { dx: -1, dy: 0 }  // left
            ];
            
            for (const dir of directions) {
              const nx = pos.x + dir.dx;
              const ny = pos.y + dir.dy;
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                if (maze[ny][nx] === 0) {
                  hasPath = true;
                }
              }
            }
            
            if (isValid && hasPath) {
              // Calculate position
              const offsetX = -halfSize + cellSize/2;
              const offsetY = halfSize - cellSize/2;
              const posX = offsetX + pos.x * cellSize;
              const posY = offsetY - pos.y * cellSize;
              
              switch (face) {
                case "top":
                  return new THREE.Vector3(posX, halfSize + playerRadius + 0.1, posY);
                case "bottom":
                  return new THREE.Vector3(posX, -halfSize - playerRadius - 0.1, -posY);
                case "left":
                  return new THREE.Vector3(-halfSize - playerRadius - 0.1, posY, posX);
                case "right":
                  return new THREE.Vector3(halfSize + playerRadius + 0.1, posY, -posX);
                case "front":
                  return new THREE.Vector3(posX, posY, halfSize + playerRadius + 0.1);
                case "back":
                  return new THREE.Vector3(-posX, posY, -halfSize - playerRadius - 0.1);
              }
            }
          }
        }
        
        // Fallback position if no valid position found
        return new THREE.Vector3(0, halfSize + playerRadius + 0.1, 0);
      };
      
      // Set player starting position
      const startPosition = findValidStartPosition(mazes.top, "top");
      player.position.copy(startPosition);
      player.castShadow = true;
      scene.add(player);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);
      
      // Player physics properties
      const playerVelocity = new THREE.Vector3(0, 0, 0);
      const moveVelocity = new THREE.Vector3(0, 0, 0); // Separate movement velocity for smoothing
      const playerSpeed = 0.15;
      const acceleration = 0.05; // Acceleration factor for smooth movement
      const deceleration = 0.85; // Deceleration factor (friction)
      const jumpForce = 0.2;
      const gravityVector = new THREE.Vector3(0, -0.01, 0);
      
      // Game state
      let isGameRunning = true;
      let isMouseDown = false;
      let previousMousePosition = { x: 0, y: 0 };
      let keysPressed = { w: false, a: false, s: false, d: false, space: false };
      let currentFace = "top";
      let lastFace = "top";
      let isOnGround = true;
      let isJumping = false;
      let canJump = true;
      
      // Mark the first face as visited
      visitedFaces[currentFace] = true;
      faceVisitCount = 1;
      
      // Update UI with initial face and count
      if (faceIndicatorRef.current) {
        faceIndicatorRef.current.textContent = currentFace;
      }
      if (visitCounterRef.current) {
        visitCounterRef.current.textContent = faceVisitCount.toString();
      }
      
      // Camera state
      let cameraUp = new THREE.Vector3(0, 1, 0);
      let cameraOffset = new THREE.Vector3(0, 3, 7);
      let cameraTransitioning = false;
      let transitionStartTime = 0;
      let transitionDuration = 800; // ms
      
      // OrbitControls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 15;
      controls.maxDistance = 30;
      controls.enabled = rotationEnabled;
      
      // Toggle rotation controls
      const toggleRotation = () => {
        setRotationEnabled(!rotationEnabled);
        controls.enabled = !rotationEnabled;
      };

      // Cube rotation controls
      window.addEventListener("mousedown", () => {
        isMouseDown = true;
      });

      window.addEventListener("mouseup", () => {
        isMouseDown = false;
      });

      // Player controls - keydown
      window.addEventListener("keydown", (event) => {
        switch (event.key.toLowerCase()) {
          case "w":
            keysPressed.w = true;
            break;
          case "a":
            keysPressed.a = true;
            break;
          case "s":
            keysPressed.s = true;
            break;
          case "d":
            keysPressed.d = true;
            break;
          case " ":
            keysPressed.space = true;
            if (canJump && isOnGround) {
              // Jump in direction opposite to gravity
              const jumpDirection = gravityVector.clone().normalize().multiplyScalar(-1);
              playerVelocity.x += jumpDirection.x * jumpForce * 10;
              playerVelocity.y += jumpDirection.y * jumpForce * 10;
              playerVelocity.z += jumpDirection.z * jumpForce * 10;
              
              isJumping = true;
              canJump = false;
              isOnGround = false;
              setTimeout(() => { canJump = true; }, 500);
            }
            break;
          case "r": // Toggle rotation with R key
            toggleRotation();
            break;
        }
      });

      // Player controls - keyup
      window.addEventListener("keyup", (event) => {
        switch (event.key.toLowerCase()) {
          case "w": keysPressed.w = false; break;
          case "a": keysPressed.a = false; break;
          case "s": keysPressed.s = false; break;
          case "d": keysPressed.d = false; break;
          case " ": keysPressed.space = false; break;
        }
      });

      // Get local axes for the current face
      const getFaceAxes = (face) => {
        let forwardVec = new THREE.Vector3();
        let rightVec = new THREE.Vector3();
        let upVec = new THREE.Vector3();
        
        switch (face) {
          case "top":
            forwardVec.set(0, 0, -1);  // Forward is -Z
            rightVec.set(1, 0, 0);     // Right is +X
            upVec.set(0, 1, 0);        // Up is +Y
            break;
          case "bottom":
            forwardVec.set(0, 0, 1);   // Forward is +Z
            rightVec.set(1, 0, 0);     // Right is +X
            upVec.set(0, -1, 0);       // Up is -Y
            break;
          case "left":
            forwardVec.set(0, 0, -1);  // Forward is -Z
            rightVec.set(0, 1, 0);     // Right is +Y
            upVec.set(-1, 0, 0);       // Up is -X
            break;
          case "right":
            forwardVec.set(0, 0, -1);  // Forward is -Z
            rightVec.set(0, -1, 0);    // Right is -Y
            upVec.set(1, 0, 0);        // Up is +X
            break;
          case "front":
            forwardVec.set(0, 1, 0);   // Forward is +Y
            rightVec.set(1, 0, 0);     // Right is +X
            upVec.set(0, 0, 1);        // Up is +Z
            break;
          case "back":
            forwardVec.set(0, -1, 0);  // Forward is -Y
            rightVec.set(1, 0, 0);     // Right is +X
            upVec.set(0, 0, -1);       // Up is -Z
            break;
        }
        
        return { forward: forwardVec, right: rightVec, up: upVec };
      };

      // Update camera for a given face
      const updateCameraForFace = (face) => {
        // Get the face axes
        const { forward, right, up } = getFaceAxes(face);
        
        // Transform to world space
        cubeContainer.updateMatrixWorld();
        const worldUp = up.clone().transformDirection(cubeContainer.matrixWorld).normalize();
        const worldForward = forward.clone().transformDirection(cubeContainer.matrixWorld).normalize();
        
        // Calculate camera offset - position camera behind and above player
        cameraUp = worldUp.clone();
        cameraOffset = worldForward.clone().multiplyScalar(-7).add(worldUp.clone().multiplyScalar(3));
        
        // Start camera transition
        cameraTransitioning = true;
        transitionStartTime = Date.now();
      };

      // Detect which face the player is on
      const detectCurrentFace = () => {
        // Get player's position in cube's local space
        cubeContainer.updateMatrixWorld();
        const cubeInverseMatrix = cubeContainer.matrixWorld.clone().invert();
        const playerLocalPos = player.position.clone().applyMatrix4(cubeInverseMatrix);
        
        // Find which face is closest
        const distToFaces = [
          { face: "right", dist: Math.abs(halfSize - playerLocalPos.x) },
          { face: "left", dist: Math.abs(halfSize + playerLocalPos.x) },
          { face: "top", dist: Math.abs(halfSize - playerLocalPos.y) },
          { face: "bottom", dist: Math.abs(halfSize + playerLocalPos.y) },
          { face: "front", dist: Math.abs(halfSize - playerLocalPos.z) },
          { face: "back", dist: Math.abs(halfSize + playerLocalPos.z) }
        ];
        
        // Sort by distance (closest first)
        distToFaces.sort((a, b) => a.dist - b.dist);
        
        // Check if player is close to the closest face
        if (distToFaces[0].dist < 0.1 + playerRadius) {
          return distToFaces[0].face;
        }
        
        // If not close to any face, keep current face
        return currentFace;
      };
      
      // Constrain player to current face
      const constrainToFace = () => {
        // Get player's position in cube's local space
        cubeContainer.updateMatrixWorld();
        const cubeInverseMatrix = cubeContainer.matrixWorld.clone().invert();
        const playerLocalPos = player.position.clone().applyMatrix4(cubeInverseMatrix);
        
        // Constrain based on current face
        switch (currentFace) {
          case "top":
            playerLocalPos.y = halfSize + playerRadius + 0.01;
            break;
          case "bottom":
            playerLocalPos.y = -halfSize - playerRadius - 0.01;
            break;
          case "left":
            playerLocalPos.x = -halfSize - playerRadius - 0.01;
            break;
          case "right":
            playerLocalPos.x = halfSize + playerRadius + 0.01;
            break;
          case "front":
            playerLocalPos.z = halfSize + playerRadius + 0.01;
            break;
          case "back":
            playerLocalPos.z = -halfSize - playerRadius - 0.01;
            break;
        }
        // Don't constrain at edges - allow transition to next face
        // but still constrain within the edges of the cube
        const buffer = 0.1; // Allow slight movement past the edge for transitions
        
        switch (currentFace) {
          case "top":
          case "bottom":
            playerLocalPos.x = Math.max(-halfSize - buffer, Math.min(halfSize + buffer, playerLocalPos.x));
            playerLocalPos.z = Math.max(-halfSize - buffer, Math.min(halfSize + buffer, playerLocalPos.z));
            break;
          case "left":
          case "right":
            playerLocalPos.y = Math.max(-halfSize - buffer, Math.min(halfSize + buffer, playerLocalPos.y));
            playerLocalPos.z = Math.max(-halfSize - buffer, Math.min(halfSize + buffer, playerLocalPos.z));
            break;
          case "front":
          case "back":
            playerLocalPos.x = Math.max(-halfSize - buffer, Math.min(halfSize + buffer, playerLocalPos.x));
            playerLocalPos.y = Math.max(-halfSize - buffer, Math.min(halfSize + buffer, playerLocalPos.y));
            break;
        }
        
        // Transform back to world space
        const worldPos = new THREE.Vector3().copy(playerLocalPos);
        worldPos.applyMatrix4(cubeContainer.matrixWorld);
        player.position.copy(worldPos);
      };

      // Check for transitions to new faces
      const checkFaceTransition = () => {
        // Detect which face the player is on
        const detectedFace = detectCurrentFace();
        
        // If face changed, update everything
        if (detectedFace !== currentFace) {
          // Track face change
          lastFace = currentFace;
          currentFace = detectedFace;
          
          // Check if this is a new face visit
          if (!visitedFaces[currentFace]) {
            visitedFaces[currentFace] = true;
            faceVisitCount++;
            
            // Update visit counter in UI
            if (visitCounterRef.current) {
              visitCounterRef.current.textContent = faceVisitCount.toString();
            }
            
            // If all faces visited, celebrate!
            if (faceVisitCount === 6) {
              alert("Congratulations! You've visited all 6 faces of the cube!");
            }
          }
          
          // Update face indicator in UI
          if (faceIndicatorRef.current) {
            faceIndicatorRef.current.textContent = currentFace;
          }
          
          // Update gravity for new face
          const { up } = getFaceAxes(currentFace);
          const worldUp = up.clone().transformDirection(cubeContainer.matrixWorld).normalize();
          gravityVector.copy(worldUp).multiplyScalar(-0.01);
          
          // Update camera
          updateCameraForFace(currentFace);
          
          return true;
        }
        
        return false;
      };
      
      // Check for collision with maze walls
      const checkMazeCollision = (newPosition) => {
        // Get player's position in cube's local space
        cubeContainer.updateMatrixWorld();
        const cubeInverseMatrix = cubeContainer.matrixWorld.clone().invert();
        const playerLocalPos = newPosition.clone().applyMatrix4(cubeInverseMatrix);
        
        // Determine which face we're checking based on position
        let checkFace = currentFace;
        
        // Near an edge? Check for transition to adjacent face
        const edgeThreshold = halfSize + playerRadius * 2;
        
        if (playerLocalPos.x > edgeThreshold) {
          checkFace = "right";
        } else if (playerLocalPos.x < -edgeThreshold) {
          checkFace = "left";
        } else if (playerLocalPos.y > edgeThreshold) {
          checkFace = "top";
        } else if (playerLocalPos.y < -edgeThreshold) {
          checkFace = "bottom";
        } else if (playerLocalPos.z > edgeThreshold) {
          checkFace = "front";
        } else if (playerLocalPos.z < -edgeThreshold) {
          checkFace = "back";
        }
        
        // Get the maze for the face we're checking
        const maze = mazes[checkFace];
        if (!maze) return false;
        
        // Calculate which cell the player is in
        let cellX, cellY;
        
        // Calculate offset correctly for each face to match the maze construction
        const offset = -halfSize;
        const mazeOffset = cellSize/2;
        
        switch (checkFace) {
          case "top":
            cellX = Math.floor((playerLocalPos.x - offset - mazeOffset) / cellSize);
            cellY = mazeSize - 1 - Math.floor((playerLocalPos.z - offset - mazeOffset) / cellSize);
            break;
          case "bottom":
            cellX = Math.floor((playerLocalPos.x - offset - mazeOffset) / cellSize);
            cellY = Math.floor((-playerLocalPos.z - offset - mazeOffset) / cellSize);
            break;
          case "left":
            cellX = Math.floor((playerLocalPos.z - offset - mazeOffset) / cellSize);
            cellY = mazeSize - 1 - Math.floor((playerLocalPos.y - offset - mazeOffset) / cellSize);
            break;
          case "right":
            cellX = Math.floor((-playerLocalPos.z - offset - mazeOffset) / cellSize);
            cellY = mazeSize - 1 - Math.floor((playerLocalPos.y - offset - mazeOffset) / cellSize);
            break;
          case "front":
            cellX = Math.floor((playerLocalPos.x - offset - mazeOffset) / cellSize);
            cellY = mazeSize - 1 - Math.floor((playerLocalPos.y - offset - mazeOffset) / cellSize);
            break;
          case "back":
            cellX = Math.floor((-playerLocalPos.x - offset - mazeOffset) / cellSize);
            cellY = mazeSize - 1 - Math.floor((playerLocalPos.y - offset - mazeOffset) / cellSize);
            break;
        }
        
        // Check if position is within bounds and on a wall
        if (cellX >= 0 && cellX < mazeSize && cellY >= 0 && cellY < mazeSize) {
          return maze[cellY][cellX] === 1; // 1 = wall
        }
        
        return false;
      };

      // Animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        if (!isGameRunning) return;
        
        // Delta time for consistent movement
        const delta = clock.getDelta();
        
        // Update orbital controls
        if (controls.enabled) {
          controls.update();
        }
        
        // Get the axes for the current face
        const { forward, right, up } = getFaceAxes(currentFace);
        
        // Transform to world space
        cubeContainer.updateMatrixWorld();
        const worldForward = forward.clone().transformDirection(cubeContainer.matrixWorld).normalize();
        const worldRight = right.clone().transformDirection(cubeContainer.matrixWorld).normalize();
        
        // Calculate target velocity based on input
        const targetVelocity = new THREE.Vector3(0, 0, 0);
        
        if (keysPressed.w) targetVelocity.add(worldForward);
        if (keysPressed.s) targetVelocity.sub(worldForward);
        if (keysPressed.a) targetVelocity.sub(worldRight);
        if (keysPressed.d) targetVelocity.add(worldRight);
        
        // Normalize if moving diagonally
        if (targetVelocity.length() > 0) {
          targetVelocity.normalize().multiplyScalar(playerSpeed);
        }
        
        // Smoothly transition current velocity toward target velocity (acceleration)
        moveVelocity.x += (targetVelocity.x - moveVelocity.x) * acceleration;
        moveVelocity.y += (targetVelocity.y - moveVelocity.y) * acceleration;
        moveVelocity.z += (targetVelocity.z - moveVelocity.z) * acceleration;
        
        // Apply deceleration if no input
        if (targetVelocity.length() === 0) {
          moveVelocity.multiplyScalar(deceleration);
        }
        
        // Scale by delta time for framerate independence
        const frameVelocity = moveVelocity.clone().multiplyScalar(delta * 60);
        
        // Calculate next position
        const nextPosition = player.position.clone().add(frameVelocity);
        
        // Check for collision with maze walls
        if (!checkMazeCollision(nextPosition)) {
          // Apply movement if no collision
          player.position.copy(nextPosition);
        } else {
          // If collision, try sliding along walls by separating X, Y, and Z movement
          // X movement
          const xMovement = new THREE.Vector3(frameVelocity.x, 0, 0);
          const nextXPosition = player.position.clone().add(xMovement);
          
          if (!checkMazeCollision(nextXPosition)) {
            player.position.add(xMovement);
          } else {
            // Stop X velocity on collision
            moveVelocity.x = 0;
          }
          
          // Y movement
          const yMovement = new THREE.Vector3(0, frameVelocity.y, 0);
          const nextYPosition = player.position.clone().add(yMovement);
          
          if (!checkMazeCollision(nextYPosition)) {
            player.position.add(yMovement);
          } else {
            // Stop Y velocity on collision
            moveVelocity.y = 0;
          }
          
          // Z movement
          const zMovement = new THREE.Vector3(0, 0, frameVelocity.z);
          const nextZPosition = player.position.clone().add(zMovement);
          
          if (!checkMazeCollision(nextZPosition)) {
            player.position.add(zMovement);
          } else {
            // Stop Z velocity on collision
            moveVelocity.z = 0;
          }
        }
        
        // Apply gravity and velocity
        const scaledGravity = gravityVector.clone().multiplyScalar(delta * 60);
        playerVelocity.add(scaledGravity);
        
        // Apply physics velocity separately from movement
        const framePhysicsVelocity = playerVelocity.clone().multiplyScalar(delta * 60);
        const nextVelocityPosition = player.position.clone().add(framePhysicsVelocity);
        
        // Apply velocity if no collision
        if (!checkMazeCollision(nextVelocityPosition)) {
          player.position.add(framePhysicsVelocity);
        } else {
          // If collision, reset physics velocity
          playerVelocity.set(0, 0, 0);
          
          if (isJumping) {
            isJumping = false;
            isOnGround = true;
          }
        }
        
        // Check for face transitions
        checkFaceTransition();
        
        // Constrain player to current face
        constrainToFace();
        
        // Handle landing on surface
        const gravityDir = gravityVector.clone().normalize();
        const velocityInGravityDir = playerVelocity.dot(gravityDir);
        
        if (velocityInGravityDir > 0) {
          // Remove velocity in gravity direction
          playerVelocity.sub(gravityDir.multiplyScalar(velocityInGravityDir));
          
          // Add friction
          playerVelocity.multiplyScalar(0.9);
          
          // Reset jumping state
          isJumping = false;
          isOnGround = true;
        }
        
        // Check if player has fallen too far
        if (player.position.length() > 50) {
          // Reset to top face
          currentFace = "top";
          lastFace = "top";
          
          // Update UI
          if (faceIndicatorRef.current) {
            faceIndicatorRef.current.textContent = currentFace;
          }
          
          // Reset gravity
          gravityVector.set(0, -0.01, 0);
          
          // Find start position on top face
          const startPos = findValidStartPosition(mazes.top, "top");
          player.position.copy(startPos);
          playerVelocity.set(0, 0, 0);
          moveVelocity.set(0, 0, 0);
          
          // Reset camera
          updateCameraForFace("top");
        }
        
        // Handle camera transitions
        if (cameraTransitioning) {
          const elapsed = Date.now() - transitionStartTime;
          const progress = Math.min(1, elapsed / transitionDuration);
          
          if (progress >= 1) {
            cameraTransitioning = false;
          }
        }
        
        // Update camera position
        const targetCameraPos = new THREE.Vector3().copy(player.position).add(cameraOffset);
        camera.position.lerp(targetCameraPos, cameraTransitioning ? 0.05 : 0.1);
        camera.lookAt(player.position);
        camera.up.copy(cameraUp);
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };

      // Initialize
      updateCameraForFace("top");
      
      // Start game loop
      animate();

      // Cleanup
      return () => {
        isGameRunning = false;
        
        // Remove event listeners
        window.removeEventListener("resize", () => {});
        window.removeEventListener("keydown", () => {});
        window.removeEventListener("keyup", () => {});
        window.removeEventListener("mousedown", () => {});
        window.removeEventListener("mouseup", () => {});
        window.removeEventListener("mousemove", () => {});
        
        if (mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    });
  }, []);

  return (
    <div>
      <div ref={mountRef} style={{ width: "100%", height: "100vh" }}></div>
      <div style={{ position: "absolute", top: "20px", left: "20px", color: "white", fontFamily: "sans-serif", 
                   backgroundColor: "rgba(0,0,0,0.7)", padding: "15px", borderRadius: "5px", maxWidth: "300px" }}>
        <h1>Maze Cube Challenge</h1>
        <p>Navigate through the seamless maze across all 6 faces of the cube!</p>
        <p>Controls:</p>
        <ul>
          <li>WASD: Move the player</li>
          <li>Space: Jump (to avoid obstacles)</li>
          <li>Click and drag: Rotate the cube for a better view</li>
          <li>R: Toggle cube rotation</li>
        </ul>
        <p>Current face: <span ref={faceIndicatorRef}>top</span></p>
        <p>Faces visited: <span ref={visitCounterRef}>1</span>/6</p>
        <p><small>The maze continues across face boundaries - find paths to explore all faces!</small></p>
      </div>
    </div>
  );
}