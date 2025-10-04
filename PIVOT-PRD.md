# Endurance Protocol — Pivot PRD v2.0

## Simplified 3D Earth + 2D Cute Animation Approach

---

## 🎯 **Core Vision**

A visually appealing asteroid impact simulator that combines:

- **Beautiful 3D Earth** (spinning, interactive, realistic textures)
- **Cute 2D animated impact simulation** (SVG-based, stylized, accessible)
- **Real NASA data + AI analysis** (accurate science, easy to understand)
- **Optional DART planetary defense** (replay with satellite intercept)

**Key Principle:** _Let the Earth be 3D and gorgeous. Keep everything else simple, cute, and 2D._

---

## 🎨 **Visual Style Guide**

### **3D Earth Scene**

- **Style:** Realistic, high-quality textures
- **Colors:** Natural Earth tones, deep space black, white stars
- **Lighting:** Directional sun creating day/night terminator
- **Atmosphere:** Subtle blue glow/halo around Earth
- **Camera:** Smooth orbit controls, no complex choreography

### **2D Impact Animation**

- **Style:** Cute, playful, flat design (think Kurzgesagt or Fireship.io style)
- **Colors:**
  - Asteroid: Gray/brown with cartoon texture
  - Earth: Simplified blue/green continents
  - Path: White dotted line
  - Impact: Orange/red/yellow fireball sprites
  - DART: Silver/white satellite with simple geometric shape
- **Animation:** Smooth, eased transitions (no harsh movements)
- **Typography:** Clean sans-serif, good contrast

---

## 📐 **Feature Breakdown**

### **1. 3D Earth View (Main Scene)**

#### **Visual Elements**

- ✅ Sphere with day/night texture (2048px earth-day.jpg + earth-night.jpg)
- ✅ Slightly larger sphere for atmosphere (fresnel/rim lighting)
- ✅ Starfield background (black with white dots, instanced Points)
- ✅ Directional light for sun (creates terminator line)
- ✅ Ambient + hemisphere lights for visibility
- ✅ Impact location marker (red pulsing circle when selected)

#### **Interactions**

- **Drag to rotate:** Mouse/touch drag to orbit camera around Earth
- **Click to select impact:** Raycast click on globe → lat/lon → place marker
- **Preset cities:** Buttons for quick selection (New York, London, Tokyo, Mumbai, Sydney)
- **Auto-rotation:** Slow spin when idle (pauses on user interaction)

#### **Camera Behavior**

- **Single fixed orbital setup** - no scene changes, no complex transitions
- **OrbitControls** from drei with:
  - `enableDamping={true}`
  - `dampingFactor={0.05}`
  - `minDistance={4}` (close zoom limit)
  - `maxDistance={15}` (far zoom limit)
  - `autoRotate={true}` when not dragging
  - `autoRotateSpeed={0.5}` (very slow)

#### **No 3D Asteroids**

- ❌ No 3D asteroid models
- ❌ No trajectory paths in 3D space
- ❌ No particle systems in 3D
- ✅ Earth is the only 3D object (besides stars/atmosphere)

---

### **2. Impact Simulation Panel (2D Animation)**

#### **Trigger**

- User selects asteroid (from carousel or preset)
- User selects impact location (click globe or preset city)
- User clicks **"SIMULATE IMPACT"** button
- → Premium panel slides in from right (or center overlay)

#### **Panel Design**

```
┌─────────────────────────────────────────┐
│  IMPACT SIMULATION                 [×]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [2D Animation Canvas]          │   │
│  │                                 │   │
│  │  🪨 ········→ 🌍                │   │
│  │     (animated)                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  IMPACT ANALYSIS                        │
│  ┌─────────────────────────────────┐   │
│  │ • Kinetic Energy: 10.5 MT       │   │
│  │ • Crater Diameter: 5.2 km       │   │
│  │ • Destruction Radius: ~30 km    │   │
│  │ • Estimated Casualties: 1.2M    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  GEMINI AI ANALYSIS                     │
│  ┌─────────────────────────────────┐   │
│  │ [Typewriter effect text...]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [ TRY PLANETARY DEFENSE 🛰️ ]         │
└─────────────────────────────────────────┘
```

