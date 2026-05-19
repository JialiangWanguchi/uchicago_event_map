export const CAMPUS_CENTER: [number, number] = [41.7897, -87.5997];

export const DEFAULT_PAGE_SIZE = 12;

/** Max events loaded for the explore list (no pagination). */
export const LIST_EVENTS_LIMIT = 500;

export const ARCHIVE_DAYS_AFTER_END = 30;

export const CATEGORY_OPTIONS = [
  "Academic",
  "Arts",
  "Athletics",
  "Career",
  "Community",
  "Social",
  "Workshop"
];

export const BUILDING_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "cobb hall": { lat: 41.789335, lng: -87.599829 },
  "harper memorial library": { lat: 41.789222, lng: -87.598999 },
  "harper memorial": { lat: 41.789222, lng: -87.598999 },
  "logan center": { lat: 41.785048, lng: -87.60304 },
  "reynolds club": { lat: 41.789751, lng: -87.599384 },
  "kersten physics teaching center": { lat: 41.790771, lng: -87.600082 },
  "kptc": { lat: 41.790771, lng: -87.600082 },
  "quadrangle club": { lat: 41.791163, lng: -87.596941 },
  "ida noyes hall": { lat: 41.788118, lng: -87.596628 },
  "ida noyes": { lat: 41.788118, lng: -87.596628 },
  "mansueto library": { lat: 41.791014, lng: -87.597513 },
  "joe and rika mansueto library": { lat: 41.791014, lng: -87.597513 },
  "ratner athletic center": { lat: 41.793014, lng: -87.601404 },
  "ratner": { lat: 41.793014, lng: -87.601404 },
  "smart museum of art": { lat: 41.793344, lng: -87.600783 },
  "smart museum": { lat: 41.793344, lng: -87.600783 },
  "oriental institute": { lat: 41.791631, lng: -87.598661 },
  "main quad": { lat: 41.78993, lng: -87.59947 },
  "saieh hall": { lat: 41.789192, lng: -87.596953 },
  "saieh hall for economics": { lat: 41.789192, lng: -87.596953 },
  "booth": { lat: 41.789948, lng: -87.595992 },
  "booth school": { lat: 41.789948, lng: -87.595992 },
  "kent chemical laboratory": { lat: 41.791325, lng: -87.600979 },
  "kent lab": { lat: 41.791325, lng: -87.600979 },
  "crerar library": { lat: 41.790387, lng: -87.603398 },
  "eckhart hall": { lat: 41.7902, lng: -87.5995 },
  "ryerson laboratory": { lat: 41.7905, lng: -87.5998 },
  "social sciences research building": { lat: 41.7895, lng: -87.601 },
  "ssrb": { lat: 41.7895, lng: -87.601 },
  "rockefeller chapel": { lat: 41.7889, lng: -87.5978 },
  "rockefeller memorial chapel": { lat: 41.7889, lng: -87.5978 },
  "international house": { lat: 41.7878, lng: -87.5925 },
  "i-house": { lat: 41.7878, lng: -87.5925 },
  "stuart hall": { lat: 41.7908, lng: -87.5982 },
  "pick hall": { lat: 41.7901, lng: -87.6005 },
  "walker museum": { lat: 41.7904, lng: -87.5988 },
  "botany pond": { lat: 41.7906, lng: -87.5985 },
  "court theatre": { lat: 41.7855, lng: -87.6025 },
  "franke institute": { lat: 41.7898, lng: -87.5985 },
  "neubauer collegium": { lat: 41.7896, lng: -87.598 },
  "regenstein library": { lat: 41.7922, lng: -87.601 },
  "regenstein": { lat: 41.7922, lng: -87.601 },
  "gleacher center": { lat: 41.889, lng: -87.622 },
  "harper center": { lat: 41.789948, lng: -87.595992 },
  "bond chapel": { lat: 41.789, lng: -87.598 },
  "swift hall": { lat: 41.7893, lng: -87.5988 },
  "divinity school": { lat: 41.7892, lng: -87.5986 },
  "law school": { lat: 41.7885, lng: -87.6015 },
  "d'angelo law library": { lat: 41.7885, lng: -87.6015 },
  "center for identity": { lat: 41.7897, lng: -87.5997 },
  "northwest building": { lat: 41.7915, lng: -87.602 },
  "gordon center": { lat: 41.791, lng: -87.6012 },
  "hinds laboratory": { lat: 41.7912, lng: -87.601 },
  "judd hall": { lat: 41.7909, lng: -87.6002 },
  "geophysical sciences": { lat: 41.7903, lng: -87.6018 },
  "searle chemistry laboratory": { lat: 41.7914, lng: -87.6012 },
  "jones laboratory": { lat: 41.7916, lng: -87.601 },
  "culver hall": { lat: 41.7885, lng: -87.5975 },
  "wieboldt hall": { lat: 41.7888, lng: -87.5972 },
  "press building": { lat: 41.7886, lng: -87.597 },
  "rosenwald hall": { lat: 41.7884, lng: -87.5978 },
  "classics building": { lat: 41.7887, lng: -87.598 },
  "social service administration": { lat: 41.7882, lng: -87.5965 },
  "ssa": { lat: 41.7882, lng: -87.5965 }
};

export const VIRTUAL_LOCATION_PATTERN =
  /\b(virtual|online|zoom|teams|webinar|remote|livestream|live stream|hybrid online)\b/i;
