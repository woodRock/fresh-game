// islands/Game.tsx with simplified direction handling
import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";

// Import types
import { FaceName } from "../utils/FaceUtils.ts";
import { GameConfig } from "../config/GameConfig.ts";
import Minimap from "../components/UI/Minimap.tsx";

export default function Game() {
  // Game state signals
  const currentFace = useSignal<FaceName>("top");
  const visitCount = useSignal<number>(1);
  const rotationEnabled = useSignal<boolean>(true); // Start with rotation enabled
  const status = useSignal<string>("Initializing...");
  const isGameOver = useSignal<boolean>(false);
  const playerDirection = useSignal<string>("up"); // 'up', 'down', 'left', 'right'
  
  // Track visited faces
  const visitedFaces = useSignal({
    top: true,
    bottom: false,
    left: false,
    right: false,
    front: false,
    back: false,
  });

  // DOM reference for the Three.js canvas
  const mountRef = useRef<HTMLDivElement>(null);

  // Reference to engine for cleanup
  const engineRef = useRef<any>(null);

  useEffect(() => {
    if (!IS_BROWSER || !mountRef.current) return;

    status.value = "Loading Three.js...";

    // Load Three.js dynamically
    Promise.all([
      import("https://cdn.skypack.dev/three@0.132.2"),
      import("https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js"),
    ])
      .then(async ([THREE, { OrbitControls }]) => {
        try {
          status.value = "Loading game modules...";

          // Import all our modules
          const { SceneManager } = await import("../core/SceneManager.ts");
          const { InputManager } = await import("../core/InputManager.ts");
          const { CameraManager } = await import("../core/CameraManager.ts");
          const { Engine } = await import("../core/Engine.ts");
          const { Player } = await import("../entities/Player.ts");
          const { GravitySystem } = await import("../physics/GravitySystem.ts");
          const { FaceTransitionSystem } = await import("../physics/FaceTransition.ts");
          const { CollisionSystem } = await import("../physics/Collision.ts");
          const { MazeGenerator } = await import("../utils/MazeGenerator.ts");

          status.value = "Setting up game...";

          // Initialize scene manager first
          const sceneManager = new SceneManager(mountRef.current, THREE);
          
          // Set up initial camera position far from the cube
          sceneManager.camera.position.set(0, 30, 30);
          sceneManager.camera.lookAt(0, 0, 0);

          // Generate mazes
          const mazeGenerator = new MazeGenerator(THREE, sceneManager.cubeContainer);
          const mazes = mazeGenerator.getMazes();

          // Find a valid spawn point on the top face
          const topMaze = mazes.top;
          const mazeSize = GameConfig.mazeSize;
          const cellSize = GameConfig.cubeSize / mazeSize;
          const halfSize = GameConfig.cubeSize / 2;
          let spawnPosition = null;

          // Search for the first open path (0) in the top maze
          for (let y = 0; y < mazeSize; y++) {
            for (let x = 0; x < mazeSize; x++) {
              if (topMaze[y][x] === 0) {
                // Convert maze coordinates to local cube coordinates
                const localX = -halfSize + x * cellSize + cellSize / 2;
                const localY = halfSize + GameConfig.playerRadius + 0.1;
                const localZ = -halfSize + (mazeSize - 1 - y) * cellSize + cellSize / 2;

                // Convert to world coordinates
                const localPos = new THREE.Vector3(localX, localY, localZ);
                spawnPosition = sceneManager.cubeContainer.localToWorld(localPos);
                break;
              }
            }
            if (spawnPosition) break;
          }

          if (!spawnPosition) {
            throw new Error("No valid spawn position found on the top face!");
          }

          // Initialize collision system with mazes and THREE
          const collisionSystem = new CollisionSystem(mazes, THREE);

          // Initialize input manager with direction tracking
          const inputManager = new InputManager();
          
          // Add key handler to track player direction
          const originalKeyDownHandler = inputManager.handleKeyDown.bind(inputManager);
          inputManager.handleKeyDown = function(event: KeyboardEvent) {
            // Call the original handler first
            originalKeyDownHandler(event);
            
            // Update direction based on WASD keys
            switch(event.key.toLowerCase()) {
              case 'w':
                playerDirection.value = 'up';
                break;
              case 's':
                playerDirection.value = 'down';
                break;
              case 'a':
                playerDirection.value = 'left';
                break;
              case 'd':
                playerDirection.value = 'right';
                break;
            }
          };

          // Initialize player with the spawn position
          const player = new Player(THREE, spawnPosition);
          sceneManager.scene.add(player.mesh);

          // Initialize camera manager
          const cameraManager = new CameraManager(
            sceneManager.camera,
            sceneManager.renderer,
            sceneManager.cubeContainer,
            THREE,
            OrbitControls
          );

          // Initialize physics systems
          const gravitySystem = new GravitySystem(sceneManager.cubeContainer, THREE);

          // Pass the cubeContainer and collisionSystem to the FaceTransitionSystem
          const faceTransitionSystem = new FaceTransitionSystem(THREE, sceneManager.cubeContainer, collisionSystem);

          // Initialize game engine
          const engine = new Engine({
            sceneManager,
            inputManager,
            cameraManager,
            player,
            gravitySystem,
            faceTransitionSystem,
            collisionSystem,
            THREE,
          });

          engineRef.current = engine;

          // Set up callbacks
          engine.onFaceChange((face: FaceName) => {
            currentFace.value = face;
            
            // Update the visited faces state
            visitedFaces.value = {
              ...visitedFaces.value,
              [face]: true
            };
          });

          engine.onVisitCountChange((count: number) => {
            visitCount.value = count;
            if (count === 6) {
              isGameOver.value = true;
              status.value = "Game Over - You Win!";
            }
          });

          // Set initial rotation state
          engine.setRotationEnabled(rotationEnabled.value);

          // Start the game
          engine.start();
          status.value = "Game running";

          // Cleanup function
          return () => {
            if (engineRef.current) {
              engineRef.current.dispose();
              engineRef.current = null;
            }
            mazeGenerator.dispose();
          };
        } catch (error) {
          console.error("Game initialization error:", error);
          status.value = `Error: ${error.message}`;
        }
      })
      .catch((error) => {
        console.error("Failed to load Three.js:", error);
        status.value = `Loading error: ${error.message}`;
      });
  }, []);

  // Event listener for window resize to restart game
  useEffect(() => {
    const handleRestart = () => {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current.dispose();
        engineRef.current = null;
      }
      
      isGameOver.value = false;
      currentFace.value = "top";
      visitCount.value = 1;
      playerDirection.value = "up";
      
      // Reset visited faces
      visitedFaces.value = {
        top: true,
        bottom: false,
        left: false,
        right: false,
        front: false,
        back: false,
      };
      
      status.value = "Initializing...";
      
      // Re-run the effect to restart the game
      const event = new Event("restart");
      window.dispatchEvent(event);
    };

    window.addEventListener("restart", handleRestart);
    return () => window.removeEventListener("restart", handleRestart);
  }, []);

  // Handle rotation toggle from UI
  const toggleRotation = () => {
    rotationEnabled.value = !rotationEnabled.value;
    if (engineRef.current) {
      engineRef.current.setRotationEnabled(rotationEnabled.value);
    }
  };

  // Handle restart
  const restartGame = () => {
    const event = new Event("restart");
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Game container */}
      <div ref={mountRef} style={{ width: "100%", height: "100vh", position: "relative" }} />

      {/* Game UI */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "white",
          fontFamily: "sans-serif",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "15px",
          borderRadius: "5px",
          maxWidth: "300px",
          zIndex: 100,
        }}
      >
        <h1>Maze Cube Challenge</h1>
        <p>Status: {status.value}</p>
        <p>Current face: {currentFace.value}</p>
        <p>Faces visited: {visitCount.value}/6</p>
        <p>Controls:</p>
        <ul>
          <li>WASD: Move the player</li>
          <li>Space: Jump (to avoid obstacles)</li>
          <li>Click and drag: Rotate the cube for a better view</li>
          <li>R: Toggle rotation</li>
        </ul>
        <button
          onClick={toggleRotation}
          style={{
            padding: "8px 16px",
            background: rotationEnabled.value ? "#ff6b6b" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          {rotationEnabled.value ? "Disable" : "Enable"} Rotation
        </button>
      </div>

      {/* Simplified Minimap UI */}
      <Minimap 
        currentFace={currentFace.value} 
        visitedFaces={visitedFaces.value}
        playerDirection={playerDirection.value}
      />

      {/* Game Over Overlay */}
      {isGameOver.value && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "sans-serif",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <h1>Congratulations!</h1>
          <p>You've visited all 6 faces of the cube!</p>
          <button
            onClick={restartGame}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              backgroundColor: "#ff6b6b",
              border: "none",
              borderRadius: "5px",
              color: "white",
              cursor: "pointer",
            }}
          >
            Restart Game
          </button>
        </div>
      )}
    </>
  );
}