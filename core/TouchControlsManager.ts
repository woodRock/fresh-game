// core/TouchControlsManager.ts
import { TouchControls } from "../controls/TouchControls.ts";
import { FaceName } from "../utils/FaceUtils.ts";

export class TouchControlsManager {
  private touchControls: TouchControls;
  private playerController: any;
  private currentFace: FaceName = "top"; // Changed to match game default
  private moveInput = { x: 0, y: 0 };
  private isMobile: boolean;
  private lastUpdateTime: number = 0;

  constructor(container: HTMLElement, playerController: any) {
    this.playerController = playerController;
    this.isMobile = TouchControls.isTouchDevice();
    
    if (this.isMobile) {
      try {
        this.touchControls = new TouchControls(container, {
          joystickSize: 150,
          joystickColor: "#ffffff",
          joystickBackgroundColor: "#000000",
          joystickAlpha: 0.5,
          joystickHandleSize: 60
        });
        
        this.setupTouchControls();
        console.log("Touch controls created successfully");
      } catch (error) {
        console.error("Error creating touch controls:", error);
        throw error; // Rethrow to catch in Game.tsx
      }
    } else {
      // Initialize touchControls as a dummy object for non-mobile to prevent null checks
      this.touchControls = {} as TouchControls;
    }
  }

  private setupTouchControls(): void {
    if (!this.touchControls) return;
    
    this.touchControls.onMove((x, y) => {
      this.moveInput.x = x;
      this.moveInput.y = y;
    });
    
    this.touchControls.onJump(() => {
      if (this.playerController && typeof this.playerController.jump === 'function') {
        try {
          this.playerController.jump();
        } catch (error) {
          console.error("Error in jump handler:", error);
        }
      }
    });
  }

  update(deltaTime: number): void {
    if (!this.isMobile || !this.touchControls || !this.playerController) return;
    
    // Apply joystick movement to player controller
    if (typeof this.playerController.move === 'function') {
      try {
        this.playerController.move(this.moveInput.x, this.moveInput.y, deltaTime);
      } catch (error) {
        console.error("Error in move handler:", error, 
          "moveInput:", this.moveInput, 
          "playerController:", this.playerController);
      }
    }
  }

  updateCurrentFace(face: FaceName): void {
    this.currentFace = face;
    if (this.isMobile && this.touchControls) {
      this.touchControls.updateCurrentFace(face);
    }
  }

  show(): void {
    if (this.isMobile && this.touchControls) {
      this.touchControls.show();
    }
  }

  hide(): void {
    if (this.isMobile && this.touchControls) {
      this.touchControls.hide();
    }
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }
}