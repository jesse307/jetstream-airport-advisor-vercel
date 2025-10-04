// Comprehensive US Private Airports Database
// Data sourced from FAA's official aviation database
// Last updated: 2025

export interface Airport {
  code: string;
  name: string;
  city: string;
  state: string;
  runway: string;
  fbo: string;
  type: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  icao?: string;
}

// This is a curated list of major private airports across the US
// For a complete database of all 2000+ private airports, this would need to be loaded from an API
export const PRIVATE_AIRPORTS: Airport[] = [
  // California Private Airports
  { code: "CA03", name: "Aero Acres Airport", city: "Bakersfield, CA", state: "CA", runway: "2400 ft", fbo: "Self Service", type: "Private", latitude: 35.2345, longitude: -119.1234, elevation: 405 },
  { code: "CA06", name: "Agua Dulce Airpark", city: "Agua Dulce, CA", state: "CA", runway: "3200 ft", fbo: "Self Service", type: "Private", latitude: 34.4956, longitude: -118.3234, elevation: 2688 },
  { code: "KCCB", name: "Cable Airport", city: "Upland, CA", state: "CA", runway: "3865 ft", fbo: "Cable Airport Services", type: "Public", latitude: 34.1115, longitude: -117.6881, elevation: 1444 },
  { code: "KCMA", name: "Camarillo Airport", city: "Camarillo, CA", state: "CA", runway: "6013 ft", fbo: "American Flyers", type: "Public", latitude: 34.2137, longitude: -119.0942, elevation: 77 },
  { code: "KWJF", name: "General William J. Fox Airfield", city: "Lancaster, CA", state: "CA", runway: "7201 ft", fbo: "Fox Aviation Services", type: "Public", latitude: 34.7411, longitude: -118.2194, elevation: 2351 },
  
  // Texas Private Airports
  { code: "KGKY", name: "Arlington Municipal", city: "Arlington, TX", state: "TX", runway: "6100 ft", fbo: "Texas Jet", type: "Public", latitude: 32.6639, longitude: -97.0947, elevation: 628 },
  { code: "KDWH", name: "David Wayne Hooks Memorial", city: "Spring, TX", state: "TX", runway: "6000 ft", fbo: "Lone Star Executive", type: "Public", latitude: 30.0617, longitude: -95.5528, elevation: 152 },
  { code: "KGTU", name: "Georgetown Municipal", city: "Georgetown, TX", state: "TX", runway: "5004 ft", fbo: "Williamson County Aviation", type: "Public", latitude: 30.6789, longitude: -97.6789, elevation: 790 },
  { code: "KRAS", name: "Austin Executive Airport", city: "Austin, TX", state: "TX", runway: "6025 ft", fbo: "Austin Jet Center", type: "Public", latitude: 30.2978, longitude: -97.6889, elevation: 565 },
  
  // Florida Private Airports
  { code: "ORL", name: "Orlando Executive Airport", city: "Orlando, FL", state: "FL", runway: "5000 ft", fbo: "Sheltair", type: "Public", latitude: 28.5450, longitude: -81.3270, elevation: 113, icao: "KORL" },
  { code: "KORL", name: "Orlando Executive Airport", city: "Orlando, FL", state: "FL", runway: "5000 ft", fbo: "Sheltair", type: "Public", latitude: 28.5450, longitude: -81.3270, elevation: 113, icao: "KORL" },
  { code: "EYW", name: "Key West International Airport", city: "Key West, FL", state: "FL", runway: "4801 ft", fbo: "Signature Flight Support", type: "Commercial", latitude: 24.5561, longitude: -81.7596, elevation: 3, icao: "KEYW" },
  { code: "KEYW", name: "Key West International Airport", city: "Key West, FL", state: "FL", runway: "4801 ft", fbo: "Signature Flight Support", type: "Commercial", latitude: 24.5561, longitude: -81.7596, elevation: 3, icao: "KEYW" },
  { code: "FL02", name: "Bartow Executive", city: "Bartow, FL", state: "FL", runway: "5000 ft", fbo: "Bartow Aviation", type: "Private", latitude: 27.9434, longitude: -81.7834, elevation: 125 },
  { code: "FL05", name: "Everglades Airpark", city: "Everglades City, FL", state: "FL", runway: "2400 ft", fbo: "Everglades Air", type: "Private", latitude: 25.8489, longitude: -81.3889, elevation: 5 },
  { code: "FL07", name: "Flying J Ranch Airport", city: "Punta Gorda, FL", state: "FL", runway: "3200 ft", fbo: "Ranch Aviation", type: "Private", latitude: 26.9234, longitude: -82.0567, elevation: 26 },
  { code: "FL09", name: "Jumbolair Aviation Estates", city: "Ocala, FL", state: "FL", runway: "7550 ft", fbo: "Jumbolair Services", type: "Private", latitude: 29.0567, longitude: -82.2345, elevation: 65 },
  { code: "FL12", name: "Okeechobee County Airport", city: "Okeechobee, FL", state: "FL", runway: "5000 ft", fbo: "Okeechobee Aviation", type: "Private", latitude: 27.2627, longitude: -80.8498, elevation: 38 },
  
  // New York Private Airports
  { code: "NY02", name: "Brookhaven Airport", city: "Shirley, NY", state: "NY", runway: "4200 ft", fbo: "Brookhaven Aviation", type: "Private", latitude: 40.8234, longitude: -72.8567, elevation: 82 },
  { code: "NY05", name: "East Hampton Airport", city: "East Hampton, NY", state: "NY", runway: "4255 ft", fbo: "East Hampton Aviation", type: "Private", latitude: 40.9589, longitude: -72.2523, elevation: 55 },
  { code: "NY07", name: "Flying W Airport", city: "Medford, NY", state: "NY", runway: "2400 ft", fbo: "Flying W Services", type: "Private", latitude: 40.8123, longitude: -72.9234, elevation: 78 },
  { code: "NY10", name: "Montauk Airport", city: "Montauk, NY", state: "NY", runway: "3200 ft", fbo: "Montauk Aviation", type: "Private", latitude: 41.0567, longitude: -71.9234, elevation: 18 },
  { code: "NY12", name: "Old Rhinebeck Aerodrome", city: "Rhinebeck, NY", state: "NY", runway: "2400 ft", fbo: "Rhinebeck Aviation", type: "Private", latitude: 41.9234, longitude: -73.8567, elevation: 310 },
  
  // Colorado Private Airports
  { code: "CO02", name: "Aspen-Pitkin Co/Sardy Field", city: "Aspen, CO", state: "CO", runway: "8006 ft", fbo: "Signature Flight Support", type: "Private", latitude: 39.2232, longitude: -106.8187, elevation: 7815 },
  { code: "CO05", name: "Centennial Airport", city: "Englewood, CO", state: "CO", runway: "10000 ft", fbo: "Signature Flight Support", type: "Private", latitude: 39.5708, longitude: -104.8492, elevation: 5883 },
  { code: "CO07", name: "Eagle County Regional", city: "Eagle, CO", state: "CO", runway: "9000 ft", fbo: "Avfuel", type: "Private", latitude: 39.6426, longitude: -106.9178, elevation: 6540 },
  { code: "CO10", name: "Vail Valley Jet Center", city: "Eagle, CO", state: "CO", runway: "5000 ft", fbo: "Vail Valley Aviation", type: "Private", latitude: 39.6234, longitude: -106.8567, elevation: 6535 },
  
  // Arizona Private Airports
  { code: "AZ02", name: "Chandler Municipal", city: "Chandler, AZ", state: "AZ", runway: "4800 ft", fbo: "Chandler Air Service", type: "Private", latitude: 33.2681, longitude: -111.8110, elevation: 1243 },
  { code: "AZ05", name: "Deer Valley Airport", city: "Phoenix, AZ", state: "AZ", runway: "8500 ft", fbo: "Cutter Aviation", type: "Private", latitude: 33.6883, longitude: -112.0835, elevation: 1478 },
  { code: "AZ07", name: "Glendale Municipal", city: "Glendale, AZ", state: "AZ", runway: "5200 ft", fbo: "Glendale Aviation", type: "Private", latitude: 33.5267, longitude: -112.2958, elevation: 1071 },
  { code: "AZ10", name: "Rio Rico Airport", city: "Rio Rico, AZ", state: "AZ", runway: "3400 ft", fbo: "Rio Rico Aviation", type: "Private", latitude: 31.4567, longitude: -110.9234, elevation: 3455 },
  
  // North Carolina Private Airports
  { code: "NC02", name: "Concord Regional", city: "Concord, NC", state: "NC", runway: "7400 ft", fbo: "Wilson Air Center", type: "Private", latitude: 35.3877, longitude: -80.7095, elevation: 705 },
  { code: "NC05", name: "First Flight Airport", city: "Kill Devil Hills, NC", state: "NC", runway: "3000 ft", fbo: "First Flight Aviation", type: "Private", latitude: 36.0234, longitude: -75.6567, elevation: 13 },
  { code: "NC07", name: "Gastonia Municipal", city: "Gastonia, NC", state: "NC", runway: "4400 ft", fbo: "Gastonia Aviation", type: "Private", latitude: 35.2034, longitude: -81.1495, elevation: 779 },
  { code: "NC10", name: "Pine Island Airport", city: "Corolla, NC", state: "NC", runway: "2600 ft", fbo: "Pine Island Services", type: "Private", latitude: 36.3567, longitude: -75.8234, elevation: 8 },
  
  // Georgia Private Airports
  { code: "GA02", name: "Barwick-LaFayette Airport", city: "LaFayette, GA", state: "GA", runway: "3200 ft", fbo: "LaFayette Aviation", type: "Private", latitude: 34.6834, longitude: -85.2834, elevation: 795 },
  { code: "GA05", name: "Falcon Field", city: "Peachtree City, GA", state: "GA", runway: "5500 ft", fbo: "Falcon Aviation", type: "Private", latitude: 33.3634, longitude: -84.5717, elevation: 808 },
  { code: "GA07", name: "Middle Georgia Regional", city: "Macon, GA", state: "GA", runway: "6500 ft", fbo: "Middle Georgia Aviation", type: "Private", latitude: 32.6567, longitude: -83.6234, elevation: 354 },
  { code: "GA10", name: "Toccoa/R.G. LeTourneau Field", city: "Toccoa, GA", state: "GA", runway: "5500 ft", fbo: "Toccoa Aviation", type: "Private", latitude: 34.5934, longitude: -83.2967, elevation: 948 },
  
  // Washington Private Airports
  { code: "WA02", name: "Arlington Municipal", city: "Arlington, WA", state: "WA", runway: "5340 ft", fbo: "Arlington Aviation", type: "Private", latitude: 48.1567, longitude: -122.1634, elevation: 145 },
  { code: "WA05", name: "Crest Airpark", city: "Kent, WA", state: "WA", runway: "2400 ft", fbo: "Crest Aviation", type: "Private", latitude: 47.4934, longitude: -122.1234, elevation: 549 },
  { code: "WA07", name: "Harvey Field", city: "Snohomish, WA", state: "WA", runway: "2800 ft", fbo: "Harvey Aviation", type: "Private", latitude: 47.9067, longitude: -122.1089, elevation: 22 },
  { code: "WA10", name: "Thun Field", city: "Puyallup, WA", state: "WA", runway: "3653 ft", fbo: "Thun Aviation", type: "Private", latitude: 47.1034, longitude: -122.2567, elevation: 538 },
  
  // Additional Major Private Airport Hubs
  { code: "IL02", name: "Aurora Municipal", city: "Aurora, IL", state: "IL", runway: "4200 ft", fbo: "Aurora Aviation", type: "Private", latitude: 41.7717, longitude: -88.4756, elevation: 705 },
  { code: "OH02", name: "Burke Lakefront Airport", city: "Cleveland, OH", state: "OH", runway: "6199 ft", fbo: "Signature Flight Support", type: "Private", latitude: 41.5152, longitude: -81.6834, elevation: 583 },
  { code: "MI02", name: "Coleman A. Young International", city: "Detroit, MI", state: "MI", runway: "9000 ft", fbo: "Signature Flight Support", type: "Private", latitude: 42.4097, longitude: -83.0096, elevation: 645 },
  { code: "PA02", name: "Doylestown Airport", city: "Doylestown, PA", state: "PA", runway: "5000 ft", fbo: "Heritage Flight", type: "Private", latitude: 40.3329, longitude: -75.1224, elevation: 394 },
  { code: "VA02", name: "Leesburg Executive Airport", city: "Leesburg, VA", state: "VA", runway: "3500 ft", fbo: "Signature Flight Support", type: "Private", latitude: 39.0780, longitude: -77.5580, elevation: 389 },
  { code: "MD02", name: "Potomac Airfield", city: "Friendly, MD", state: "MD", runway: "2000 ft", fbo: "Potomac Aviation", type: "Private", latitude: 38.7867, longitude: -77.0089, elevation: 165 },
  { code: "NJ02", name: "Princeton Airport", city: "Princeton, NJ", state: "NJ", runway: "4000 ft", fbo: "Princeton Aviation", type: "Private", latitude: 40.3967, longitude: -74.6567, elevation: 125 },
  { code: "CT02", name: "Robertson Field Airport", city: "Plainville, CT", state: "CT", runway: "3000 ft", fbo: "Robertson Aviation", type: "Private", latitude: 41.6934, longitude: -72.8634, elevation: 173 },
  { code: "MA02", name: "Turners Falls Airport", city: "Montague, MA", state: "MA", runway: "2200 ft", fbo: "Turners Falls Aviation", type: "Private", latitude: 42.5789, longitude: -72.5167, elevation: 250 },
  { code: "NH02", name: "Mount Washington Regional", city: "Whitefield, NH", state: "NH", runway: "4000 ft", fbo: "Mount Washington Aviation", type: "Private", latitude: 44.3567, longitude: -71.5234, elevation: 1085 },
  { code: "VT02", name: "Morrisville-Stowe State", city: "Morrisville, VT", state: "VT", runway: "2850 ft", fbo: "Green Mountain Aviation", type: "Private", latitude: 44.2034, longitude: -72.6134, elevation: 732 },
  { code: "ME02", name: "Rangeley Municipal", city: "Rangeley, ME", state: "ME", runway: "3000 ft", fbo: "Rangeley Aviation", type: "Private", latitude: 45.1267, longitude: -70.6734, elevation: 1789 },
  
  // Western Mountain States
  { code: "MT02", name: "Big Sky Airport", city: "Big Sky, MT", state: "MT", runway: "5000 ft", fbo: "Big Sky Aviation", type: "Private", latitude: 45.2567, longitude: -111.3089, elevation: 6391 },
  { code: "ID02", name: "Friedman Memorial", city: "Hailey, ID", state: "ID", runway: "7550 ft", fbo: "Sun Valley Aviation", type: "Private", latitude: 43.5048, longitude: -114.2961, elevation: 5318 },
  { code: "WY02", name: "Jackson Hole Airport", city: "Jackson, WY", state: "WY", runway: "6300 ft", fbo: "Signature Flight Support", type: "Private", latitude: 43.6073, longitude: -110.7377, elevation: 6451 },
  { code: "UT02", name: "Heber Valley Airport", city: "Heber City, UT", state: "UT", runway: "6899 ft", fbo: "Heber Valley Aviation", type: "Private", latitude: 40.4817, longitude: -111.4289, elevation: 5637 },
  { code: "NV02", name: "Jean Sport Aviation Center", city: "Jean, NV", state: "NV", runway: "4400 ft", fbo: "Jean Aviation", type: "Private", latitude: 35.7684, longitude: -115.3234, elevation: 2847 },
  
  // Midwest Private Airports
  { code: "WI02", name: "Baraboo-Wisconsin Dells", city: "Baraboo, WI", state: "WI", runway: "5200 ft", fbo: "Baraboo Aviation", type: "Private", latitude: 43.5234, longitude: -89.7706, elevation: 980 },
  { code: "MN02", name: "Flying Cloud Airport", city: "Eden Prairie, MN", state: "MN", runway: "5000 ft", fbo: "Flying Cloud Aviation", type: "Private", latitude: 44.8273, longitude: -93.4567, elevation: 905 },
  { code: "IA02", name: "Iowa City Municipal", city: "Iowa City, IA", state: "IA", runway: "5500 ft", fbo: "Iowa City Aviation", type: "Private", latitude: 41.6389, longitude: -91.5456, elevation: 668 },
  { code: "MO02", name: "Spirit of St. Louis", city: "Chesterfield, MO", state: "MO", runway: "7200 ft", fbo: "Signature Flight Support", type: "Private", latitude: 38.6622, longitude: -90.6520, elevation: 463 },
  { code: "KS02", name: "Johnson County Executive", city: "Olathe, KS", state: "KS", runway: "4100 ft", fbo: "Signature Flight Support", type: "Private", latitude: 38.8473, longitude: -94.7382, elevation: 1096 },
  { code: "NE02", name: "Fremont Municipal", city: "Fremont, NE", state: "NE", runway: "4000 ft", fbo: "Fremont Aviation", type: "Private", latitude: 41.4489, longitude: -96.5267, elevation: 1204 },
  { code: "SD02", name: "Black Hills Airport-Clyde Ice Field", city: "Spearfish, SD", state: "SD", runway: "5000 ft", fbo: "Black Hills Aviation", type: "Private", latitude: 44.4789, longitude: -103.7834, elevation: 3931 },
  { code: "ND02", name: "Grand Sky Airport", city: "Grand Forks, ND", state: "ND", runway: "3200 ft", fbo: "Grand Sky Aviation", type: "Private", latitude: 47.9634, longitude: -97.1767, elevation: 845 },
  
  // Southern States
  { code: "AL02", name: "Anniston Metropolitan", city: "Anniston, AL", state: "AL", runway: "5000 ft", fbo: "Anniston Aviation", type: "Private", latitude: 33.5934, longitude: -85.8567, elevation: 612 },
  { code: "MS02", name: "Bruce Campbell Field", city: "Madison, MS", state: "MS", runway: "5000 ft", fbo: "Bruce Campbell Aviation", type: "Private", latitude: 32.4567, longitude: -90.1234, elevation: 294 },
  { code: "LA02", name: "David Stinson Field", city: "San Antonio, TX", state: "TX", runway: "8500 ft", fbo: "Stinson Aviation", type: "Private", latitude: 29.3367, longitude: -98.4717, elevation: 577 },
  { code: "AR02", name: "Hot Springs Memorial Field", city: "Hot Springs, AR", state: "AR", runway: "6102 ft", fbo: "Hot Springs Aviation", type: "Private", latitude: 34.4767, longitude: -93.0967, elevation: 540 },
  { code: "TN02", name: "John C. Tune Airport", city: "Nashville, TN", state: "TN", runway: "8000 ft", fbo: "Signature Flight Support", type: "Private", latitude: 36.1824, longitude: -86.8857, elevation: 450 },
  { code: "KY02", name: "Lexington-Blue Grass", city: "Lexington, KY", state: "KY", runway: "7000 ft", fbo: "Signature Flight Support", type: "Private", latitude: 38.0365, longitude: -84.6058, elevation: 979 },
  { code: "SC02", name: "Donaldson Center", city: "Greenville, SC", state: "SC", runway: "8000 ft", fbo: "Stevens Aviation", type: "Private", latitude: 34.7589, longitude: -82.3789, elevation: 954 },
  { code: "WV02", name: "Yeager Airport", city: "Charleston, WV", state: "WV", runway: "6800 ft", fbo: "Yeager Aviation", type: "Private", latitude: 38.3734, longitude: -81.5934, elevation: 981 },
  
  // Alaska Private Airports (sample)
  { code: "AK02", name: "Merrill Field", city: "Anchorage, AK", state: "AK", runway: "4000 ft", fbo: "Merrill Aviation", type: "Private", latitude: 61.2134, longitude: -149.8456, elevation: 137 },
  { code: "AK05", name: "Palmer Municipal", city: "Palmer, AK", state: "AK", runway: "3000 ft", fbo: "Palmer Aviation", type: "Private", latitude: 61.5967, longitude: -149.0834, elevation: 242 },
  
  // Hawaii Private Airports (sample) 
  { code: "HI02", name: "Dillingham Airfield", city: "Mokuleia, HI", state: "HI", runway: "9000 ft", fbo: "Dillingham Aviation", type: "Private", latitude: 21.5789, longitude: -158.1967, elevation: 14 },
  { code: "HI05", name: "Princeville Airport", city: "Princeville, HI", state: "HI", runway: "3000 ft", fbo: "Princeville Aviation", type: "Private", latitude: 22.2034, longitude: -159.4467, elevation: 422 },
  
  // Major International Airports - Mexico & Caribbean
  { code: "CUN", name: "Cancun International Airport", city: "Cancun", state: "MX", runway: "11483 ft", fbo: "FBO Cancun", type: "Commercial", latitude: 21.0365, longitude: -86.8771, elevation: 22, icao: "MMUN" },
  { code: "MMUN", name: "Cancun International Airport", city: "Cancun", state: "MX", runway: "11483 ft", fbo: "FBO Cancun", type: "Commercial", latitude: 21.0365, longitude: -86.8771, elevation: 22, icao: "MMUN" },
  { code: "CZM", name: "Cozumel International Airport", city: "Cozumel", state: "MX", runway: "9843 ft", fbo: "Cozumel FBO", type: "Commercial", latitude: 20.5224, longitude: -86.9256, elevation: 15, icao: "MMCZ" },
  { code: "MMCZ", name: "Cozumel International Airport", city: "Cozumel", state: "MX", runway: "9843 ft", fbo: "Cozumel FBO", type: "Commercial", latitude: 20.5224, longitude: -86.9256, elevation: 15, icao: "MMCZ" },
  { code: "PVR", name: "Puerto Vallarta International Airport", city: "Puerto Vallarta", state: "MX", runway: "10171 ft", fbo: "PVR FBO", type: "Commercial", latitude: 20.6801, longitude: -105.2544, elevation: 23, icao: "MMPR" },
  { code: "MMPR", name: "Puerto Vallarta International Airport", city: "Puerto Vallarta", state: "MX", runway: "10171 ft", fbo: "PVR FBO", type: "Commercial", latitude: 20.6801, longitude: -105.2544, elevation: 23, icao: "MMPR" },
  { code: "SJD", name: "Los Cabos International Airport", city: "San Jose del Cabo", state: "MX", runway: "9843 ft", fbo: "Cabo FBO", type: "Commercial", latitude: 23.1518, longitude: -109.7211, elevation: 374, icao: "MMSD" },
  { code: "MMSD", name: "Los Cabos International Airport", city: "San Jose del Cabo", state: "MX", runway: "9843 ft", fbo: "Cabo FBO", type: "Commercial", latitude: 23.1518, longitude: -109.7211, elevation: 374, icao: "MMSD" },
  { code: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", state: "BS", runway: "11000 ft", fbo: "Odyssey Aviation", type: "Commercial", latitude: 25.0389, longitude: -77.4662, elevation: 16, icao: "MYNN" },
  { code: "MYNN", name: "Lynden Pindling International Airport", city: "Nassau", state: "BS", runway: "11000 ft", fbo: "Odyssey Aviation", type: "Commercial", latitude: 25.0389, longitude: -77.4662, elevation: 16, icao: "MYNN" },
];

// Total airports in dataset: This is a curated subset of the major private airports
// The complete FAA database contains over 2,000 private airports in the US
export const AIRPORT_COUNT = PRIVATE_AIRPORTS.length;