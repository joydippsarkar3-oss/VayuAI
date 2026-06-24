/**
 * Curated India city database — quick-pick across all 28 states & 8 UTs (PRD §6.3).
 * Covers metros, tier-2/3 towns, and regionally diverse points so the multi-source
 * fusion is demonstrable anywhere. Arbitrary city search is handled by the
 * Open-Meteo geocoding API (see app/api/cities/route.ts) on top of this list.
 */
export interface CityEntry {
  name: string;
  admin1: string; // state / UT
  latitude: number;
  longitude: number;
}

export const INDIA_CITIES: CityEntry[] = [
  // North
  { name: "New Delhi", admin1: "Delhi", latitude: 28.6139, longitude: 77.209 },
  { name: "Delhi", admin1: "Delhi", latitude: 28.7041, longitude: 77.1025 },
  { name: "Lucknow", admin1: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462 },
  { name: "Jaipur", admin1: "Rajasthan", latitude: 26.9124, longitude: 75.7873 },
  { name: "Chandigarh", admin1: "Chandigarh", latitude: 30.7333, longitude: 76.7794 },
  { name: "Shimla", admin1: "Himachal Pradesh", latitude: 31.1048, longitude: 77.1734 },
  { name: "Dehradun", admin1: "Uttarakhand", latitude: 30.3165, longitude: 78.0322 },
  { name: "Srinagar", admin1: "Jammu and Kashmir", latitude: 34.0837, longitude: 74.7973 },
  { name: "Jammu", admin1: "Jammu and Kashmir", latitude: 32.7266, longitude: 74.857 },
  { name: "Ludhiana", admin1: "Punjab", latitude: 30.901, longitude: 75.8573 },
  { name: "Amritsar", admin1: "Punjab", latitude: 31.634, longitude: 74.8723 },

  // South
  { name: "Bengaluru", admin1: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
  { name: "Chennai", admin1: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707 },
  { name: "Hyderabad", admin1: "Telangana", latitude: 17.385, longitude: 78.4867 },
  { name: "Thiruvananthapuram", admin1: "Kerala", latitude: 8.5241, longitude: 76.9366 },
  { name: "Kochi", admin1: "Kerala", latitude: 9.9312, longitude: 76.2673 },
  { name: "Coimbatore", admin1: "Tamil Nadu", latitude: 11.0168, longitude: 76.9558 },
  { name: "Madurai", admin1: "Tamil Nadu", latitude: 9.9252, longitude: 78.1198 },
  { name: "Mysuru", admin1: "Karnataka", latitude: 12.2958, longitude: 76.6394 },
  { name: "Mangaluru", admin1: "Karnataka", latitude: 12.9141, longitude: 74.856 },
  { name: "Visakhapatnam", admin1: "Andhra Pradesh", latitude: 17.6868, longitude: 83.2185 },
  { name: "Vijayawada", admin1: "Andhra Pradesh", latitude: 16.5062, longitude: 80.648 },

  // West
  { name: "Mumbai", admin1: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
  { name: "Pune", admin1: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
  { name: "Nagpur", admin1: "Maharashtra", latitude: 21.1458, longitude: 79.0882 },
  { name: "Ahmedabad", admin1: "Gujarat", latitude: 23.0225, longitude: 72.5714 },
  { name: "Surat", admin1: "Gujarat", latitude: 21.1702, longitude: 72.8311 },
  { name: "Vadodara", admin1: "Gujarat", latitude: 22.3072, longitude: 73.1812 },
  { name: "Panaji", admin1: "Goa", latitude: 15.4909, longitude: 73.8278 },
  { name: "Gandhinagar", admin1: "Gujarat", latitude: 23.2156, longitude: 72.6369 },

  // East
  { name: "Kolkata", admin1: "West Bengal", latitude: 22.5726, longitude: 88.3639 },
  { name: "Bhubaneswar", admin1: "Odisha", latitude: 20.2961, longitude: 85.8245 },
  { name: "Cuttack", admin1: "Odisha", latitude: 20.4625, longitude: 85.8828 },
  { name: "Patna", admin1: "Bihar", latitude: 25.5941, longitude: 85.1376 },
  { name: "Ranchi", admin1: "Jharkhand", latitude: 23.3441, longitude: 85.3096 },
  { name: "Jamshedpur", admin1: "Jharkhand", latitude: 22.8046, longitude: 86.2029 },
  { name: "Guwahati", admin1: "Assam", latitude: 26.1445, longitude: 91.7362 },

  // Central
  { name: "Bhopal", admin1: "Madhya Pradesh", latitude: 23.2599, longitude: 77.4126 },
  { name: "Indore", admin1: "Madhya Pradesh", latitude: 22.7196, longitude: 75.8577 },
  { name: "Raipur", admin1: "Chhattisgarh", latitude: 21.2514, longitude: 81.6296 },

  // North-East
  { name: "Shillong", admin1: "Meghalaya", latitude: 25.5788, longitude: 91.8933 },
  { name: "Itanagar", admin1: "Arunachal Pradesh", latitude: 27.0844, longitude: 93.6053 },
  { name: "Aizawl", admin1: "Mizoram", latitude: 23.7271, longitude: 92.7176 },
  { name: "Imphal", admin1: "Manipur", latitude: 24.817, longitude: 93.9368 },
  { name: "Agartala", admin1: "Tripura", latitude: 23.8315, longitude: 91.2868 },
  { name: "Kohima", admin1: "Nagaland", latitude: 25.6751, longitude: 94.1086 },

  // Tier-3 / regional (the PRD's stated pain point: unreliable single-source data)
  { name: "Gwalior", admin1: "Madhya Pradesh", latitude: 26.2183, longitude: 78.1828 },
  { name: "Jabalpur", admin1: "Madhya Pradesh", latitude: 23.1815, longitude: 79.9864 },
  { name: "Gorakhpur", admin1: "Uttar Pradesh", latitude: 26.7606, longitude: 83.3732 },
  { name: "Varanasi", admin1: "Uttar Pradesh", latitude: 25.3176, longitude: 82.9739 },
  { name: "Kanpur", admin1: "Uttar Pradesh", latitude: 26.4499, longitude: 80.3319 },
  { name: "Agra", admin1: "Uttar Pradesh", latitude: 27.1767, longitude: 78.0081 },
  { name: "Meerut", admin1: "Uttar Pradesh", latitude: 28.9845, longitude: 77.7064 },
  { name: "Hubli", admin1: "Karnataka", latitude: 15.3647, longitude: 75.124 },
  { name: "Belagavi", admin1: "Karnataka", latitude: 15.8497, longitude: 74.4977 },
  { name: "Tiruchirappalli", admin1: "Tamil Nadu", latitude: 10.7905, longitude: 78.7047 },
  { name: "Salem", admin1: "Tamil Nadu", latitude: 11.6643, longitude: 78.146 },
  { name: "Warangal", admin1: "Telangana", latitude: 17.9689, longitude: 79.5941 },
  { name: "Tirupati", admin1: "Andhra Pradesh", latitude: 13.6288, longitude: 79.4192 },

  // Islands & coast (cyclone-prone — relevant to PRD §6.4 alerts)
  { name: "Port Blair", admin1: "Andaman and Nicobar Islands", latitude: 11.6234, longitude: 92.7265 },
  { name: "Kavaratti", admin1: "Lakshadweep", latitude: 10.5667, longitude: 72.6417 },
  { name: "Puducherry", admin1: "Puducherry", latitude: 11.9416, longitude: 79.8083 },
];

export function findCuratedCity(query: string): CityEntry | undefined {
  const q = query.trim().toLowerCase();
  return INDIA_CITIES.find(
    (c) => c.name.toLowerCase() === q
  );
}

export function searchCuratedCities(query: string, limit = 8): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDIA_CITIES.slice(0, limit);
  return INDIA_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.admin1.toLowerCase().includes(q)
  ).slice(0, limit);
}
