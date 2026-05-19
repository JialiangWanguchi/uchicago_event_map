const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortByDistance<T extends { latitude: number | null; longitude: number | null }>(
  events: T[],
  userLat: number,
  userLng: number
) {
  return [...events].sort((a, b) => {
    const distA =
      a.latitude != null && a.longitude != null
        ? haversineKm(userLat, userLng, a.latitude, a.longitude)
        : Number.POSITIVE_INFINITY;
    const distB =
      b.latitude != null && b.longitude != null
        ? haversineKm(userLat, userLng, b.latitude, b.longitude)
        : Number.POSITIVE_INFINITY;
    return distA - distB;
  });
}

export function filterByMaxDistance<T extends { latitude: number | null; longitude: number | null }>(
  events: T[],
  userLat: number,
  userLng: number,
  maxKm: number
) {
  return events.filter((event) => {
    if (event.latitude == null || event.longitude == null) {
      return false;
    }
    return haversineKm(userLat, userLng, event.latitude, event.longitude) <= maxKm;
  });
}

export function formatDistanceKm(km: number) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
