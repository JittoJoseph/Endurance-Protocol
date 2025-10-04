import * as THREE from "three";

/**
 * SIMPLIFIED Camera & Animation System
 * Clean slate - no complex lookAt logic, just direct camera positioning
 */

// Easing function
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/**
 * Camera Presets - Simple position + distance from origin
 */
export interface CameraPreset {
  position: THREE.Vector3;
  fov?: number;
  duration: number;
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  default: {
    position: new THREE.Vector3(5, 0, 5),
    fov: 45,
    duration: 1.5,
  },
  "close-left": {
    position: new THREE.Vector3(-3.5, 2, 3),
    fov: 45,
    duration: 1.2,
  },
  "close-right": {
    position: new THREE.Vector3(3.5, 2, 3),
    fov: 45,
    duration: 1.2,
  },
  impact: {
    position: new THREE.Vector3(4, 1, 4),
    fov: 45,
    duration: 1.5,
  },
};

/**
 * Simple animation controller for camera movements
 */
export class CameraAnimator {
  private startTime: number = 0;
  private duration: number = 0;
  private startPos: THREE.Vector3 = new THREE.Vector3();
  private endPos: THREE.Vector3 = new THREE.Vector3();
  private isActive: boolean = false;
  private onComplete?: () => void;

  animate(
    camera: THREE.Camera,
    targetPos: THREE.Vector3,
    duration: number,
    onComplete?: () => void
  ) {
    this.startTime = Date.now();
    this.duration = duration * 1000;
    this.startPos.copy(camera.position);
    this.endPos.copy(targetPos);
    this.isActive = true;
    this.onComplete = onComplete;
  }

  update(camera: THREE.Camera): boolean {
    if (!this.isActive) return false;

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = easeInOutCubic(progress);

    camera.position.lerpVectors(this.startPos, this.endPos, eased);

    if (progress >= 1) {
      this.isActive = false;
      this.onComplete?.();
    }

    return this.isActive;
  }

  stop() {
    this.isActive = false;
  }

  get animating(): boolean {
    return this.isActive;
  }
}
