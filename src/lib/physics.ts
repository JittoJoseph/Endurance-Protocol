import { ImpactMetrics } from '@/types';

/**
 * Calculate impact metrics from asteroid parameters
 * All formulas are simplified for educational/demo purposes
 */
export function calculateImpactMetrics(
  diameterMeters: number,
  velocityKmS: number,
  densityKgM3: number = 3000,
  targetPopulation?: number
): ImpactMetrics {
  // 1. Calculate volume and mass
  const radius = diameterMeters / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3); // m³
  const mass = volume * densityKgM3; // kg

  // 2. Calculate kinetic energy
  const velocityMS = velocityKmS * 1000; // convert to m/s
  const kineticEnergyJ = 0.5 * mass * velocityMS * velocityMS; // Joules

  // 3. Convert to TNT megatons (1 megaton = 4.184e15 J)
  const tntMegatons = kineticEnergyJ / 4.184e15;

  // 4. Calculate crater diameter (simplified empirical formula)
  const craterDiameterKm =
    1.8 *
    Math.pow(diameterMeters / 1000, 0.78) *
    Math.pow(densityKgM3 / 3000, 0.33);

  // 5. Estimate destruction radius (crater diameter * 1.5 for heavy damage)
  const destructionRadiusKm = craterDiameterKm * 1.5;

  // 6. Rough casualty estimate based on destruction radius and population density
  let approxCasualties: number | null = null;
  if (targetPopulation) {
    // Assume urban density, casualties proportional to destruction area
    const destructionAreaKm2 = Math.PI * Math.pow(destructionRadiusKm, 2);
    // Very rough estimate: 50% casualty rate in destruction zone
    approxCasualties = Math.floor(
      (targetPopulation * destructionAreaKm2) / 100 * 0.5
    );
  }

  // 7. Seismic equivalent (rough mapping)
  const seismicEquivalentMagnitude = energyToRichterMagnitude(kineticEnergyJ);

  return {
    kineticEnergyJ,
    tntMegatons: parseFloat(tntMegatons.toFixed(2)),
    craterDiameterKm: parseFloat(craterDiameterKm.toFixed(2)),
    destructionRadiusKm: parseFloat(destructionRadiusKm.toFixed(2)),
    approxCasualties,
    seismicEquivalentMagnitude: parseFloat(
      seismicEquivalentMagnitude.toFixed(1)
    ),
  };
}

/**
 * Convert energy (Joules) to approximate Richter magnitude
 * Very simplified mapping for demonstration
 */
function energyToRichterMagnitude(energyJ: number): number {
  // Richter scale: M = 2/3 * log10(E) - 2.9 (very rough)
  // More accurate would use seismic moment, but this is for demo
  const logEnergy = Math.log10(energyJ);
  return (2 / 3) * logEnergy - 2.9;
}

/**
 * Convert lat/lon to 3D position on a sphere
 * Adjusted for texture alignment: subtract 270° (90° + 180°) from longitude to match Earth texture
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number = 2
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180); // 0 at north pole, PI at south pole
  const theta = (lon - 270) * (Math.PI / 180); // Adjust for texture alignment (180° more)

  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return [x, y, z];
}

/**
 * Convert 3D position on sphere to lat/lon
 * Inverse of latLonToVector3
 */
export function vector3ToLatLon(
  x: number,
  y: number,
  z: number,
  radius: number = 2
): { lat: number; lon: number } {
  const normalizedY = y / radius;
  const lat = Math.asin(Math.max(-1, Math.min(1, normalizedY))) * (180 / Math.PI);
  const lon = Math.atan2(x, z) * (180 / Math.PI);

  return { lat, lon };
}

/**
 * Calculate DART deflection outcome with realistic physics
 * Based on momentum transfer and asteroid properties
 */
export function calculateDartDeflection(
  asteroidVelocityKmS: number,
  asteroidDiameterM: number,
  asteroidDensityKgM3: number = 3000,
  leadTimeYears: number = 5, // Years of warning before impact
  dartMassKg: number = 570, // DART spacecraft mass
  dartVelocityKmS: number = 6.6, // DART impact velocity relative to asteroid
  momentumEnhancement: number = 3.6 // Beta factor from ejecta (DART mission achieved ~3.6)
): {
  success: boolean;
  velocityChangeMS: number;
  deflectionDistanceKm: number;
  missDistanceKm: number;
  confidence: number;
  reason: string;
} {
  // 1. Calculate asteroid mass
  const asteroidRadiusM = asteroidDiameterM / 2;
  const asteroidVolumeM3 = (4/3) * Math.PI * Math.pow(asteroidRadiusM, 3);
  const asteroidMassKg = asteroidVolumeM3 * asteroidDensityKgM3;

  // 2. Momentum transfer with enhancement from ejecta
  // Δv = β * (m_dart * v_impact) / m_asteroid
  const impactMomentum = dartMassKg * dartVelocityKmS * 1000; // kg⋅m/s
  const effectiveMomentum = momentumEnhancement * impactMomentum;
  const velocityChangeMS = effectiveMomentum / asteroidMassKg;

  // 3. Calculate deflection distance over time
  // Distance = velocity_change * time
  const leadTimeSeconds = leadTimeYears * 365.25 * 24 * 3600;
  const deflectionDistanceM = velocityChangeMS * leadTimeSeconds;
  const deflectionDistanceKm = deflectionDistanceM / 1000;

  // 4. Compare to Earth radius (needed to miss Earth)
  const earthRadiusKm = 6371;
  const minimumMissKm = earthRadiusKm + 10000; // Earth radius + safety margin
  const missDistanceKm = deflectionDistanceKm;

  // 5. Determine success based on deflection vs asteroid size
  // Small asteroids are easier to deflect, large ones may be impossible
  let success = false;
  let confidence = 0;
  let reason = "";

  if (asteroidDiameterM > 1000) {
    // Very large asteroids (>1km) - DART alone is insufficient
    success = false;
    confidence = 5;
    reason = "Asteroid too large for single DART mission. Would require multiple kinetic impactors or nuclear deflection.";
  } else if (asteroidDiameterM > 500) {
    // Large asteroids (500m-1km) - difficult but possible with early warning
    if (leadTimeYears >= 10 && missDistanceKm > minimumMissKm) {
      success = true;
      confidence = 60;
      reason = "Successful deflection with significant lead time. Large asteroid requires early intervention.";
    } else {
      success = false;
      confidence = 30;
      reason = "Insufficient deflection. Larger asteroid needs more warning time or multiple missions.";
    }
  } else if (asteroidDiameterM > 100) {
    // Medium asteroids (100m-500m) - good candidate for DART
    if (missDistanceKm > minimumMissKm) {
      success = true;
      confidence = 85;
      reason = "Successful deflection achieved. Medium-sized asteroid responds well to kinetic impact.";
    } else if (leadTimeYears < 2) {
      success = false;
      confidence = 40;
      reason = "Insufficient warning time. Deflection too small to avoid Earth collision.";
    } else {
      success = true;
      confidence = 70;
      reason = "Marginal success. Asteroid trajectory altered enough to reduce impact severity.";
    }
  } else {
    // Small asteroids (<100m) - easiest to deflect
    if (missDistanceKm > minimumMissKm * 2) {
      success = true;
      confidence = 95;
      reason = "Highly successful deflection. Small asteroid easily diverted with significant margin.";
    } else {
      success = true;
      confidence = 80;
      reason = "Successful deflection. Small asteroid trajectory sufficiently altered.";
    }
  }

  return {
    success,
    velocityChangeMS,
    deflectionDistanceKm,
    missDistanceKm,
    confidence,
    reason,
  };
}
