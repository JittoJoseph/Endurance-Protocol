import { NeoSummary } from '@/types';

/**
 * Fetch NEO data from NASA NeoWs API (server-side only)
 */
export async function fetchNeoData(
  apiKey: string,
  page: number = 0,
  size: number = 20
): Promise<NeoSummary[]> {
  try {
    const response = await fetch(
      `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${apiKey}&page=${page}&size=${size}`
    );

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform NASA data to our NeoSummary format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const neos: NeoSummary[] = data.near_earth_objects.map((neo: any) => ({
      id: neo.id,
      name: neo.name,
      estDiameterMeters: {
        min: neo.estimated_diameter.meters.estimated_diameter_min,
        max: neo.estimated_diameter.meters.estimated_diameter_max,
        avg:
          (neo.estimated_diameter.meters.estimated_diameter_min +
            neo.estimated_diameter.meters.estimated_diameter_max) /
          2,
      },
      isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      closeApproachData: neo.close_approach_data?.slice(0, 1).map((ca: any) => ({
        epochDateCloseApproach: ca.epoch_date_close_approach,
        relativeVelocity: {
          kilometersPerSecond: ca.relative_velocity.kilometers_per_second,
        },
        missDistance: {
          kilometers: ca.miss_distance.kilometers,
        },
        orbitingBody: ca.orbiting_body,
      })),
    }));

    return neos;
  } catch (error) {
    console.error('Error fetching NASA data:', error);
    throw error;
  }
}

/**
 * Fetch single NEO by ID from NASA
 */
export async function fetchNeoById(
  apiKey: string,
  asteroidId: string
): Promise<NeoSummary | null> {
  try {
    const response = await fetch(
      `https://api.nasa.gov/neo/rest/v1/neo/${asteroidId}?api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const neo = await response.json();

    return {
      id: neo.id,
      name: neo.name,
      estDiameterMeters: {
        min: neo.estimated_diameter.meters.estimated_diameter_min,
        max: neo.estimated_diameter.meters.estimated_diameter_max,
        avg:
          (neo.estimated_diameter.meters.estimated_diameter_min +
            neo.estimated_diameter.meters.estimated_diameter_max) /
          2,
      },
      isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      closeApproachData: neo.close_approach_data?.slice(0, 1).map((ca: any) => ({
        epochDateCloseApproach: ca.epoch_date_close_approach,
        relativeVelocity: {
          kilometersPerSecond: ca.relative_velocity.kilometers_per_second,
        },
        missDistance: {
          kilometers: ca.miss_distance.kilometers,
        },
        orbitingBody: ca.orbiting_body,
      })),
    };
  } catch (error) {
    console.error('Error fetching NEO by ID:', error);
    return null;
  }
}
