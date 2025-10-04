// Type definitions for Endurance Protocol

export interface NeoSummary {
  id: string;
  name: string;
  estDiameterMeters: { min: number; max: number; avg: number };
  isPotentiallyHazardous: boolean;
  closeApproachData?: Array<{
    epochDateCloseApproach: number;
    relativeVelocity: {
      kilometersPerSecond: string;
    };
    missDistance: {
      kilometers: string;
    };
    orbitingBody: string;
  }>;
}

export interface ImpactMetrics {
  kineticEnergyJ: number;
  tntMegatons: number;
  craterDiameterKm: number;
  destructionRadiusKm: number;
  approxCasualties: number | null;
  seismicEquivalentMagnitude?: number;
}

export interface CityPreset {
  name: string;
  lat: number;
  lon: number;
  population: number;
}

export interface GeminiPromptPayload {
  name: string;
  diameterMeters: number;
  velocityKmS: number;
  tntMegatons: number;
  craterDiameterKm: number;
  destructionRadiusKm: number;
  targetCity?: string;
  estimatedPopulationAffected?: number | null;
  dartSuccess?: boolean;
}
