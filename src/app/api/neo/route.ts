import { NextRequest, NextResponse } from 'next/server';
import { fetchNeoData } from '@/lib/nasa';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '20');

  const apiKey = process.env.NASA_API_KEY;

  // If no API key, return error with instructions
  if (!apiKey) {
    console.error('❌ NASA_API_KEY not configured');
    return NextResponse.json(
      {
        error: 'NASA_API_KEY not configured',
        message: 'Please add NASA_API_KEY to your .env.local file',
        instructions: 'Get your API key from https://api.nasa.gov/',
      },
      { status: 500 }
    );
  }

  try {
    console.log('🚀 Fetching NEO data from NASA API...');
    const allNeos = await fetchNeoData(apiKey, page, size);
    
    // Filter out asteroids that are too large (> 5km diameter)
    // We want to showcase smaller, more realistic impact scenarios
    const MAX_DIAMETER_METERS = 5000; // 5km max
    const filteredNeos = allNeos.filter(neo => {
      return neo.estDiameterMeters.avg <= MAX_DIAMETER_METERS;
    });
    
    console.log(`✅ Fetched ${allNeos.length} NEOs, filtered to ${filteredNeos.length} (< ${MAX_DIAMETER_METERS/1000}km)`);
    
    return NextResponse.json(
      {
        neos: filteredNeos,
        cached: false,
        count: filteredNeos.length,
        filtered: allNeos.length - filteredNeos.length,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=600, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching NASA data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch NASA data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
