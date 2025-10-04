import * as THREE from 'three';

const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export enum CameraScene {
  DEFAULT = 'default',
  ASTEROID_DETAIL = 'asteroid',
  WATCHING = 'watching',
  IMPACT_VIEW = 'impact',
}

export interface CameraPosition {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
  duration: number;
}

export const CAMERA_SCENES: Record<CameraScene, CameraPosition> = {
  [CameraScene.DEFAULT]: {
    position: new THREE.Vector3(8, 2, 8),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 45,
    duration: 1.2,
  },
  [CameraScene.ASTEROID_DETAIL]: {
    position: new THREE.Vector3(-25, 5, -5), // Much further back, slight angle
    lookAt: new THREE.Vector3(-8, 2, 0), // Look at asteroid position
    fov: 60,
    duration: 1.5,
  },
  [CameraScene.WATCHING]: {
    position: new THREE.Vector3(-8, 6, 8), // Side angle to watch journey
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 50,
    duration: 1.2,
  },
  [CameraScene.IMPACT_VIEW]: {
    position: new THREE.Vector3(6, 4, 6),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 45,
    duration: 1.0,
  },
};

export class SceneCameraController {
  private camera: THREE.PerspectiveCamera;
  private isAnimating: boolean = false;
  private animStartTime: number = 0;
  private animDuration: number = 0;
  private startPos: THREE.Vector3 = new THREE.Vector3();
  private endPos: THREE.Vector3 = new THREE.Vector3();
  private startFov: number = 45;
  private endFov: number = 45;
  private onComplete?: () => void;
  private isDragging: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }
  
  transitionToScene(scene: CameraScene, onComplete?: () => void) {
    const targetScene = CAMERA_SCENES[scene];
    this.startPos.copy(this.camera.position);
    this.endPos.copy(targetScene.position);
    this.startFov = this.camera.fov;
    this.endFov = targetScene.fov || 45;
    this.animDuration = targetScene.duration * 1000;
    this.animStartTime = Date.now();
    this.isAnimating = true;
    this.onComplete = onComplete;
  }
  
  update(delta: number) {
    if (this.isAnimating) {
      const elapsed = Date.now() - this.animStartTime;
      const progress = Math.min(elapsed / this.animDuration, 1);
      const eased = easeInOutQuad(progress);
      
      this.camera.position.lerpVectors(this.startPos, this.endPos, eased);
      this.camera.fov = THREE.MathUtils.lerp(this.startFov, this.endFov, eased);
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(0, 0, 0);
      
      if (progress >= 1) {
        this.isAnimating = false;
        if (this.onComplete) {
          this.onComplete();
          this.onComplete = undefined;
        }
      }
    } else {
      this.camera.lookAt(0, 0, 0);
    }
  }
  
  startDrag(clientX: number) {
    this.isDragging = true;
  }
  
  updateDrag(clientX: number) {
  }
  
  endDrag() {
    this.isDragging = false;
  }
  
  shouldPauseEarthRotation(): boolean {
    return this.isDragging;
  }
  
  get dragging(): boolean {
    return this.isDragging;
  }
}
