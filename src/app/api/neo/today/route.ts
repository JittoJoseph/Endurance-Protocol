import { NextResponse } from 'next/server';

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

// NASA API response types
interface NasaNeoDiameter {
  estimated_diameter_min: number;
  estimated_diameter_max: number;
}

interface NasaNeoCloseApproach {
  close_approach_date: string;
  close_approach_date_full: string;
  relative_velocity: {
    kilometers_per_second: string;
  };
  miss_distance: {
    kilometers: string;
    lunar: string;
  };
}

interface NasaNeo {
  id: string;
  name: string;
  estimated_diameter: {
    meters: NasaNeoDiameter;
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: NasaNeoCloseApproach[];
}

interface NasaApiResponse {
  near_earth_objects: Record<string, NasaNeo[]>;
}

// Output type for our API
interface CloseApproachOutput {
  id: string;
  name: string;
  date: string;
  time: string;
  velocity_km_s: number;
  miss_distance_km: number;
  miss_distance_lunar: number;
  diameter_m: {
    min: number;
    max: number;
    avg: number;
  };
  is_potentially_hazardous: boolean;
}

export async function GET() {
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    
    // Get next 7 days of close approaches
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const response = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data: NasaApiResponse = await response.json();
    
    // Flatten all close approaches from all dates
    const allApproaches: CloseApproachOutput[] = [];
    Object.keys(data.near_earth_objects).forEach(date => {
      data.near_earth_objects[date].forEach((neo: NasaNeo) => {
        neo.close_approach_data?.forEach((approach: NasaNeoCloseApproach) => {
          if (approach.close_approach_date >= startDate) {
            allApproaches.push({
              id: neo.id,
              name: neo.name,
              date: approach.close_approach_date,
              time: approach.close_approach_date_full,
              velocity_km_s: parseFloat(approach.relative_velocity.kilometers_per_second),
              miss_distance_km: parseFloat(approach.miss_distance.kilometers),
              miss_distance_lunar: parseFloat(approach.miss_distance.lunar),
              diameter_m: {
                min: neo.estimated_diameter.meters.estimated_diameter_min,
                max: neo.estimated_diameter.meters.estimated_diameter_max,
                avg: (neo.estimated_diameter.meters.estimated_diameter_min + 
                      neo.estimated_diameter.meters.estimated_diameter_max) / 2
              },
              is_potentially_hazardous: neo.is_potentially_hazardous_asteroid,
            });
          }
        });
      });
    });

    // Sort by closest approach time
    allApproaches.sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    return NextResponse.json({ 
      approaches: allApproaches.slice(0, 10), // Return top 10
      count: allApproaches.length 
    });
  } catch (error) {
    console.error('Error fetching today\'s close approaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch close approaches' },
      { status: 500 }
    );
  }
}
