/**
 * Odyssey Geographic Utilities
 * Landmark coordinate dictionary, Haversine route distance & transit time estimators,
 * and deterministic spatial offset resolver for tourist spots and itinerary waypoints.
 */

// Well-known landmark coordinates for prominent destinations
export const KNOWN_LANDMARK_COORDINATES = {
  // Agra
  'taj mahal': { lat: 27.1751, lon: 78.0421 },
  'agra fort': { lat: 27.1795, lon: 78.0211 },
  'mehtab bagh': { lat: 27.1800, lon: 78.0423 },
  'itimad-ud-daulah': { lat: 27.1929, lon: 78.0310 },
  'fatehpur sikri': { lat: 27.0945, lon: 77.6679 },
  'akbar tomb': { lat: 27.2205, lon: 77.9505 },

  // Jaipur
  'hawa mahal': { lat: 26.9239, lon: 75.8267 },
  'amber palace': { lat: 26.9855, lon: 75.8513 },
  'amber fort': { lat: 26.9855, lon: 75.8513 },
  'city palace': { lat: 26.9258, lon: 75.8237 },
  'jantar mantar': { lat: 26.9248, lon: 75.8246 },
  'jal mahal': { lat: 26.9656, lon: 75.8458 },
  'nahargarh fort': { lat: 26.9373, lon: 75.8156 },
  'chokhi dhani': { lat: 26.7663, lon: 75.8362 },

  // Goa
  'calangute beach': { lat: 15.5439, lon: 73.7553 },
  'baga beach': { lat: 15.5553, lon: 73.7517 },
  'fort aguada': { lat: 15.4926, lon: 73.7737 },
  'basilica of bom jesus': { lat: 15.5009, lon: 73.9116 },
  'dudhsagar falls': { lat: 15.3144, lon: 74.3143 },
  'anjuna beach': { lat: 15.5800, lon: 73.7430 },
  'palolem beach': { lat: 15.0100, lon: 74.0232 },
  'chapora fort': { lat: 15.6058, lon: 73.7360 },

  // Varanasi
  'dashashwamedh ghat': { lat: 25.3069, lon: 83.0106 },
  'kashi vishwanath temple': { lat: 25.3109, lon: 83.0107 },
  'sarnath': { lat: 25.3811, lon: 83.0214 },
  'assi ghat': { lat: 25.2885, lon: 83.0064 },
  'manikarnika ghat': { lat: 25.3108, lon: 83.0142 },

  // Munnar
  'eravikulam national park': { lat: 10.1500, lon: 77.0600 },
  'mattupetty dam': { lat: 10.1064, lon: 77.1242 },
  'tea museum': { lat: 10.0889, lon: 77.0594 },
  'anamudi peak': { lat: 10.1700, lon: 77.0640 },
  'top station': { lat: 10.1250, lon: 77.2436 },

  // Delhi
  'india gate': { lat: 28.6129, lon: 77.2295 },
  'qutub minar': { lat: 28.5244, lon: 77.1855 },
  'red fort': { lat: 28.6562, lon: 77.2410 },
  'humayun tomb': { lat: 28.5933, lon: 77.2507 },
  'lotus temple': { lat: 28.5535, lon: 77.2588 },

  // Udaipur
  'lake pichola': { lat: 24.5760, lon: 73.6797 },
  'jag mandir': { lat: 24.5678, lon: 73.6780 },
  'saheliyon ki bari': { lat: 24.6062, lon: 73.6853 },
  'fateh sagar lake': { lat: 24.6033, lon: 73.6692 },

  // International
  'eiffel tower': { lat: 48.8584, lon: 2.2945 },
  'louvre museum': { lat: 48.8606, lon: 2.3376 },
  'notre-dame': { lat: 48.8530, lon: 2.3499 },
  'colosseum': { lat: 41.8902, lon: 12.4922 },
  'vatican museums': { lat: 41.9067, lon: 12.4547 },
  'fushimi inari': { lat: 34.9671, lon: 135.7727 },
  'kinkaku-ji': { lat: 35.0394, lon: 135.7292 },
  'santorini caldera': { lat: 36.4166, lon: 25.4324 },
  'oia sunset': { lat: 36.4618, lon: 25.3753 },
}

/**
 * Calculates Great-Circle distance (in km) between two coordinates using Haversine formula
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Computes total route distance along an array of waypoints
 */
export function calculateTotalRouteDistance(coords = []) {
  if (!coords || coords.length < 2) return 0
  let total = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const from = coords[i]
    const to = coords[i + 1]
    if (from && to && typeof from.lat === 'number' && typeof to.lat === 'number') {
      total += calculateHaversineDistance(from.lat, from.lon, to.lat, to.lon)
    }
  }
  return total
}

/**
 * Estimates driving/transit duration based on route distance
 * Assumes average urban/scenic transit speed of 24 km/h plus initial boarding buffer
 */
export function estimateTransitTimeMinutes(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return 10
  // Road travel factor (roads are ~1.25x haversine direct line)
  const roadKm = distanceKm * 1.25
  const minutes = Math.round((roadKm / 24) * 60) + 5
  return Math.max(12, minutes)
}

/**
 * Deterministically generates a consistent spatial offset around a center coordinate
 * based on a string name hash. Ensures waypoints are clustered sensibly within 1.5 - 4.5 km.
 */
function getDeterministicOffset(name = '', index = 0) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const angle = ((Math.abs(hash) % 360) + index * 75) * (Math.PI / 180)
  // Distance between 0.012 and 0.038 degrees (~1.3km to 4.2km)
  const radius = 0.012 + ((Math.abs(hash * 31) % 100) / 100) * 0.026
  return {
    dLat: Math.sin(angle) * radius,
    dLon: (Math.cos(angle) * radius) / Math.cos(20 * (Math.PI / 180)),
  }
}

/**
 * Resolves optimal geographic coordinates for a given spot or activity name
 * @param {string} spotName
 * @param {object} baseDestination
 * @param {number} index
 * @returns {{ lat: number, lon: number }}
 */
export function resolveSpotCoordinates(spotName, baseDestination, index = 0) {
  const normalized = (spotName || '').toLowerCase().trim()

  // 1. Direct dictionary match
  for (const [key, coords] of Object.entries(KNOWN_LANDMARK_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { lat: coords.lat, lon: coords.lon }
    }
  }

  // 2. Base destination coordinates fallback with deterministic radial offset
  const baseLat =
    baseDestination?.coordinates?.latitude ??
    baseDestination?.latitude ??
    27.1767
  const baseLon =
    baseDestination?.coordinates?.longitude ??
    baseDestination?.longitude ??
    78.0081

  const offset = getDeterministicOffset(spotName, index)
  return {
    lat: Number((baseLat + offset.dLat).toFixed(5)),
    lon: Number((baseLon + offset.dLon).toFixed(5)),
  }
}