#### **2D Animation Specification**

**Canvas/Container:**

- Width: 100% of panel (max 800px)
- Height: 300px
- Background: Dark space black with tiny white dots

**Scene Elements:**

1. **Asteroid (Left Side)**

   - Position: Start at `x: 10%, y: 50%`
   - Size: 60px × 60px (cute cartoon style)
   - Visual: SVG or sprite with slight cratered texture
   - Animation: None initially (just sitting there)

2. **Earth (Right Side)**

   - Position: Fixed at `x: 85%, y: 50%`
   - Size: 100px × 100px (simplified, recognizable)
   - Visual: SVG circle with blue + green continents (flat style)
   - Animation: Slow rotation (1 full rotation per 10s)

3. **Dotted Path**

   - Start: Asteroid position
   - End: Earth position
   - Style: White dashed line (`stroke-dasharray: 5 5`)
   - Animation: Dash offset animates to create "disappearing" effect as asteroid moves

4. **Asteroid Movement**

   - Duration: 3 seconds
   - Easing: `easeInQuad` (starts slow, speeds up)
   - Path: Straight line from asteroid to Earth
   - Rotation: Slow spin during movement

5. **Impact Effect**
   - Trigger: When asteroid reaches Earth position
   - Effect: Sequence of expanding fireball sprites
   - Sprites: 3-5 frames of explosion animation
   - Duration: 0.5s
   - Sound: Optional "boom" sound effect

**Animation Timeline:**

```
t=0s:    Asteroid at left, Earth at right, full dotted path visible
t=0-3s:  Asteroid moves right, path disappears behind it, asteroid rotates
t=3s:    Asteroid reaches Earth → impact flash
t=3-3.5s: Fireball sprite animation expands
t=3.5s:  Animation complete → show impact metrics
```

---

### **3. DART Planetary Defense Simulation**

#### **Trigger**

- After initial impact simulation completes
- User clicks **"TRY PLANETARY DEFENSE 🛰️"** button
- → Same panel, but replay animation with DART intercept

#### **DART Animation Specification**

**New Scene Elements:**

1. **DART Satellite**

   - Position: Starts from Earth
   - Size: 40px × 40px
   - Visual: Simple geometric satellite SVG (silver/white)
     - Main body: Rectangle
     - Solar panels: Two rectangles on sides
     - Thruster glow: Small yellow circle at back
   - Animation: Launches from Earth toward asteroid

2. **Modified Timeline:**

```
t=0s:     Asteroid at left, Earth at right, DART docked at Earth
t=0-1.5s: Asteroid moves halfway, DART launches from Earth
t=1.5s:   DART intercepts asteroid at midpoint
          → Small impact flash
          → Asteroid trajectory changes (deflects upward)
t=1.5-3s: Asteroid moves on new trajectory (misses Earth)
t=3s:     Asteroid passes above Earth
t=3s:     Success message appears
```

**Deflection Visualization:**

- Asteroid path changes from straight line to curved (Bezier)
- New path passes above Earth by visible margin
- Green checkmark ✓ appears when clear miss is confirmed
- Success metrics update

**Success Criteria Display:**

```
PLANETARY DEFENSE: SUCCESS ✓
• Deflection: 500 km
• Impact avoided
• Earth is safe
```

---

### **4. Asset Requirements (SVG/Sprites)**

#### **Where to Get Cute Assets**

**Option 1: Free SVG Libraries**

