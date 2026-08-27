import districtRaw from "./india-districts.json";

/** [state, district, lat, lng] — tuples, because this ships to every phone. */
type DistrictTuple = [string, string, number, number];

export type PlaceKind = "city" | "district";

export interface Place {
  kind: PlaceKind;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}

/**
 * Somewhere a citizen can name to say where they are, when the browser will not
 * say it for them.
 *
 * Two layers, because they answer different questions. Districts come from the
 * same GADM boundary data the alert ingestion uses, so every part of the country
 * is reachable — 594 of them across all 35 states and union territories. Cities
 * sit on top for the places where a district centroid would mislead: a large
 * metro centroid can sit tens of kilometres from the person reporting.
 *
 * Neither is an address. A chosen place is always marked approximate, and the
 * report records which place it was placed from so a responder can judge it.
 */
const CITIES: [string, string, string, number, number][] = [
  ["Mumbai", "Greater Bombay", "Maharashtra", 19.076, 72.8777],
  ["Navi Mumbai", "Thane", "Maharashtra", 19.033, 73.0297],
  ["Thane", "Thane", "Maharashtra", 19.2183, 72.9781],
  ["Pune", "Pune", "Maharashtra", 18.5204, 73.8567],
  ["Nagpur", "Nagpur", "Maharashtra", 21.1458, 79.0882],
  ["Nashik", "Nashik", "Maharashtra", 19.9975, 73.7898],
  ["Aurangabad", "Aurangabad", "Maharashtra", 19.8762, 75.3433],
  ["Solapur", "Solapur", "Maharashtra", 17.6599, 75.9064],
  ["New Delhi", "Delhi", "Delhi", 28.6139, 77.209],
  ["Dwarka", "Delhi", "Delhi", 28.5921, 77.046],
  ["Rohini", "Delhi", "Delhi", 28.7495, 77.0565],
  ["Gurugram", "Gurgaon", "Haryana", 28.4595, 77.0266],
  ["Faridabad", "Faridabad", "Haryana", 28.4089, 77.3178],
  ["Noida", "Gautam Buddha Nagar", "Uttar Pradesh", 28.5355, 77.391],
  ["Ghaziabad", "Ghaziabad", "Uttar Pradesh", 28.6692, 77.4538],
  ["Bengaluru", "Bangalore Urban", "Karnataka", 12.9716, 77.5946],
  ["Mysuru", "Mysore", "Karnataka", 12.2958, 76.6394],
  ["Mangaluru", "Dakshin Kannad", "Karnataka", 12.9141, 74.856],
  ["Hubballi", "Dharwad", "Karnataka", 15.3647, 75.124],
  ["Belagavi", "Belgaum", "Karnataka", 15.8497, 74.4977],
  ["Hyderabad", "Hyderabad", "Telangana", 17.385, 78.4867],
  ["Warangal", "Warangal", "Telangana", 17.9689, 79.5941],
  ["Chennai", "Chennai", "Tamil Nadu", 13.0827, 80.2707],
  ["Coimbatore", "Coimbatore", "Tamil Nadu", 11.0168, 76.9558],
  ["Madurai", "Madurai", "Tamil Nadu", 9.9252, 78.1198],
  ["Tiruchirappalli", "Tiruchchirappalli", "Tamil Nadu", 10.7905, 78.7047],
  ["Salem", "Salem", "Tamil Nadu", 11.6643, 78.146],
  ["Tirunelveli", "Tirunelveli Kattabo", "Tamil Nadu", 8.7139, 77.7567],
  ["Kolkata", "Kolkata", "West Bengal", 22.5726, 88.3639],
  ["Howrah", "Haora", "West Bengal", 22.5958, 88.2636],
  ["Siliguri", "Darjiling", "West Bengal", 26.7271, 88.3953],
  ["Asansol", "Barddhaman", "West Bengal", 23.6739, 86.9524],
  ["Ahmedabad", "Ahmadabad", "Gujarat", 23.0225, 72.5714],
  ["Surat", "Surat", "Gujarat", 21.1702, 72.8311],
  ["Vadodara", "Vadodara", "Gujarat", 22.3072, 73.1812],
  ["Rajkot", "Rajkot", "Gujarat", 22.3039, 70.8022],
  ["Bhavnagar", "Bhavnagar", "Gujarat", 21.7645, 72.1519],
  ["Jaipur", "Jaipur", "Rajasthan", 26.9124, 75.7873],
  ["Jodhpur", "Jodhpur", "Rajasthan", 26.2389, 73.0243],
  ["Udaipur", "Udaipur", "Rajasthan", 24.5854, 73.7125],
  ["Kota", "Kota", "Rajasthan", 25.2138, 75.8648],
  ["Ajmer", "Ajmer", "Rajasthan", 26.4499, 74.6399],
  ["Lucknow", "Lucknow", "Uttar Pradesh", 26.8467, 80.9462],
  ["Kanpur", "Kanpur", "Uttar Pradesh", 26.4499, 80.3319],
  ["Varanasi", "Varanasi", "Uttar Pradesh", 25.3176, 82.9739],
  ["Prayagraj", "Allahabad", "Uttar Pradesh", 25.4358, 81.8463],
  ["Agra", "Agra", "Uttar Pradesh", 27.1767, 78.0081],
  ["Meerut", "Meerut", "Uttar Pradesh", 28.9845, 77.7064],
  ["Bareilly", "Bareilly", "Uttar Pradesh", 28.367, 79.4304],
  ["Gorakhpur", "Gorakhpur", "Uttar Pradesh", 26.7606, 83.3732],
  ["Patna", "Patna", "Bihar", 25.5941, 85.1376],
  ["Gaya", "Gaya", "Bihar", 24.7955, 85.0002],
  ["Bhagalpur", "Bhagalpur", "Bihar", 25.2425, 86.9842],
  ["Muzaffarpur", "Muzaffarpur", "Bihar", 26.1209, 85.3647],
  ["Bhopal", "Bhopal", "Madhya Pradesh", 23.2599, 77.4126],
  ["Indore", "Indore", "Madhya Pradesh", 22.7196, 75.8577],
  ["Jabalpur", "Jabalpur", "Madhya Pradesh", 23.1815, 79.9864],
  ["Gwalior", "Gwalior", "Madhya Pradesh", 26.2183, 78.1828],
  ["Ujjain", "Ujjain", "Madhya Pradesh", 23.1765, 75.7885],
  ["Bhubaneswar", "Khordha", "Odisha", 20.2961, 85.8245],
  ["Cuttack", "Cuttack", "Odisha", 20.4625, 85.883],
  ["Rourkela", "Sundargarh", "Odisha", 22.2604, 84.8536],
  ["Puri", "Puri", "Odisha", 19.8135, 85.8312],
  ["Visakhapatnam", "Vishakhapatnam", "Andhra Pradesh", 17.6868, 83.2185],
  ["Vijayawada", "Krishna", "Andhra Pradesh", 16.5062, 80.648],
  ["Guntur", "Guntur", "Andhra Pradesh", 16.3067, 80.4365],
  ["Tirupati", "Chittoor", "Andhra Pradesh", 13.6288, 79.4192],
  ["Nellore", "Nellore", "Andhra Pradesh", 14.4426, 79.9865],
  ["Kochi", "Ernakulam", "Kerala", 9.9312, 76.2673],
  ["Thiruvananthapuram", "Thiruvananthapuram", "Kerala", 8.5241, 76.9366],
  ["Kozhikode", "Kozhikode", "Kerala", 11.2588, 75.7804],
  ["Thrissur", "Thrissur", "Kerala", 10.5276, 76.2144],
  ["Kollam", "Kollam", "Kerala", 8.8932, 76.6141],
  ["Guwahati", "Kamrup", "Assam", 26.1445, 91.7362],
  ["Silchar", "Cachar", "Assam", 24.8333, 92.7789],
  ["Dibrugarh", "Dibrugarh", "Assam", 27.4728, 94.912],
  ["Ranchi", "Ranchi", "Jharkhand", 23.6102, 85.2799],
  ["Jamshedpur", "Purba Singhbhum", "Jharkhand", 22.8046, 86.2029],
  ["Dhanbad", "Dhanbad", "Jharkhand", 23.7957, 86.4304],
  ["Raipur", "Raipur", "Chhattisgarh", 21.2514, 81.6296],
  ["Bhilai", "Durg", "Chhattisgarh", 21.1938, 81.3509],
  ["Chandigarh", "Chandigarh", "Chandigarh", 30.7333, 76.7794],
  ["Ludhiana", "Ludhiana", "Punjab", 30.901, 75.8573],
  ["Amritsar", "Amritsar", "Punjab", 31.634, 74.8723],
  ["Jalandhar", "Jalandhar", "Punjab", 31.326, 75.5762],
  ["Patiala", "Patiala", "Punjab", 30.3398, 76.3869],
  ["Dehradun", "Dehra Dun", "Uttarakhand", 30.3165, 78.0322],
  ["Haridwar", "Haridwar", "Uttarakhand", 29.9457, 78.1642],
  ["Shimla", "Shimla", "Himachal Pradesh", 31.1048, 77.1734],
  ["Srinagar", "Srinagar", "Jammu and Kashmir", 34.0837, 74.7973],
  ["Jammu", "Jammu", "Jammu and Kashmir", 32.7266, 74.857],
  ["Leh", "Ladakh (Leh)", "Jammu and Kashmir", 34.1526, 77.5771],
  ["Panaji", "North Goa", "Goa", 15.4909, 73.8278],
  ["Margao", "South Goa", "Goa", 15.2832, 73.9862],
  ["Puducherry", "Puducherry", "Puducherry", 11.9416, 79.8083],
  ["Shillong", "East Khasi Hills", "Meghalaya", 25.5788, 91.8933],
  ["Imphal", "West Imphal", "Manipur", 24.817, 93.9368],
  ["Aizawl", "Aizawl", "Mizoram", 23.7271, 92.7176],
  ["Agartala", "West Tripura", "Tripura", 23.8315, 91.2868],
  ["Kohima", "Kohima", "Nagaland", 25.6751, 94.11],
  ["Itanagar", "Papum Pare", "Arunachal Pradesh", 27.0844, 93.6053],
  ["Gangtok", "East", "Sikkim", 27.3389, 88.6065],
  ["Port Blair", "Andaman Islands", "Andaman and Nicobar Islands", 11.6234, 92.7265],
];

