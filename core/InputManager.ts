export class InputManager {
  keysPressed: any;
  onJumpCallback: () => void;
  onToggleRotationCallback: () => void;
  
  constructor() {
    this.keysPressed = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false
    };
    
    this.onJumpCallback = () => {};
    this.onToggleRotationCallback = () => {};
    
    // Set up event listeners
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }
  
  handleKeyDown(event: KeyboardEvent) {
    switch(event.key.toLowerCase()) {
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
        this.onJumpCallback();
        break;
      case "r":
        this.onToggleRotationCallback();
        break;
    }
  }
  
  handleKeyUp(event: KeyboardEvent) {
    switch(event.key.toLowerCase()) {
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