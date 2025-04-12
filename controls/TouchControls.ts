// controls/TouchControls.ts
import { FaceName } from "../utils/FaceUtils.ts";

interface TouchControlOptions {
  joystickSize?: number;
  joystickColor?: string;
  joystickBackgroundColor?: string;
  joystickAlpha?: number;
  joystickHandleSize?: number;
}

export class TouchControls {
  private container: HTMLElement;
  private joystickContainer: HTMLElement;
  private joystickHandle: HTMLElement;
  private jumpButton: HTMLElement | null = null;
  private joystickSize: number;
  private joystickHandleSize: number;
  private joystickColor: string;
  private joystickBackgroundColor: string;
  private joystickAlpha: number;

  private joystickActive: boolean = false;
  private joystickStartPosition = { x: 0, y: 0 };
  private joystickPosition = { x: 0, y: 0 };
  private moveDirection = { x: 0, y: 0 };
  private touchId: number | null = null;

  private onMoveCallback: ((x: number, y: number) => void) | null = null;
  private onJumpCallback: (() => void) | null = null;
  private currentFace: FaceName = "top";

  constructor(container: HTMLElement, options: TouchControlOptions = {}) {
    this.container = container;
    this.joystickSize = options.joystickSize || 150;
    this.joystickHandleSize = options.joystickHandleSize || 60;
    this.joystickColor = options.joystickColor || "#ffffff";
    this.joystickBackgroundColor = options.joystickBackgroundColor || "#000000";
    this.joystickAlpha = options.joystickAlpha !== undefined ? options.joystickAlpha : 0.5;

    this.createJoystick();
    this.createJumpButton();
    this.setupEventListeners();
  }

  private createJoystick(): void {
    this.joystickContainer = document.createElement("div");
    this.joystickContainer.style.position = "absolute";
    this.joystickContainer.style.left = "30px";
    this.joystickContainer.style.bottom = "30px";
    this.joystickContainer.style.width = `${this.joystickSize}px`;
    this.joystickContainer.style.height = `${this.joystickSize}px`;
    this.joystickContainer.style.borderRadius = "50%";
    this.joystickContainer.style.backgroundColor = `${this.joystickBackgroundColor}`;
    this.joystickContainer.style.opacity = `${this.joystickAlpha}`;
    this.joystickContainer.style.border = "2px solid rgba(255, 255, 255, 0.8)";
    this.joystickContainer.style.boxSizing = "border-box";
    this.joystickContainer.style.touchAction = "none";

    this.joystickHandle = document.createElement("div");
    this.joystickHandle.style.position = "absolute";
    this.joystickHandle.style.left = `${this.joystickSize / 2 - this.joystickHandleSize / 2}px`;
    this.joystickHandle.style.top = `${this.joystickSize / 2 - this.joystickHandleSize / 2}px`;
    this.joystickHandle.style.width = `${this.joystickHandleSize}px`;
    this.joystickHandle.style.height = `${this.joystickHandleSize}px`;
    this.joystickHandle.style.borderRadius = "50%";
    this.joystickHandle.style.backgroundColor = this.joystickColor;
    this.joystickHandle.style.opacity = `${this.joystickAlpha + 0.2}`;
    this.joystickHandle.style.boxShadow = "0 0 5px rgba(255, 255, 255, 0.8)";

    this.joystickContainer.appendChild(this.joystickHandle);
    this.container.appendChild(this.joystickContainer);
  }