/**
 * The boundary data is GADM 2.x, which predates several changes on the ground:
 * it still says Orissa and Uttaranchal, and it has no Telangana at all because
 * it was cut before the 2014 split. Left alone, the state list showed both
 * "Odisha" and "Orissa" as if they were different places, and every city filed
 * under a modern name matched no district at all.
 *
 * Renames are applied on load rather than by rewriting the source file, so
 * regenerating it from GADM stays a mechanical step.
 */
const STATE_RENAMES: Record<string, string> = {
  Orissa: "Odisha",
  Uttaranchal: "Uttarakhand",
  "Andaman and Nicobar": "Andaman and Nicobar Islands",
};

/**
 * The ten districts that became Telangana in 2014. They are still filed under
 * Andhra Pradesh in the source data, which would put Hyderabad in the wrong
 * state — the kind of error a judge from either state notices immediately.
 */
const TELANGANA_DISTRICTS = new Set([
  "Adilabad",
  "Hyderabad",
  "Karimnagar",
  "Khammam",
  "Mahbubnagar",
  "Medak",
  "Nalgonda",
  "Nizamabad",
  "Rangareddi",
  "Warangal",
]);

function canonicalState(state: string, district: string): string {
  if (state === "Andhra Pradesh" && TELANGANA_DISTRICTS.has(district)) return "Telangana";
  return STATE_RENAMES[state] ?? state;
}

