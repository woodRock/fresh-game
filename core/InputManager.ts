// core/InputManager.ts
export class InputManager {
  keysPressed: { [key: string]: boolean };
  movement: { x: number; y: number }; // Add movement for touch controls
  jump: boolean; // Add jump for touch controls
  onJumpCallback: () => void;
  onToggleRotationCallback: () => void;

  constructor() {
    this.keysPressed = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
    };
    this.movement = { x: 0, y: 0 }; // Initialize movement
    this.jump = false; // Initialize jump

    this.onJumpCallback = () => {};
    this.onToggleRotationCallback = () => {};

    // Set up event listeners
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  handleKeyDown(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case "w":
        this.keysPressed.w = true;
        break;
      case "a":
        this.keysPressed.a = true;
        break;
      case "s":
        this.keysPressed.s = true;
        break;
      case "d":
        this.keysPressed.d = true;
        break;
      case " ":
        this.keysPressed.space = true;
        this.jump = true; // Set jump for consistency
        this.onJumpCallback();
        break;
      case "r":
        this.onToggleRotationCallback();
        break;
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case "w":
        this.keysPressed.w = false;
        break;
      case "a":
        this.keysPressed.a = false;
        break;
      case "s":
        this.keysPressed.s = false;
        break;
      case "d":
        this.keysPressed.d = false;
        break;
      case " ":
        this.keysPressed.space = false;
        this.jump = false; // Reset jump
        break;
    }
  }

  onJump(callback: () => void) {
    this.onJumpCallback = callback;
  }

  onToggleRotation(callback: () => void) {
    this.onToggleRotationCallback = callback;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
    window.removeEventListener("keyup", this.handleKeyUp.bind(this));
  }
}