import { GeminiPromptPayload } from '@/types';

/**
 * Generate compact impact summary prompt for Gemini
 */
export function generateCompactPrompt(payload: GeminiPromptPayload): string {
  return `You are an expert scientific summarizer. Given the following asteroid impact data:

{
  "name": "${payload.name}",
  "diameter_meters": ${payload.diameterMeters},
  "velocity_km_s": ${payload.velocityKmS},
  "tnt_megatons": ${payload.tntMegatons},
  "crater_diameter_km": ${payload.craterDiameterKm},
  "destruction_radius_km": ${payload.destructionRadiusKm},
  "target_city": "${payload.targetCity || 'Unknown location'}",
  "estimated_population_affected": ${payload.estimatedPopulationAffected || 'unknown'}
}

Return a concise bullet list (3–5 bullets) with:
- TNT equivalent
- Primary destruction radius
- Estimated casualties or population affected
- One sentence on regional atmospheric effects
- One sentence on recommended immediate mitigation actions

Keep it factual and badge each numeric value with units. Use short sentences, max 3 lines per bullet.`;
}

/**
 * Generate narrative prompt for dramatic presentation
 */
export function generateNarrativePrompt(
  payload: GeminiPromptPayload
): string {
  const dartText = payload.dartSuccess !== undefined && payload.dartSuccess !== null
    ? payload.dartSuccess
      ? 'DART mission succeeded in deflecting the asteroid, preventing impact.'
      : 'DART mission failed to sufficiently deflect the asteroid.'
    : '';

  return `Write a 2-3 sentence dramatic news-style blurb for a presentation about an asteroid impact. 

Asteroid: ${payload.name}
Diameter: ${payload.diameterMeters}m
Impact location: ${payload.targetCity || 'Earth'}
Energy released: ${payload.tntMegatons} megatons TNT

Keep it direct and factual, like a news report. ${dartText ? `End with: ${dartText}` : ''}`;
}

/**
 * Fallback summary when Gemini API fails
 */
export function getFallbackSummary(payload: GeminiPromptPayload): string {
  return `• Energy: ~${payload.tntMegatons} megatons TNT equivalent.
• Heavy destruction within ~${payload.destructionRadiusKm} km radius; severe structural collapse.
• Approx. people affected: ${payload.estimatedPopulationAffected ? `~${Math.floor(payload.estimatedPopulationAffected / 1000)}K` : 'unknown'} (estimate).
• Possible regional fires; atmospheric dust could reduce sunlight for several months.
• Recommended: Mass evacuations from impact zone; prioritize emergency services and relief coordination.

(Using cached response - Gemini API unavailable)`;
}