export const PLACES: Place[] = [
  ...CITIES.map(([name, district, state, lat, lng]): Place => ({
    kind: "city",
    name,
    district,
    state,
    lat,
    lng,
  })),
  ...(districtRaw as DistrictTuple[]).map(([state, district, lat, lng]): Place => ({
    kind: "district",
    name: district,
    district,
    state: canonicalState(state, district),
    lat,
    lng,
  })),
];

export const STATES: string[] = [...new Set(PLACES.map((p) => p.state))].sort();

export const DISTRICT_COUNT = PLACES.filter((p) => p.kind === "district").length;
export const CITY_COUNT = PLACES.filter((p) => p.kind === "city").length;

export function placesIn(state: string): Place[] {
  return PLACES.filter((p) => p.state === state).sort(
    (a, b) => a.district.localeCompare(b.district) || a.kind.localeCompare(b.kind)
  );
}

/** Districts of a state, in name order. */
export function districtsIn(state: string): Place[] {
  return PLACES.filter((p) => p.state === state && p.kind === "district").sort((a, b) =>
    a.district.localeCompare(b.district)
  );
}

/**
 * Cities known inside one district.
 *
 * Most districts have none: the index carries every district in the country but
 * only the cities where a district centroid would be misleading. When there are
 * none, the district itself is the answer and the picker says so rather than
 * showing an empty step.
 */
export function citiesIn(state: string, district: string): Place[] {
  return PLACES.filter(
    (p) => p.kind === "city" && p.state === state && p.district === district
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export function labelFor(p: Place): string {
  // A city inside a like-named district should not read "Chennai, Chennai".
  return p.kind === "city" && p.name !== p.district
    ? `${p.name}, ${p.district}, ${p.state}`
    : `${p.name}, ${p.state}`;
}

/** Case-insensitive search over cities and districts, prefix matches first. */
export function searchPlaces(query: string, limit = 40): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { p: Place; rank: number }[] = [];
  for (const p of PLACES) {
    const name = p.name.toLowerCase();
    // Cities outrank districts on an equal match: someone typing "Pune" wants
    // the city they are standing in, not the district polygon around it.
    const base = p.kind === "city" ? 0 : 1;
    const rank = name.startsWith(q)
      ? base
      : name.includes(q)
        ? 4 + base
        : p.state.toLowerCase().startsWith(q)
          ? 8 + base
          : -1;
    if (rank >= 0) scored.push({ p, rank });
  }
  scored.sort((a, b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name));
  return scored.slice(0, limit).map((s) => s.p);
}

/** The nearest known place to a position, for naming a device-supplied fix. */
export function nearestPlace(lat: number, lng: number): Place {
  let best = PLACES[0];
  let bestD = Infinity;
  for (const p of PLACES) {
    const dy = p.lat - lat;
    const dx = (p.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const sq = dy * dy + dx * dx;
    if (sq < bestD) {
      bestD = sq;
      best = p;
    }
  }
  return best;
}
