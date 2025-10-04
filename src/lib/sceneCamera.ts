import * as THREE from "three";

/**
 * NEW CAMERA SYSTEM - Inspired by Turkish Space Agency website
 * Clean, cinematic camera transitions between "scenes"
 * 
 * RULES:
 * - Earth is ALWAYS at (0, 0, 0) - never moves
 * - Sun light is STATIC at position (10, 0, 0) - never moves
 * - Earth spins on Y-axis for day/night cycle (can be paused)
 * - Camera orbits around Earth, always looking at center
 * - Manual drag: pause Earth rotation, orbit camera horizontally only (locked Y-axis)
 */

// Easing function for smooth transitions
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/**
 * Camera Scenes - Like Turkish space agency
 * Each scene has a specific camera position and what's visible
 */
export enum CameraScene {
  DEFAULT = "default",           // Default view - Earth centered
  ASTEROID_DETAIL = "asteroid",  // Far back - Earth small on right, asteroid on left
  IMPACT_VIEW = "impact",        // Cinematic view to watch asteroid impact
}

export interface CameraPosition {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
  duration: number; // seconds
}

export const CAMERA_SCENES: Record<CameraScene, CameraPosition> = {
  [CameraScene.DEFAULT]: {
    position: new THREE.Vector3(8, 2, 8),  // Default orbit position
    lookAt: new THREE.Vector3(0, 0, 0),    // Always look at Earth center
    fov: 45,
    duration: 1.5,
  },
  [CameraScene.ASTEROID_DETAIL]: {
    position: new THREE.Vector3(-18, 4, 0), // Camera on LEFT, Earth appears on RIGHT
    lookAt: new THREE.Vector3(2, 0, 0),     // Look slightly right of center
    fov: 55,                                 // Wider FOV to see both
    duration: 2.0,
  },
  [CameraScene.IMPACT_VIEW]: {
    position: new THREE.Vector3(10, 5, 10), // Elevated cinematic view
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 45,
    duration: 1.8,
  },
};

/**
 * Scene Camera Controller
 * Handles all camera movements, transitions, and orbital rotation
 */
export class SceneCameraController {
  private camera: THREE.PerspectiveCamera;
  
  // Animation state
  private isAnimating: boolean = false;
  private animStartTime: number = 0;
  private animDuration: number = 0;
  private startPos: THREE.Vector3 = new THREE.Vector3();
  private endPos: THREE.Vector3 = new THREE.Vector3();
  private startLookAt: THREE.Vector3 = new THREE.Vector3();
  private endLookAt: THREE.Vector3 = new THREE.Vector3();
  private startFov: number = 45;
  private endFov: number = 45;
  private onComplete?: () => void;
  
  // Manual orbit state (dragging)
  private isDragging: boolean = false;
  private dragStartX: number = 0;         // Mouse X when drag started
  private dragStartAngle: number = 0;     // Camera angle when drag started
  private currentOrbitAngle: number = 0; // Horizontal orbit angle around Y-axis
  private orbitRadius: number = 11.3;     // Distance from Earth center
  private orbitHeight: number = 2;        // Locked Y position
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0); // Current lookAt target
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    
    // Initialize orbit angle from starting position
    const startPos = CAMERA_SCENES[CameraScene.DEFAULT].position;
    this.currentOrbitAngle = Math.atan2(startPos.x, startPos.z);
    this.orbitRadius = Math.sqrt(startPos.x * startPos.x + startPos.z * startPos.z);
    this.orbitHeight = startPos.y;
  }
  
  /**
   * Transition to a specific scene
   */
  transitionToScene(scene: CameraScene, onComplete?: () => void) {
    const targetScene = CAMERA_SCENES[scene];
    
    this.startPos.copy(this.camera.position);
    this.endPos.copy(targetScene.position);
    this.startLookAt.copy(this.currentLookAt); // Store current lookAt
    this.endLookAt.copy(targetScene.lookAt);   // Store target lookAt
    this.startFov = this.camera.fov;
    this.endFov = targetScene.fov || 45;
    this.animDuration = targetScene.duration * 1000;
    this.animStartTime = Date.now();
    this.isAnimating = true;
    this.onComplete = onComplete;
    
    // Update orbit parameters from end position
    this.orbitRadius = Math.sqrt(this.endPos.x * this.endPos.x + this.endPos.z * this.endPos.z);
    this.orbitHeight = this.endPos.y;
    this.currentOrbitAngle = Math.atan2(this.endPos.x, this.endPos.z);
  }
  
  /**
   * Update - call every frame
   */
  update(delta: number) {
    // Handle animated transitions
    if (this.isAnimating) {
      const elapsed = Date.now() - this.animStartTime;
      const progress = Math.min(elapsed / this.animDuration, 1);
      const eased = easeInOutCubic(progress);
      
      // Lerp position
      this.camera.position.lerpVectors(this.startPos, this.endPos, eased);
      
      // Lerp lookAt target smoothly
      this.currentLookAt.lerpVectors(this.startLookAt, this.endLookAt, eased);
      
      // Lerp FOV
      this.camera.fov = THREE.MathUtils.lerp(this.startFov, this.endFov, eased);
      this.camera.updateProjectionMatrix();
      
      // Look at interpolated target
      this.camera.lookAt(this.currentLookAt);
      
      if (progress >= 1) {
        this.isAnimating = false;
        this.currentLookAt.copy(this.endLookAt); // Ensure final lookAt is exact
        this.onComplete?.();
        this.onComplete = undefined;
      }
    } else if (!this.isDragging) {
      // When not animating and not dragging, ensure camera looks at target
      this.camera.lookAt(this.currentLookAt);
    }
  }
  
  /**
   * Start manual orbit drag
   */
  startDrag(clientX: number) {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartAngle = this.currentOrbitAngle;
  }
  
  /**
   * Update manual orbit drag
   */
  updateDrag(clientX: number) {
    if (!this.isDragging) return;
    
    // Calculate angle delta from mouse movement
    const deltaX = clientX - this.dragStartX;
    const angleDelta = deltaX * 0.005; // Sensitivity
    
    // Update orbit angle (negated for natural rotation)
    this.currentOrbitAngle = this.dragStartAngle - angleDelta;
    
    // Calculate new camera position maintaining current orbit radius and height
    const x = this.orbitRadius * Math.sin(this.currentOrbitAngle);
    const z = this.orbitRadius * Math.cos(this.currentOrbitAngle);
    const y = this.orbitHeight; // Maintain current height
    
    // Set position without affecting other states
    this.camera.position.set(x, y, z);
    
    // Always look at current target (smooth for asteroid view)
    this.camera.lookAt(this.currentLookAt);
  }
  
  /**
   * End manual orbit drag with smooth deceleration
   */
  endDrag() {
    this.isDragging = false;
    // Smooth stop happens naturally - no momentum needed per requirements
  }
  
  /**
   * Get current state
   */
  get animating(): boolean {
    return this.isAnimating;
  }
  
  get dragging(): boolean {
    return this.isDragging;
  }
  
  /**
   * Should Earth rotation be paused?
   * Pause when dragging OR when in asteroid detail view
   */
  shouldPauseEarthRotation(): boolean {
    return this.isDragging;
  }
  
  /**
   * Get current scene based on lookAt position
   */
  getCurrentScene(): CameraScene {
    // Check if lookAt is offset (asteroid detail view)
    if (this.currentLookAt.x > 1) {
      return CameraScene.ASTEROID_DETAIL;
    }
    return CameraScene.DEFAULT;
  }
}
