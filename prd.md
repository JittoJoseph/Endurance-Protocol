# Endurance Protocol — Project Requirements DOcument

# 1. Project Overview

**Name:** Endurance Protocol - Visualizing planetary defense for all.
**Goal (MVP):** Build a web demo that uses real NASA NEO data (with cached fallbacks) to let users pick an asteroid, click an impact point on a spinning Earth, run a cinematic impact animation, show computed impact metrics and an AI (Gemini) generated human summary, and optionally simulate a DART deflection. Visual style: black space background with many white dots (starfield), spinning Earth with subtle atmosphere effect, red/white/black UI accents. Target build time: 36 hours (hackathon).

---

# 2. Tech Stack (finalized)

- Frontend: **Next.js 14** + **TypeScript**
- Styling: **Tailwind CSS**
- 3D: **React Three Fiber (@react-three/fiber)** + **@react-three/drei**
- UI animations: **Framer Motion**
- AI: **Google Gemini (gemini-1.5-flash)** via `@google/generative-ai` (proxied via Next API route)
- APIs: **NASA NeoWs**, **JPL Small-Body DB (SBDB)**, (optional) **USGS Earthquake API**
- Hosting: Vercel or other Next-compatible host (env vars support)
- Repo: GitHub repo with branches, README, and issue board

---

# 3. Environment & Secrets

**Environment variables (server-side only):**

```
NASA_API_KEY=<your_nasa_api_key>
GEMINI_API_KEY=<your_google_generative_api_key>
NEXT_PUBLIC_APP_NAME="Impact Watch"
```

**Local dev:** `.env.local` (do NOT commit secrets)

---

# 4. Finalized API URLs & Endpoints

> These are the exact endpoints the agent should use. Use server-side Next API routes as a proxy for any requests requiring secrets.

## NASA NeoWs (primary)

- **Browse (list of NEOs):**

```
GET https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=YOUR_KEY&page=0&size=20
```

- **Get NEO by id:**

```
GET https://api.nasa.gov/neo/rest/v1/neo/{asteroid_id}?api_key=YOUR_KEY
```

- **(Optional) Search by date range / close approach** — use NeoWs docs on `feed` and `browse` as needed. Base: `https://api.nasa.gov/neo/rest/v1/`

## JPL Small-Body Database (detailed orbital params; no key)

- **Query by name/ID:**

```
GET https://ssd-api.jpl.nasa.gov/sbdb.api?sstr={ASTEROID_NAME_OR_ID}&full-prec=true
```

