/**
 * Get continent name from latitude and longitude coordinates
 * Uses approximate geographic boundaries
 */
export function getContinentFromCoordinates(lat: number, lon: number): string {
  // North America
  if (lat >= 15 && lat <= 72 && lon >= -170 && lon <= -50) {
    return "North America";
  }
  
  // South America
  if (lat >= -56 && lat <= 15 && lon >= -82 && lon <= -34) {
    return "South America";
  }
  
  // Europe
  if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 40) {
    return "Europe";
  }
  
  // Africa
  if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) {
    return "Africa";
  }
  
  // Asia (complex, split into regions)
  if (lat >= -10 && lat <= 77) {
    // Middle East
    if (lon >= 26 && lon <= 63) {
      return "Middle East";
    }
    // Central/East Asia
    if (lon >= 40 && lon <= 180) {
      return "Asia";
    }
    // Southeast Asia
    if (lon >= 95 && lon <= 141 && lat >= -10 && lat <= 28) {
      return "Southeast Asia";
    }
  }
  
  // Oceania/Australia
  if (lat >= -47 && lat <= 0 && lon >= 110 && lon <= 180) {
    return "Oceania";
  }
  
  // Pacific Islands
  if (lat >= -30 && lat <= 30 && lon >= 130 && lon <= -120) {
    return "Pacific Ocean";
  }
  
  // Antarctica
  if (lat < -60) {
    return "Antarctica";
  }
  
  // Arctic
  if (lat > 66.5) {
    return "Arctic";
  }
  
  // Atlantic Ocean
  if (lon >= -60 && lon <= 0 && lat >= -60 && lat <= 60) {
    return "Atlantic Ocean";
  }
  
  // Indian Ocean
  if (lon >= 20 && lon <= 110 && lat >= -60 && lat <= 30) {
    return "Indian Ocean";
  }
  
  // Default fallback
  return "Unknown Location";
}

/**
 * Get a friendly location description from coordinates
 */
export function getLocationDescription(lat: number, lon: number): string {
  const continent = getContinentFromCoordinates(lat, lon);
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  
  return `${continent} (${Math.abs(lat).toFixed(1)}°${latDir}, ${Math.abs(lon).toFixed(1)}°${lonDir})`;
}