- [Undraw.co](https://undraw.co/) - Customizable illustrations
- [SVG Repo](https://www.svgrepo.com/) - Search "asteroid", "earth", "satellite", "explosion"
- [Flaticon](https://www.flaticon.com/) - Free with attribution
- [Font Awesome](https://fontawesome.com/) - Icon-based approach

**Option 2: Create Custom SVGs**

- Use Figma/Inkscape to draw simple shapes
- Export as SVG, inline in React components
- Keep file sizes tiny (<5kb each)

**Option 3: CSS-Only Approach**

- Asteroid: `border-radius: 50%` with `radial-gradient` texture
- Earth: `border-radius: 50%` with gradient + SVG continents overlay
- DART: Positioned `<div>` elements
- Explosion: CSS keyframe animations with multiple overlapping circles

**Recommended Assets:**

```
/public/sprites/
  asteroid.svg          (60×60, gray with craters)
  earth-simple.svg      (100×100, blue/green flat)
  dart-satellite.svg    (40×40, geometric silver)
  explosion-1.svg       (150×150, orange fireball frame 1)
  explosion-2.svg       (200×200, red/yellow frame 2)
  explosion-3.svg       (250×250, fading frame 3)
  stars-background.svg  (pattern, tiny white dots)
```

**Animation Library:**

- Use **Framer Motion** for all 2D animations (already in project)
- `motion.div` for asteroid, DART, explosion sprites
- `useAnimation()` hook for sequencing
- `variants` for reusable animation configs

---

### **5. Data Flow & State Management**

#### **State Structure**

```typescript
// src/types.ts
export interface SimulationState {
  selectedAsteroid: NeoSummary | null;
  impactLocation: { lat: number; lon: number; city?: string } | null;
  simulationPhase: "idle" | "animating" | "complete";
  impactMetrics: ImpactMetrics | null;
  geminiAnalysis: string | null;
  dartEnabled: boolean;
  dartSimulationActive: boolean;
  dartSuccess: boolean;
}
```

#### **Component Hierarchy**

```
<Home>                              (page.tsx - state container)
  <EarthScene>                      (3D canvas - Earth only)
    <Earth />
    <Stars />
    <ImpactMarker />
  </EarthScene>

  <AsteroidCarousel>                (bottom bar - selection)
    <AsteroidCard />
  </AsteroidCarousel>

  <ImpactSimulationPanel>           (side panel - when simulating)
    <Animation2D>                   (SVG animation canvas)
      <AnimatedAsteroid />
      <AnimatedEarth />
      <DottedPath />
      <ExplosionSprites />
      <DartSatellite />            (conditional - DART mode)
    </Animation2D>

    <ImpactMetrics />               (calculated values)
    <GeminiAnalysis />              (AI summary with typewriter)
    <DartButton />                  (trigger defense simulation)
  </ImpactSimulationPanel>
</Home>
```

---

### **6. Technical Implementation Details**

#### **3D Earth Scene (Simplified)**

**File:** `src/components/EarthScene.tsx`

```typescript
<Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
  <Stars radius={100} depth={50} count={5000} />

  <ambientLight intensity={0.3} />
  <hemisphereLight intensity={0.5} />
  <directionalLight position={[5, 3, 5]} intensity={1} />

  <Earth onGlobeClick={handleGlobeClick} impactMarker={impactLocation} />

  <OrbitControls
    enableDamping
    dampingFactor={0.05}
    autoRotate
    autoRotateSpeed={0.5}
    minDistance={4}
    maxDistance={15}
  />
</Canvas>
```

**Earth Component:**

```typescript
function Earth({ onGlobeClick, impactMarker }) {
  const earthRef = useRef();
  const { dayMap, nightMap, cloudsMap } = useEarthTextures();

  useFrame((_, delta) => {
    if (earthRef.current && !orbitControls.dragging) {
      earthRef.current.rotation.y += delta * 0.1; // slow auto-spin
    }
  });

  return (
    <group>
      <mesh ref={earthRef} onClick={handleClick}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          emissiveMap={nightMap}
          emissive={0xffffff}
          emissiveIntensity={0.2}
        />
      </mesh>

      {impactMarker && (
        <ImpactMarker lat={impactMarker.lat} lon={impactMarker.lon} />
      )}
    </group>
  );
}
```

#### **2D Animation Panel**

**File:** `src/components/ImpactSimulationPanel.tsx`

```typescript
import { motion, useAnimation } from "framer-motion";

function Animation2D({ asteroid, onComplete }) {
  const asteroidControls = useAnimation();
  const explosionControls = useAnimation();

  useEffect(() => {
    const runAnimation = async () => {
      // Move asteroid
      await asteroidControls.start({
        x: "75%",
        transition: { duration: 3, ease: "easeInQuad" },
      });

      // Trigger explosion
      await explosionControls.start({
        scale: [0, 1.5, 2],
        opacity: [1, 0.8, 0],
        transition: { duration: 0.5 },
      });

      onComplete();
    };

    runAnimation();
  }, []);

  return (
    <div className="relative w-full h-[300px] bg-black overflow-hidden">
      {/* Starfield background */}
      <div className="absolute inset-0 star-pattern" />

      {/* Asteroid */}
      <motion.div
        animate={asteroidControls}
        className="absolute left-[10%] top-1/2 -translate-y-1/2"
      >
        <AsteroidSprite size={60} />
      </motion.div>

      {/* Earth */}
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2">
        <EarthSprite size={100} />
      </div>

      {/* Dotted path */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.line
          x1="10%"
          y1="50%"
          x2="85%"
          y2="50%"
          stroke="white"
          strokeDasharray="5 5"
          initial={{ pathLength: 1 }}
          animate={{ pathLength: 0 }}
          transition={{ duration: 3 }}
        />
      </svg>

      {/* Explosion */}
      <motion.div
        animate={explosionControls}
        className="absolute right-[15%] top-1/2 -translate-y-1/2"
      >
        <ExplosionSprites />
      </motion.div>
    </div>
  );
}
```

#### **DART Animation Variant**

**File:** `src/components/DartAnimation2D.tsx`

```typescript
function DartAnimation2D({ asteroid, onComplete }) {
  const asteroidControls = useAnimation();
  const dartControls = useAnimation();

  useEffect(() => {
    const runAnimation = async () => {
      // Parallel: Asteroid moves, DART launches
      await Promise.all([
        asteroidControls.start({
          x: "50%",
          transition: { duration: 1.5, ease: "linear" },
        }),
        dartControls.start({
          x: "-200px",
          y: "-50px",
          transition: { duration: 1.5, ease: "easeOutQuad", delay: 0.3 },
        }),
      ]);

      // Impact flash
      // ... small explosion at intercept point

      // Asteroid deflects upward
      await asteroidControls.start({
        x: "90%",
        y: "-30%",
        transition: { duration: 1.5, ease: "linear" },
      });

      onComplete({ success: true });
    };

    runAnimation();
  }, []);

  return (
    <div className="relative w-full h-[300px] bg-black">
      {/* Similar structure but with DART satellite */}
      <motion.div animate={dartControls}>
        <DartSprite size={40} />
      </motion.div>
      {/* ... */}
    </div>
  );
}
```

---

### **7. Sprite/SVG Component Examples**

#### **Asteroid Sprite**

```typescript
function AsteroidSprite({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <defs>
        <radialGradient id="asteroidGrad">
          <stop offset="0%" stopColor="#6b6b6b" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="28" fill="url(#asteroidGrad)" />
      {/* Craters */}
      <circle cx="20" cy="15" r="5" fill="#2a2a2a" opacity="0.6" />
      <circle cx="40" cy="35" r="7" fill="#2a2a2a" opacity="0.6" />
      <circle cx="35" cy="20" r="4" fill="#2a2a2a" opacity="0.6" />
    </svg>
  );
}
```

#### **Earth Sprite (Simplified)**

```typescript
function EarthSprite({ size = 100 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    >
      {/* Ocean */}
      <circle cx="50" cy="50" r="48" fill="#4a90e2" />
      {/* Continents (simplified) */}
      <path d="M30,40 Q35,30 45,35 T55,40 Q60,35 65,40" fill="#7cb342" />
      <path d="M20,60 Q25,55 35,60 T45,65" fill="#7cb342" />
      <circle cx="70" cy="25" r="8" fill="#7cb342" />
    </motion.svg>
  );
}
```

#### **DART Sprite**

```typescript
function DartSprite({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      {/* Main body */}
      <rect x="15" y="10" width="10" height="20" fill="#c0c0c0" />
      {/* Solar panels */}
      <rect x="5" y="15" width="8" height="10" fill="#4a90e2" opacity="0.7" />
      <rect x="27" y="15" width="8" height="10" fill="#4a90e2" opacity="0.7" />
      {/* Thruster */}
      <circle cx="20" cy="30" r="3" fill="#ffd700">
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="0.3s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
```

#### **Explosion Sprites**

```typescript
function ExplosionSprites() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.5, 2],
        opacity: [1, 0.8, 0],
      }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Layer 1: Core */}
      <div className="absolute inset-0 w-32 h-32 rounded-full bg-yellow-300 blur-md" />
      {/* Layer 2: Mid */}
      <div className="absolute inset-0 w-40 h-40 rounded-full bg-orange-500 opacity-70 blur-lg" />
      {/* Layer 3: Outer */}
      <div className="absolute inset-0 w-48 h-48 rounded-full bg-red-600 opacity-50 blur-xl" />
    </motion.div>
  );
}
```

---

### **8. Panel Design Specifications**

#### **Impact Simulation Panel**

**Styling:**

```css
/* Tailwind classes */
className="
  fixed right-0 top-0 h-screen w-full md:w-[600px]
  bg-black/95 backdrop-blur-xl
  border-l border-white/20
  shadow-2xl
  overflow-y-auto
  z-50
"
```

**Sections:**

1. **Header**

   - Title: "IMPACT SIMULATION"
   - Close button (X)
   - Asteroid name subtitle

2. **Animation Canvas**

   - 300px height
   - Full width
   - Dark background with star pattern

3. **Impact Metrics Grid**

   - 2×2 grid of metric cards
   - Each card: Icon + Value + Unit
   - Color-coded by severity (red = high danger)

4. **Gemini Analysis**

   - Typewriter effect text
   - Monospace font for tech feel
   - Scrollable if long

5. **Action Buttons**
   - "TRY PLANETARY DEFENSE" (primary)
   - "RESET SIMULATION" (secondary)

**Animation:**

```typescript
<motion.div
  initial={{ x: "100%" }}
  animate={{ x: 0 }}
  exit={{ x: "100%" }}
  transition={{ type: "spring", damping: 25 }}
>
  {/* Panel content */}
</motion.div>
```

---

### **9. Removed/Unnecessary Features**

**From Original PRD:**

- ❌ 3D asteroid models (`.glb` files)
- ❌ Procedural asteroid generation
- ❌ Complex camera choreography (solar eclipse, side views)
- ❌ 3D trajectory paths
- ❌ 3D particle systems
- ❌ Bezier curves in 3D space
- ❌ Multiple camera scenes
- ❌ Camera controller state machine
- ❌ Orbital mechanics calculations
- ❌ Realistic physics for DART deflection

**Kept:**

- ✅ 3D Earth with textures
- ✅ NASA API integration
- ✅ Gemini AI summaries
- ✅ Impact physics calculations
- ✅ Click-to-select location
- ✅ Preset city buttons
- ✅ DART concept (simplified)

---

### **10. Success Metrics**

**Must Have (MVP):**

- [ ] 3D Earth renders and spins smoothly
- [ ] User can drag to rotate camera
- [ ] User can click globe to select location
- [ ] Preset city buttons work
- [ ] 2D impact animation plays smoothly (3s)
- [ ] Explosion effect looks good
- [ ] Impact metrics calculate correctly
- [ ] Gemini analysis appears with typewriter effect
- [ ] DART button triggers defense simulation
- [ ] DART animation shows intercept and deflection

**Nice to Have:**

- [ ] Sound effects (whoosh, boom)
- [ ] Particle effects in 2D animation background
- [ ] Smooth panel slide animations
- [ ] Loading states for Gemini API
- [ ] Share button for results
- [ ] Download impact report as PDF

---

### **11. File Structure (Updated)**

```
/endurance-protocol
  /public
    /textures
      earth-day.jpg
      earth-night.jpg
      earth-clouds.jpg
    /sprites
      asteroid.svg
      earth-simple.svg
      dart-satellite.svg
      explosion-1.svg
      explosion-2.svg
      explosion-3.svg
  /src
    /components
      EarthScene.tsx              ✅ Keep (simplified)
      Earth.tsx                   ✅ Keep
      ImpactMarker.tsx            ✅ Keep
      Stars.tsx                   ✅ Keep (or use drei)

      ImpactSimulationPanel.tsx   ✅ NEW - Main panel component
      Animation2D.tsx             ✅ NEW - 2D animation canvas
      DartAnimation2D.tsx         ✅ NEW - DART variant

      AsteroidSprite.tsx          ✅ NEW - SVG asteroid
      EarthSprite.tsx             ✅ NEW - SVG simplified Earth
      DartSprite.tsx              ✅ NEW - SVG satellite
      ExplosionSprites.tsx        ✅ NEW - Explosion animation

      ImpactMetrics.tsx           ✅ NEW - Metrics display
      GeminiAnalysis.tsx          ✅ NEW - AI summary with typewriter

      AsteroidCarousel.tsx        ✅ Keep
      InfoPanel.tsx               ❌ DELETE (replaced by ImpactSimulationPanel)

      Asteroid.tsx                ❌ DELETE (no 3D asteroids)
      Asteroid3DModel.tsx         ❌ DELETE
      ProceduralAsteroid.tsx      ❌ DELETE
      SimplifiedImpactAnimation.tsx ❌ DELETE
      ImpactEffects.tsx           ❌ DELETE
      CameraControls.tsx          ❌ DELETE
      CameraViewControls.tsx      ❌ DELETE
      Controls.tsx                ❌ DELETE (if 3D-specific)

    /lib
      nasa.ts                     ✅ Keep
      physics.ts                  ✅ Keep
      gemini.ts                   ✅ Keep
      sceneCamera.ts              ❌ DELETE (no complex camera)
      cameraAnimation.ts          ❌ DELETE

    /types
      index.ts                    ✅ Update (remove 3D-specific types)

    /app
      page.tsx                    ✅ Update (simplified state)
      api/
        neo/route.ts              ✅ Keep
        gemini/route.ts           ✅ Keep
        sbdb.ts                   ✅ Keep (optional)

  PIVOT-PRD.md                    ✅ This file
  CAMERA_SYSTEM.md                ❌ DELETE (outdated)
  vision.json                     ❌ DELETE (outdated)
```

---

### **12. Implementation Timeline**

**Phase 1: Cleanup (1 hour)**

- [ ] Delete all 3D asteroid components
- [ ] Delete camera controller files
- [ ] Simplify EarthScene (remove complex logic)
- [ ] Update types.ts

**Phase 2: 2D Animation Foundation (2 hours)**

- [ ] Create sprite components (Asteroid, Earth, DART)
- [ ] Build Animation2D component with Framer Motion
- [ ] Test basic asteroid movement animation
- [ ] Add explosion effect

**Phase 3: Panel Integration (2 hours)**

- [ ] Build ImpactSimulationPanel component
- [ ] Wire up to page.tsx state
- [ ] Add impact metrics display
- [ ] Integrate Gemini analysis with typewriter

**Phase 4: DART Feature (1.5 hours)**

- [ ] Create DartAnimation2D variant
- [ ] Add DART button and state management
- [ ] Implement deflection animation
- [ ] Show success/fail results

**Phase 5: Polish (1.5 hours)**

- [ ] Smooth panel transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard nav, ARIA labels)

**Total: ~8 hours**

---

### **13. Package Dependencies**

**Already Installed:**

- ✅ `@react-three/fiber` (keep for Earth)
- ✅ `@react-three/drei` (keep for Stars, OrbitControls)
- ✅ `three` (keep)
- ✅ `framer-motion` (use heavily for 2D)
- ✅ `@google/generative-ai` (keep)

**New Dependencies (if needed):**

- ❌ None required! Everything can be done with existing packages

**Remove (if not used elsewhere):**

- `@react-three/postprocessing` (if only used for 3D asteroid effects)

---

### **14. Design Tokens**

```typescript
// src/styles/tokens.ts
export const colors = {
  space: "#000000",
  earth: {
    ocean: "#4a90e2",
    land: "#7cb342",
  },
  asteroid: {
    base: "#6b6b6b",
    dark: "#3a3a3a",
  },
  dart: {
    body: "#c0c0c0",
    panels: "#4a90e2",
    thruster: "#ffd700",
  },
  impact: {
    core: "#fde047", // yellow-300
    mid: "#fb923c", // orange-400
    outer: "#dc2626", // red-600
  },
  ui: {
    panel: "rgba(0, 0, 0, 0.95)",
    border: "rgba(255, 255, 255, 0.2)",
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.6)",
  },
};

export const animations = {
  panel: {
    duration: 0.3,
    ease: "easeInOut",
  },
  asteroid: {
    duration: 3,
    ease: "easeInQuad",
  },
  dart: {
    duration: 1.5,
    ease: "easeOutQuad",
  },
  explosion: {
    duration: 0.5,
    ease: "easeOut",
  },
};
```

---

### **15. Testing Checklist**

**3D Earth:**

- [ ] Earth loads with textures
- [ ] Day/night terminator visible
- [ ] Auto-rotation works
- [ ] Drag to rotate works
- [ ] Click on globe registers correct lat/lon
- [ ] Impact marker appears at correct location
- [ ] Preset city buttons work

**2D Animation:**

- [ ] Asteroid moves smoothly left to right
- [ ] Asteroid rotates during movement
- [ ] Dotted path disappears behind asteroid
- [ ] Explosion effect triggers on impact
- [ ] Animation completes in 3 seconds
- [ ] Animation doesn't lag on mobile

**DART:**

- [ ] DART button appears after impact
- [ ] DART satellite launches from Earth
- [ ] Intercept happens at midpoint
- [ ] Asteroid deflects upward
- [ ] Success message displays
- [ ] Can retry simulation

**Data:**

- [ ] NASA API data loads
- [ ] Impact metrics calculate correctly
- [ ] Gemini analysis generates
- [ ] Fallback works when APIs fail

---

### **16. Future Enhancements (Post-MVP)**

- Multiple impact scenarios (e.g., ocean vs land)
- Comparison mode (show multiple asteroids side-by-side)
- Historical impacts (Tunguska, Chelyabinsk)
- Share results on social media
- 3D visualization toggle (for advanced users)
- Real-time asteroid tracking (connect to NASA's Sentry system)
- Educational mode (explain science step-by-step)
- VR mode (use Three.js VR capabilities)

---

## 🎬 **Demo Script**

1. **Open app** → "This is Endurance Protocol, a planetary defense simulator using real NASA data."
2. **Show spinning Earth** → "Beautiful 3D Earth with realistic day/night cycle."
3. **Drag to rotate** → "Fully interactive - you can explore any location."
4. **Click on Mumbai** → "Let's see what happens if an asteroid hits Mumbai."
5. **Select asteroid** → "Here's Apophis, a 370-meter asteroid."
6. **Click SIMULATE IMPACT** → Panel slides in with cute 2D animation.
7. **Watch animation** → "Traveling at 30 km/s... impact!"
8. **Show metrics** → "10 megatons of energy, 5km crater, devastating."
9. **Read Gemini summary** → AI-generated analysis explains the consequences.
10. **Click TRY PLANETARY DEFENSE** → "What if we could stop it?"
11. **Watch DART** → "NASA's DART satellite intercepts and deflects it!"
12. **Show success** → "Earth is safe. This is real science - DART succeeded in 2022."

**Total time: 60 seconds**

---

## ✅ **Acceptance Criteria**

**Core Functionality:**

- [x] 3D Earth renders beautifully
- [ ] User can select impact location (click or preset)
- [ ] 2D animation plays smoothly
- [ ] Impact metrics display correctly
- [ ] Gemini AI summary generates
- [ ] DART defense simulation works

**User Experience:**

- [ ] No janky animations or lag
- [ ] Panel transitions are smooth
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Loading states for async operations

**Technical:**

- [ ] No 3D camera complexity
- [ ] All sprites load quickly (<100kb total)
- [ ] APIs work with fallbacks
- [ ] No console errors
- [ ] Clean, maintainable code

---

## 📝 **Summary**

This pivot simplifies the technical implementation while maintaining visual appeal:

**Keep:** 3D Earth (your best asset)
**Remove:** All complex 3D choreography
**Add:** Cute 2D animations that are easier to control
**Result:** Achievable, polished, impressive demo

The 2D animation style (think Kurzgesagt) is actually more effective for communication than complex 3D, and much faster to implement correctly.

---

**Last Updated:** 2025-10-04
**Status:** Ready for implementation
**Estimated Time:** 8 hours