- Docs: [https://ssd-api.jpl.nasa.gov/doc/sbdb.html](https://ssd-api.jpl.nasa.gov/doc/sbdb.html)

## Google Generative AI / Gemini (proxy via server)

- **(Client -> Server)**: `POST /api/gemini` (server will call Gemini)
- **Server -> Gemini SDK**: Use `@google/generative-ai` and model `gemini-1.5-flash`. (Exact SDK usage: instantiate client with `GEMINI_API_KEY` and call `models.generate` with prompt. Place this in `/pages/api/gemini.ts`.)

**Note:** The AI calls must be proxied via Next API route to protect the key.

## USGS Earthquake Catalog (contextual comparison)

- **Search / Catalog UI:** [https://earthquake.usgs.gov/earthquakes/search/](https://earthquake.usgs.gov/earthquakes/search/)
- **REST API example (optional for magnitude comparisons):**

```
GET https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime={YYYY-MM-DD}&endtime={YYYY-MM-DD}
```

(Used only to fetch examples for UI comparators like “equivalent to magnitude X earthquake.”)

---

# 5. Folder Structure (recommended)

```
/impact-watch
  /public
    /textures
      earth-day.jpg
      earth-night.jpg
      starfield-small.jpg (optional)
  /src
    /components
      EarthScene.tsx           // R3F canvas + Earth + stars + atmosphere
      Asteroid.tsx            // procedural asteroid mesh + behavior
      AsteroidCarousel.tsx    // bottom list of asteroids
      InfoPanel.tsx           // Gemini output + metrics
      Controls.tsx            // buttons, DART UI
      ImpactEffects.tsx       // particles, fireball, crater marker
    /lib
      nasa.ts                 // server-client helper wrappers
      physics.ts              // impact math functions
      gemini.ts               // server-side prompt templates (for reference)
    /pages
      api/
        neo.ts                // server proxy: NASA NeoWs browse
        neoById.ts            // server proxy: NASA NeoWs lookup by id
        sbdb.ts               // server proxy: JPL SBDB
        gemini.ts             // server proxy: Gemini prompt -> model
      index.tsx               // main page
  next.config.js
  tailwind.config.js
  package.json
  README.md
```

---

# 6. Data Models (TypeScript interfaces)

```ts
// /src/types.ts
export interface NeoSummary {
  id: string;
  name: string;
  estDiameterMeters: { min: number; max: number; avg: number };
  isPotentiallyHazardous: boolean;
  closeApproachData?: Array<{
    epochDateCloseApproach: number;
    missDistanceKm: number;
    relativeVelocityKmS: number;
    orbitingBody: string;
  }>;
}

export interface ImpactRequest {
  asteroidId?: string; // if using NASA/JPL data
  diameterMeters: number; // meters
  velocityKmS: number; // km/s
  impactLat: number; // degrees
  impactLon: number; // degrees
  targetCity?: string; // optional (for canned population estimates)
  densityKgM3?: number; // default 3000
}

export interface ImpactMetrics {
  kineticEnergyJ: number;
  tntMegatons: number;
  craterDiameterKm: number;
  destructionRadiusKm: number; // useful UI value
  approxCasualties: number | null; // null = unknown
  seismicEquivalentMagnitude?: number; // rough mapping
}
```

---

# 7. Core Features (finalized list for AI agent to implement)

1. **Landing / Canvas**

   - Fullscreen canvas, black background with many small white dots as stars (instanced Points). No heavy star texture required.
   - Floating title overlay: `IMPACT WATCH` (red), subtitle white.

2. **EarthScene (R3F)**

   - Sphere mesh using `earth-day.jpg` texture (2048 recommended).
   - Slightly larger sphere for atmosphere with simple fresnel or additive opacity.
   - Auto-rotation (slow). Camera: orbit with damping; auto-rotate until user interacts.
   - Pixel ratio clamp: `Math.min(window.devicePixelRatio, 1.5)`.

3. **AsteroidCarousel**

   - Bottom horizontal scroll cards (10–20 items).
   - Each card: name, diameter range, velocity (if available), hazard flag, thumbnail (procedural or color).
   - Data source: `/api/neo` (server) with caching.

4. **Selecting / Sending to Earth**

   - Two selection paths:

     - Click 3D asteroid in scene OR click a card.
     - After selecting, enable “Send to Earth” CTA.

   - Impact location chosen by: click on globe (raycast) OR choose a preset city button.
   - Crosshair/marker shows chosen lat/lon.

5. **Asteroid Procedural Generation**

   - Use icosahedron geometry with vertex displacement (Perlin/simplex noise) to avoid external models.
   - Material: standard with roughness & subtle emissive when heating.

6. **Trajectory & Impact Animation**

   - Use a Bezier path from asteroid start to impact point. Duration configurable (2–4s).
   - Effects:

     - Heat glow (emissive intensity up as it approaches).
     - Trail = small particle emitters with short lifetime (limited count).
     - On impact: full-screen white flash overlay, spawn expanding transparent fireball sphere (scales + fades), small particle burst (Points) and crater marker placed on Earth surface.

7. **Impact Metrics (client)**

   - Compute: mass from diameter & density (default 3000 kg/m³), KE, TNT equivalent (MT), crater diameter (km), rough destruction radius, seismic comparison.
   - Show units and “estimate” label.

8. **Gemini Summary**

   - On impact, call `/api/gemini` with a structured prompt (see prompts section).
   - Display Gemini output in `InfoPanel` with typewriter effect.
   - If Gemini API fails or slow, display a cached fallback sentence from repo.

9. **DART Deflection**

   - Button: “Try DART” appears after initial simulation.
   - Simple deflection model: apply delta-v parameter that shifts final endpoint — threshold check to show success/fail.
   - Animate DART interceptor along path, show post-deflection asteroid path/miss result, and request updated Gemini summary.

10. **UX**

    - Smooth camera choreography for selection, follow, and impact.
    - Red/white accents; black background with white dots (starfield).
    - InfoPanel slides in from right on impact with big metric chips.

11. **Accessibility**

    - Keyboard navigation for picking asteroids and triggering impact.
    - Color choices accessible (contrast > 4.5:1).

---

# 8. Prompt Templates (Gemini)

> Implement these prompt templates in `/pages/api/gemini.ts` server route. Send structured JSON to Gemini and request concise output.

## Compact numeric prompt (for InfoPanel metrics)

```
Prompt:
You are an expert scientific summarizer. Given the following JSON:
{
  "name": "{{name}}",
  "diameter_m": {{diameterMeters}},
  "velocity_km_s": {{velocityKmS}},
  "impact_location": "{{city}}, {{country}} (lat: {{lat}}, lon: {{lon}})",
  "crater_km": {{craterDiameterKm}},
  "energy_megatons": {{tntMegatons}},
  "estimated_population_affected": {{popAffected}}
}
Return a concise bullet list (3–5 bullets) with: TNT equivalent, primary destruction radius, estimated casualties (or population affected), one sentence on regional atmospheric effects and one sentence on recommended immediate mitigation actions. Keep it factual and badge each numeric value with units. Use short sentences, max 3 lines per bullet.
```

## Narrative (for demo / announcer)

```
Prompt:
Write a 2-3 sentence dramatic news-style blurb for a presentation. Use given facts (name, diameter, energy, city). Keep it direct and factual, e.g. "A 150m asteroid, X, struck near Mumbai releasing ~10 megatons of energy, causing ...". End with one sentence on whether DART succeeded or failed (if provided).
```

**Caching:** Save the Gemini response per impact to show fallback if rate-limited.

---

# 9. Example Requests (curl) for Developer

### Fetch NEOs (server route)

```
GET /api/neo
```

Server will internally call:

```
GET https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${NASA_API_KEY}&size=20
```

### Gemini proxy (client -> server)

```
POST /api/gemini
Content-Type: application/json
Body:
{
  "promptType": "compact",
  "payload": { ...structured numbers... }
}
```

Server will convert this into a Gemini SDK call.

---

# 10. Impact Math (exact formulas to implement in `physics.ts`)

All calculations must return numbers rounded to reasonable precision and include units in UI.

1. **Volume & Mass**

```ts
const radius = diameter / 2; // meters
const volume = (4 / 3) * Math.PI * Math.pow(radius, 3); // m^3
const mass = volume * density; // kg
```

2. **Kinetic Energy**

```ts
// v in m/s
const KE_J = 0.5 * mass * v * v; // Joules
const tntMegatons = KE_J / 4.184e15; // megatons TNT
```

3. **Crater Diameter (simplified empirical)**

```ts
const craterDiameterKm =
  1.8 * Math.pow(diameter / 1000, 0.78) * Math.pow(density / 3000, 0.33); // km
```

4. **Destruction Radius (estimate)**

- Use crater diameter as baseline; destruction radius ~ `craterDiameterKm * 1.5` for heavy structural loss. Present with "~" uncertainty.

5. **Seismic Equivalent**

- Return a rough mapping table: e.g., `10^x` energy mapping approximates magnitude (note: just an estimate). Implement simple function to map TNT megatons to a comparable earthquake magnitude for UI (e.g., megatons → M).

> Always display "Estimate — simplified model for educational/demo purposes."

---

# 11. UI Components & Props (to implement)

- **EarthScene**

  - Props: `onGlobeClick(lat, lon)`, `selectedAsteroidId`, `playImpactAnimation(impactRequest)`.

- **AsteroidCarousel**

  - Props: `neos: NeoSummary[]`, `onSelect(neoId)`.

- **InfoPanel**

  - Props: `impactMetrics: ImpactMetrics`, `geminiText: string`, `onTryDart()`.

- **Controls**

  - Props: `onFetchNeos()`, `onPreset(city)`, `onToggleAutoRotate()`.

- **ImpactEffects**

  - Props: `impactPoint`, `onImpactComplete()`

---

# 12. Acceptance Criteria (for automated QA / agent)

**MUST pass:**

- Landing page loads with R3F canvas and starfield (black background with many white dots).
- At least 5 asteroids visible in carousel (from `/api/neo` or cached fallback).
- Selecting an asteroid and clicking on the globe triggers a trajectory animation and an impact sequence.
- InfoPanel displays computed metrics (KE, TNT MT, crater km) with units and a Gemini-generated summary (or cached fallback).
- DART button triggers a deflection animation and shows an updated outcome.
- App remains interactive (no freezing) when running the impact sequence.
- All API keys used only on server side (no client leakage).

**SHOULD pass (nice-to-have):**

- Typewriter animation for Gemini text.
- Camera choreography is smooth with easing.
- Fallback data used when NASA or Gemini rate limit fails.

---

# 13. Performance & Production Notes

- **Textures:** use 2048px for Earth textures. Convert to KTX2 if possible.
- **Particles:** limit to <500 active particles during impact; reuse particle pool.
- **Frame rate:** clamp devicePixelRatio; use `useFrame` with elapsed time smoothing; pause expensive systems when panels open.
- **Lazy load:** asteroid heavy assets & Gemini responses should be lazy-loaded.
- **Caching:** `Cache-Control` headers on `/api/neo` responses: `s-maxage=600, stale-while-revalidate=300`.

---

# 14. Error Handling & Fallbacks

- **NASA API fail:** load `data/cached_neos.json` from repo. Show subtle “Using cached data” toast.
- **Gemini fail:** show cached summary from repo and mark as cached.
- **Rendering fail:** display a static 2D fallback animation and still compute/display metrics textually.
- **Rate limits:** throttle server requests and queue Gemini calls; show progress spinner.

---

# 15. Security & Compliance

- Do not commit any API keys. Use `.env.local`.
- CORS: Gemini & NASA calls are proxied server-side; client only calls Next API routes.
- Logging: Do not log full API keys. Only log request ids or status for debugging.

---

# 16. Dev Timeline & Task Checklist (36-hour plan condensed)

**Hours 0–2**

- Repo + Next.js + Tailwind + R3F install
- Create `/api/neo` server proxy and cached sample

**Hours 2–6**

- Implement `EarthScene` (sphere + atmosphere + star dots)
- Basic UI skeleton + carousel

**Hours 6–12**

- Procedural asteroid + selection + impact initiation UI
- Raycast globe click -> lat/lon mapping

**Hours 12–18**

- Trajectory + impact visual effects + camera choreography
- Implement physics math functions

**Hours 18–22**

- InfoPanel + metrics display (client-side computed)
- Basic Gemini `/api/gemini` proxy & prompt integration with fallback

**Hours 22–26**

- DART deflection UI + simple model + animation

**Hours 26–32**

- Polish UI, animations, typewriter text, accessibility, and toasts

**Hours 32–36**

- Testing, bugfixes, demo script, finalize README & slides

---

# 17. Demo Script (copy-paste-ready)

1. “Impact Watch — using real NASA data + Gemini AI to explain consequences.” (5s)
2. Show spinning Earth + starfield. (5s)
3. Open asteroid carousel, select _Apophis_, click Mumbai preset. (10s)
4. Click **Send to Earth** → cinematic impact (show flash) → InfoPanel slides in. Read first bullet of Gemini summary. (20s)
5. Click **Try DART** → rewind + show intercept → show updated Gemini message: “DART succeeded, Earth safe.” (20s)
6. “Repo & API keys: server-side. We used NASA NeoWs and Gemini-1.5-flash. Thank you.” (10s)

---

# 18. Example Gemini Response (sample)

```
• Energy: ~10.5 megatons TNT.
• Heavy destruction within ~12 km radius; severe structural collapse up to ~30 km.
• Approx. people affected: ~1.2M (city population estimate).
• Possible regional fires; short-term atmospheric dust could lower sunlight regionally for several months.
• Recommended immediate action: mass evacuations from the 30 km zone; prioritize airports and ports for relief.
```

---

# 19. Developer Hints / Implementation Details

- **Raycast to lat/lon:** convert `intersection.point` on sphere to spherical coordinates: `lat = asin(y / r)`, `lon = atan2(z, x)` (watch coordinate space).
- **Bezier path:** Use `new THREE.CubicBezierCurve3(p0, p1, p2, p3)` and sample along it for position over time.
- **Particle systems:** Use a fixed-size buffer geometry for particles, update attributes for alive particles; reuse pool.
- **Crater marker:** Place small decal or ring on Earth surface at impact lat/lon. A slight normal offset avoids z-fighting.
- **DART animation:** small triangular mesh that travels along intercept path; when reaches asteroid, apply offset to asteroid path endpoint.

---

# 20. Deliverables (what to push to repo)

- `README.md` (overview + demo steps + env setup)
- `src/components/*` (R3F components + UI)
- `src/lib/nasa.ts`, `src/lib/gemini.ts`, `src/lib/physics.ts`
- `pages/api/neo.ts`, `pages/api/gemini.ts`, `pages/api/sbdb.ts`
- `public/textures/*` (earth textures)
- `data/cached_neos.json` (fallback)
- `presentation.pdf` or `slides/` (for judges)
- `demo-script.txt` (copy-paste for presenter)

---

# 21. Final notes for the AI coding agent

- Be explicit: **server-side** only for secret API calls. Use `process.env.NASA_API_KEY` and `process.env.GEMINI_API_KEY`.
- Prioritize visuals + smooth demo over scientific perfection. Use “Estimate” language in UI.
- Keep code modular and instrument endpoints to return sample payloads for frontend development before full integration.
- Use cached sample responses for Gemini to ensure demo works offline or when rate-limited.

---
