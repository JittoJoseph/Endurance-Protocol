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
 * Calculate DART deflection outcome
 * Simplified: assumes small velocity change affects trajectory
 */
export function calculateDartDeflection(
  asteroidVelocityKmS: number,
  asteroidMassKg: number,
  dartMassKg: number = 570, // DART spacecraft mass
  dartVelocityKmS: number = 6.6 // DART impact velocity
): {
  success: boolean;
  velocityChangeMS: number;
  deflectionAngleDeg: number;
} {
  // Momentum transfer: Δv = (m_dart * v_dart) / m_asteroid
  const momentumTransfer = dartMassKg * dartVelocityKmS * 1000; // to m/s
  const velocityChangeMS = momentumTransfer / asteroidMassKg;

  // Calculate deflection angle (very simplified)
  const asteroidVelocityMS = asteroidVelocityKmS * 1000;
  const deflectionAngleRad = Math.atan(velocityChangeMS / asteroidVelocityMS);
  const deflectionAngleDeg = deflectionAngleRad * (180 / Math.PI);

  // Success criteria: deflection > 0.1 degrees (arbitrary for demo)
  const success = deflectionAngleDeg > 0.1;

  return {
    success,
    velocityChangeMS,
    deflectionAngleDeg,
  };
}