  private createJumpButton(): void {
    this.jumpButton = document.createElement("div");
    this.jumpButton.style.position = "absolute";
    this.jumpButton.style.right = "30px";
    this.jumpButton.style.bottom = "30px";
    this.jumpButton.style.width = "80px";
    this.jumpButton.style.height = "80px";
    this.jumpButton.style.borderRadius = "50%";
    this.jumpButton.style.backgroundColor = "rgba(0, 120, 255, 0.6)";
    this.jumpButton.style.display = "flex";
    this.jumpButton.style.justifyContent = "center";
    this.jumpButton.style.alignItems = "center";
    this.jumpButton.style.color = "white";
    this.jumpButton.style.fontWeight = "bold";
    this.jumpButton.style.fontSize = "18px";
    this.jumpButton.style.boxShadow = "0 0 10px rgba(0, 120, 255, 0.8)";
    this.jumpButton.style.border = "2px solid rgba(255, 255, 255, 0.8)";
    this.jumpButton.style.userSelect = "none";
    this.jumpButton.style.touchAction = "none";
    this.jumpButton.textContent = "JUMP";

    this.jumpButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (this.onJumpCallback) {
        this.onJumpCallback();
      }
      this.jumpButton!.style.transform = "scale(0.9)";
      this.jumpButton!.style.backgroundColor = "rgba(0, 80, 200, 0.8)";
    });

    this.jumpButton.addEventListener("touchend", () => {
      this.jumpButton!.style.transform = "scale(1)";
      this.jumpButton!.style.backgroundColor = "rgba(0, 120, 255, 0.6)";
    });

    this.container.appendChild(this.jumpButton);
  }

  private setupEventListeners(): void {
    this.joystickContainer.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (this.joystickActive) return;

      this.joystickActive = true;
      const touch = e.touches[0];
      this.touchId = touch.identifier;

      const rect = this.joystickContainer.getBoundingClientRect();
      this.joystickStartPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      this.updateJoystickPosition(touch.clientX, touch.clientY);
    });

    document.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (!this.joystickActive) return;

        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          if (touch.identifier === this.touchId) {
            this.updateJoystickPosition(touch.clientX, touch.clientY);
            break;
          }
        }
      },
      { passive: false }
    );

    document.addEventListener("touchend", (e) => {
      if (!this.joystickActive) return;

      let touchFound = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchId) {
          touchFound = true;
          break;
        }
      }

      if (!touchFound) {
        this.resetJoystick();
      }
    });

    document.addEventListener("touchcancel", () => {
      this.resetJoystick();
    });
  }

  private updateJoystickPosition(touchX: number, touchY: number): void {
    const deltaX = touchX - this.joystickStartPosition.x;
    const deltaY = touchY - this.joystickStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const maxDistance = this.joystickSize / 2 - this.joystickHandleSize / 2;

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      this.joystickPosition = {
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance,
      };
    } else {
      this.joystickPosition = { x: deltaX, y: deltaY };
    }

    this.joystickHandle.style.left = `${
      this.joystickSize / 2 - this.joystickHandleSize / 2 + this.joystickPosition.x
    }px`;
    this.joystickHandle.style.top = `${
      this.joystickSize / 2 - this.joystickHandleSize / 2 + this.joystickPosition.y
    }px`;

    this.calculateMoveDirection();

    if (this.onMoveCallback) {
      this.onMoveCallback(this.moveDirection.x, this.moveDirection.y);
    }
  }

  private calculateMoveDirection(): void {
    const maxDistance = this.joystickSize / 2 - this.joystickHandleSize / 2;
    let normalizedX = this.joystickPosition.x / maxDistance;
    let normalizedY = this.joystickPosition.y / maxDistance;

    const deadzone = 0.1;
    if (Math.abs(normalizedX) < deadzone) normalizedX = 0;
    if (Math.abs(normalizedY) < deadzone) normalizedY = 0;

    console.log("TouchControls calculateMoveDirection:", {
      normalizedX,
      normalizedY,
      currentFace: this.currentFace,
      moveDirection: { x: this.moveDirection.x, y: this.moveDirection.y },
    });

    switch (this.currentFace) {
      case "front":
        this.moveDirection = { x: normalizedX, y: normalizedY };
        break;
      case "back":
        this.moveDirection = { x: normalizedX, y: normalizedY };
        break;
      case "left":
        this.moveDirection = { x: normalizedX, y: normalizedY };
        break;
      case "right":
        this.moveDirection = { x: normalizedX, y: normalizedY }; // Fix: Remove X inversion
        break;
      case "top":
        this.moveDirection = { x: normalizedX, y: normalizedY };
        break;
      case "bottom":
        this.moveDirection = { x: normalizedX, y: normalizedY };
        break;
      default:
        this.moveDirection = { x: normalizedX, y: normalizedY };
    }
  }

  private resetJoystick(): void {
    this.joystickActive = false;
    this.touchId = null;
    this.joystickPosition = { x: 0, y: 0 };
    this.moveDirection = { x: 0, y: 0 };

    this.joystickHandle.style.left = `${this.joystickSize / 2 - this.joystickHandleSize / 2}px`;
    this.joystickHandle.style.top = `${this.joystickSize / 2 - this.joystickHandleSize / 2}px`;

    if (this.onMoveCallback) {
      this.onMoveCallback(0, 0);
    }
  }

  onMove(callback: (x: number, y: number) => void): void {
    this.onMoveCallback = callback;
  }

  onJump(callback: () => void): void {
    this.onJumpCallback = callback;
  }

  updateCurrentFace(face: FaceName): void {
    this.currentFace = face;
    if (this.joystickActive) {
      this.calculateMoveDirection();
    }
  }

  show(): void {
    this.joystickContainer.style.display = "block";
    if (this.jumpButton) {
      this.jumpButton.style.display = "flex";
    }
  }

  hide(): void {
    this.joystickContainer.style.display = "none";
    if (this.jumpButton) {
      this.jumpButton.style.display = "none";
    }
  }

  dispose(): void {
    if (this.joystickContainer && this.joystickContainer.parentNode) {
      this.joystickContainer.parentNode.removeChild(this.joystickContainer);
    }
    if (this.jumpButton && this.jumpButton.parentNode) {
      this.jumpButton.parentNode.removeChild(this.jumpButton);
    }
    this.onMoveCallback = null;
    this.onJumpCallback = null;
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
    document.removeEventListener("touchcancel", this.handleTouchCancel);
  }

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.joystickActive) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === this.touchId) {
        this.updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.joystickActive) return;

    let touchFound = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        touchFound = true;
        break;
      }
    }

    if (!touchFound) {
      this.resetJoystick();
    }
  };

  private handleTouchCancel = () => {
    this.resetJoystick();
  };

  static isTouchDevice(): boolean {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  }
}