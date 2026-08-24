/**
 * Appariement géographique des groupes.
 *
 * Deux sources de position possibles :
 *  1. la géolocalisation du navigateur (précise, jamais transmise ailleurs
 *     qu'au profil de l'utilisateur, arrondie au centième de degré ≈ 1 km) ;
 *  2. la recherche manuelle d'une ville dans l'annuaire embarqué ci-dessous.
 *
 * Les coordonnées de l'annuaire sont celles du centre-ville, à quelques
 * centaines de mètres près : largement suffisant pour trier des groupes
 * du plus proche au plus lointain.
 */

import type { GeoPoint, PlaceRef } from './types';

type CityRow = [city: string, region: string, countryCode: string, lat: number, lng: number];

const COUNTRIES: Record<string, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  LU: 'Luxembourg',
  CA: 'Canada',
  CI: "Côte d'Ivoire",
  SN: 'Sénégal',
  ML: 'Mali',
  BF: 'Burkina Faso',
  TG: 'Togo',
  BJ: 'Bénin',
  NE: 'Niger',
  GN: 'Guinée',
  MR: 'Mauritanie',
  CM: 'Cameroun',
  GA: 'Gabon',
  CG: 'Congo',
  CD: 'RD Congo',
  CF: 'Centrafrique',
  TD: 'Tchad',
  MG: 'Madagascar',
  MU: 'Maurice',
  KM: 'Comores',
  SC: 'Seychelles',
  RW: 'Rwanda',
  BI: 'Burundi',
  DJ: 'Djibouti',
  TN: 'Tunisie',
  DZ: 'Algérie',
  MA: 'Maroc',
  HT: 'Haïti',
  GB: 'Royaume-Uni',
  ES: 'Espagne',
  PT: 'Portugal',
  IT: 'Italie',
  DE: 'Allemagne',
  NL: 'Pays-Bas',
  AT: 'Autriche',
  US: 'États-Unis',
  LB: 'Liban',
  NC: 'Nouvelle-Calédonie',
  PF: 'Polynésie française',
};

const CITIES: CityRow[] = [
  // ── France métropolitaine
  ['Paris', 'Île-de-France', 'FR', 48.8566, 2.3522],
  ['Marseille', "Provence-Alpes-Côte d'Azur", 'FR', 43.2965, 5.3698],
  ['Lyon', 'Auvergne-Rhône-Alpes', 'FR', 45.764, 4.8357],
  ['Toulouse', 'Occitanie', 'FR', 43.6047, 1.4442],
  ['Nice', "Provence-Alpes-Côte d'Azur", 'FR', 43.7102, 7.262],
  ['Nantes', 'Pays de la Loire', 'FR', 47.2184, -1.5536],
  ['Montpellier', 'Occitanie', 'FR', 43.6108, 3.8767],
  ['Strasbourg', 'Grand Est', 'FR', 48.5734, 7.7521],
  ['Bordeaux', 'Nouvelle-Aquitaine', 'FR', 44.8378, -0.5792],
  ['Lille', 'Hauts-de-France', 'FR', 50.6292, 3.0573],
  ['Rennes', 'Bretagne', 'FR', 48.1173, -1.6778],
  ['Reims', 'Grand Est', 'FR', 49.2583, 4.0317],
  ['Saint-Étienne', 'Auvergne-Rhône-Alpes', 'FR', 45.4397, 4.3872],
  ['Toulon', "Provence-Alpes-Côte d'Azur", 'FR', 43.1242, 5.928],
  ['Le Havre', 'Normandie', 'FR', 49.4944, 0.1079],
  ['Grenoble', 'Auvergne-Rhône-Alpes', 'FR', 45.1885, 5.7245],
  ['Dijon', 'Bourgogne-Franche-Comté', 'FR', 47.322, 5.0415],
  ['Angers', 'Pays de la Loire', 'FR', 47.4784, -0.5632],
  ['Nîmes', 'Occitanie', 'FR', 43.8367, 4.3601],
  ['Villeurbanne', 'Auvergne-Rhône-Alpes', 'FR', 45.7719, 4.8902],
  ['Clermont-Ferrand', 'Auvergne-Rhône-Alpes', 'FR', 45.7772, 3.087],
  ['Le Mans', 'Pays de la Loire', 'FR', 48.0061, 0.1996],
  ['Aix-en-Provence', "Provence-Alpes-Côte d'Azur", 'FR', 43.5297, 5.4474],
  ['Brest', 'Bretagne', 'FR', 48.3904, -4.4861],
  ['Tours', 'Centre-Val de Loire', 'FR', 47.3941, 0.6848],
  ['Amiens', 'Hauts-de-France', 'FR', 49.8941, 2.2958],
  ['Limoges', 'Nouvelle-Aquitaine', 'FR', 45.8336, 1.2611],
  ['Annecy', 'Auvergne-Rhône-Alpes', 'FR', 45.8992, 6.1294],
  ['Perpignan', 'Occitanie', 'FR', 42.6887, 2.8948],
  ['Boulogne-Billancourt', 'Île-de-France', 'FR', 48.8352, 2.2409],
  ['Metz', 'Grand Est', 'FR', 49.1193, 6.1757],
  ['Besançon', 'Bourgogne-Franche-Comté', 'FR', 47.2378, 6.0241],
  ['Orléans', 'Centre-Val de Loire', 'FR', 47.9029, 1.9093],
  ['Saint-Denis', 'Île-de-France', 'FR', 48.9362, 2.3574],
  ['Rouen', 'Normandie', 'FR', 49.4432, 1.0999],
  ['Argenteuil', 'Île-de-France', 'FR', 48.9474, 2.2482],
  ['Mulhouse', 'Grand Est', 'FR', 47.7508, 7.3359],
  ['Montreuil', 'Île-de-France', 'FR', 48.8638, 2.4485],
  ['Caen', 'Normandie', 'FR', 49.1829, -0.3707],
  ['Nancy', 'Grand Est', 'FR', 48.6921, 6.1844],
  ['Tourcoing', 'Hauts-de-France', 'FR', 50.7236, 3.1611],
  ['Roubaix', 'Hauts-de-France', 'FR', 50.6942, 3.1746],
  ['Nanterre', 'Île-de-France', 'FR', 48.8924, 2.2069],
  ['Vitry-sur-Seine', 'Île-de-France', 'FR', 48.7875, 2.3928],
  ['Créteil', 'Île-de-France', 'FR', 48.7904, 2.4556],
  ['Versailles', 'Île-de-France', 'FR', 48.8014, 2.1301],
  ['Colombes', 'Île-de-France', 'FR', 48.9236, 2.2522],
  ['Asnières-sur-Seine', 'Île-de-France', 'FR', 48.9159, 2.2854],
  ['Aulnay-sous-Bois', 'Île-de-France', 'FR', 48.9386, 2.4939],
  ['Courbevoie', 'Île-de-France', 'FR', 48.8968, 2.2565],
  ['Aubervilliers', 'Île-de-France', 'FR', 48.9146, 2.3822],
  ['Avignon', "Provence-Alpes-Côte d'Azur", 'FR', 43.9493, 4.8055],
  ['Poitiers', 'Nouvelle-Aquitaine', 'FR', 46.5802, 0.3404],
  ['Dunkerque', 'Hauts-de-France', 'FR', 51.0343, 2.3768],
  ['Pau', 'Nouvelle-Aquitaine', 'FR', 43.2951, -0.3708],
  ['Bayonne', 'Nouvelle-Aquitaine', 'FR', 43.4929, -1.4748],
  ['La Rochelle', 'Nouvelle-Aquitaine', 'FR', 46.1591, -1.152],
  ['Chambéry', 'Auvergne-Rhône-Alpes', 'FR', 45.5646, 5.9178],
  ['Valence', 'Auvergne-Rhône-Alpes', 'FR', 44.9334, 4.8924],
  ['Troyes', 'Grand Est', 'FR', 48.2973, 4.0744],
  ['Lorient', 'Bretagne', 'FR', 47.7477, -3.3702],
  ['Saint-Nazaire', 'Pays de la Loire', 'FR', 47.2733, -2.2134],
  ['Colmar', 'Grand Est', 'FR', 48.0794, 7.3585],
  ['Quimper', 'Bretagne', 'FR', 47.996, -4.1024],
  ['Vannes', 'Bretagne', 'FR', 47.6582, -2.7608],
  ['Béziers', 'Occitanie', 'FR', 43.3442, 3.2158],
  ['Ajaccio', 'Corse', 'FR', 41.9192, 8.7386],
  ['Bastia', 'Corse', 'FR', 42.7028, 9.4508],
  ['Cannes', "Provence-Alpes-Côte d'Azur", 'FR', 43.5528, 7.0174],
  ['Antibes', "Provence-Alpes-Côte d'Azur", 'FR', 43.5808, 7.1251],
  ['Chartres', 'Centre-Val de Loire', 'FR', 48.4439, 1.4893],
  ['Belfort', 'Bourgogne-Franche-Comté', 'FR', 47.6379, 6.8628],
  ['Cholet', 'Pays de la Loire', 'FR', 47.0592, -0.8791],
  ['Niort', 'Nouvelle-Aquitaine', 'FR', 46.3239, -0.4645],
  ['Évreux', 'Normandie', 'FR', 49.027, 1.1508],
  ['Bourges', 'Centre-Val de Loire', 'FR', 47.081, 2.3988],
  ['Angoulême', 'Nouvelle-Aquitaine', 'FR', 45.6484, 0.1563],
  ['Laval', 'Pays de la Loire', 'FR', 48.0698, -0.7669],
  ['Albi', 'Occitanie', 'FR', 43.9298, 2.148],
  ['Tarbes', 'Occitanie', 'FR', 43.2328, 0.0781],
  ['Blois', 'Centre-Val de Loire', 'FR', 47.586, 1.3359],
  ['Montauban', 'Occitanie', 'FR', 44.0221, 1.3529],
  ['Carcassonne', 'Occitanie', 'FR', 43.213, 2.3491],
  ['Arras', 'Hauts-de-France', 'FR', 50.291, 2.7772],
  ['Compiègne', 'Hauts-de-France', 'FR', 49.4179, 2.8261],
  ['Melun', 'Île-de-France', 'FR', 48.5392, 2.6602],
  ['Meaux', 'Île-de-France', 'FR', 48.9603, 2.8783],
  ['Saint-Malo', 'Bretagne', 'FR', 48.6493, -2.0257],
  ['Cherbourg', 'Normandie', 'FR', 49.6386, -1.6164],
  ['Épinal', 'Grand Est', 'FR', 48.1744, 6.4494],
  ['Charleville-Mézières', 'Grand Est', 'FR', 49.7728, 4.7161],
  ['Auxerre', 'Bourgogne-Franche-Comté', 'FR', 47.7982, 3.5731],
  ['Nevers', 'Bourgogne-Franche-Comté', 'FR', 46.9896, 3.159],
  ['Roanne', 'Auvergne-Rhône-Alpes', 'FR', 46.0367, 4.068],
  ['Vichy', 'Auvergne-Rhône-Alpes', 'FR', 46.1278, 3.4266],
  ['Aurillac', 'Auvergne-Rhône-Alpes', 'FR', 44.926, 2.4402],
  ['Rodez', 'Occitanie', 'FR', 44.3506, 2.573],
  ['Agen', 'Nouvelle-Aquitaine', 'FR', 44.2029, 0.6167],
  ['Périgueux', 'Nouvelle-Aquitaine', 'FR', 45.184, 0.7211],
  ['Brive-la-Gaillarde', 'Nouvelle-Aquitaine', 'FR', 45.159, 1.533],
  ['Châteauroux', 'Centre-Val de Loire', 'FR', 46.8103, 1.6911],
  ['Le Puy-en-Velay', 'Auvergne-Rhône-Alpes', 'FR', 45.0428, 3.8853],
  ['Gap', "Provence-Alpes-Côte d'Azur", 'FR', 44.559, 6.0797],
  ['Draguignan', "Provence-Alpes-Côte d'Azur", 'FR', 43.5391, 6.4665],
  ['Fréjus', "Provence-Alpes-Côte d'Azur", 'FR', 43.4332, 6.737],
  ['Menton', "Provence-Alpes-Côte d'Azur", 'FR', 43.7765, 7.5],
  ['Thonon-les-Bains', 'Auvergne-Rhône-Alpes', 'FR', 46.3717, 6.4794],
  ['Saint-Brieuc', 'Bretagne', 'FR', 48.5144, -2.7653],
  ['Beauvais', 'Hauts-de-France', 'FR', 49.4295, 2.081],
  ['Soissons', 'Hauts-de-France', 'FR', 49.3817, 3.3239],
  ['Saint-Quentin', 'Hauts-de-France', 'FR', 49.8479, 3.287],
  ['Douai', 'Hauts-de-France', 'FR', 50.3714, 3.08],
  ['Valenciennes', 'Hauts-de-France', 'FR', 50.358, 3.5233],
  ['Calais', 'Hauts-de-France', 'FR', 50.9513, 1.8587],
  ['Boulogne-sur-Mer', 'Hauts-de-France', 'FR', 50.7264, 1.6139],
  ['Lens', 'Hauts-de-France', 'FR', 50.4292, 2.8318],
  ['Béthune', 'Hauts-de-France', 'FR', 50.5305, 2.6407],
  ['Cambrai', 'Hauts-de-France', 'FR', 50.1758, 3.235],
  ['Maubeuge', 'Hauts-de-France', 'FR', 50.2775, 3.9724],
  // ── France d'outre-mer
  ['Fort-de-France', 'Martinique', 'FR', 14.6161, -61.0588],
  ['Pointe-à-Pitre', 'Guadeloupe', 'FR', 16.2411, -61.533],
  ['Saint-Denis', 'La Réunion', 'FR', -20.8823, 55.4504],
  ['Saint-Pierre', 'La Réunion', 'FR', -21.3393, 55.4781],
  ['Cayenne', 'Guyane', 'FR', 4.9227, -52.3269],
  ['Mamoudzou', 'Mayotte', 'FR', -12.7806, 45.2278],
  ['Nouméa', '', 'NC', -22.2758, 166.458],
  ['Papeete', '', 'PF', -17.5516, -149.5585],
  // ── Belgique
  ['Bruxelles', '', 'BE', 50.8503, 4.3517],
  ['Anvers', '', 'BE', 51.2194, 4.4025],
  ['Gand', '', 'BE', 51.0543, 3.7174],
  ['Charleroi', '', 'BE', 50.4108, 4.4446],
  ['Liège', '', 'BE', 50.6326, 5.5797],
  ['Bruges', '', 'BE', 51.2093, 3.2247],
  ['Namur', '', 'BE', 50.4674, 4.872],
  ['Louvain', '', 'BE', 50.8798, 4.7005],
  ['Mons', '', 'BE', 50.4542, 3.9563],
  ['Tournai', '', 'BE', 50.6071, 3.3891],
  ['Arlon', '', 'BE', 49.6833, 5.8167],
  // ── Suisse
  ['Genève', '', 'CH', 46.2044, 6.1432],
  ['Lausanne', '', 'CH', 46.5197, 6.6323],
  ['Zurich', '', 'CH', 47.3769, 8.5417],
  ['Berne', '', 'CH', 46.948, 7.4474],
  ['Neuchâtel', '', 'CH', 46.993, 6.931],
  ['Fribourg', '', 'CH', 46.8065, 7.1615],
  ['Sion', '', 'CH', 46.2331, 7.3606],
  ['Montreux', '', 'CH', 46.4312, 6.9107],
  ['Yverdon-les-Bains', '', 'CH', 46.7785, 6.641],
  ['Bâle', '', 'CH', 47.5596, 7.5886],
  ['La Chaux-de-Fonds', '', 'CH', 47.1039, 6.825],
  ['Luxembourg', '', 'LU', 49.6116, 6.1319],
  // ── Canada
  ['Montréal', 'Québec', 'CA', 45.5019, -73.5674],
  ['Québec', 'Québec', 'CA', 46.8139, -71.208],
  ['Laval', 'Québec', 'CA', 45.6066, -73.7124],
  ['Gatineau', 'Québec', 'CA', 45.4765, -75.7013],
  ['Sherbrooke', 'Québec', 'CA', 45.4042, -71.8929],
  ['Trois-Rivières', 'Québec', 'CA', 46.3432, -72.5432],
  ['Longueuil', 'Québec', 'CA', 45.5312, -73.5185],
  ['Ottawa', 'Ontario', 'CA', 45.4215, -75.6972],
  ['Toronto', 'Ontario', 'CA', 43.6532, -79.3832],
  ['Moncton', 'Nouveau-Brunswick', 'CA', 46.0878, -64.7782],
  // ── Afrique francophone
  ['Abidjan', '', 'CI', 5.36, -4.0083],
  ['Yamoussoukro', '', 'CI', 6.8276, -5.2893],
  ['Bouaké', '', 'CI', 7.6906, -5.0304],
  ['Dakar', '', 'SN', 14.7167, -17.4677],
  ['Thiès', '', 'SN', 14.7886, -16.926],
  ['Saint-Louis', '', 'SN', 16.0179, -16.4896],
  ['Bamako', '', 'ML', 12.6392, -8.0029],
  ['Ouagadougou', '', 'BF', 12.3714, -1.5197],
  ['Bobo-Dioulasso', '', 'BF', 11.1771, -4.2979],
  ['Lomé', '', 'TG', 6.1319, 1.2228],
  ['Cotonou', '', 'BJ', 6.3703, 2.3912],
  ['Porto-Novo', '', 'BJ', 6.4969, 2.6289],
  ['Niamey', '', 'NE', 13.5116, 2.1254],
  ['Conakry', '', 'GN', 9.6412, -13.5784],
  ['Nouakchott', '', 'MR', 18.0735, -15.9582],
  ['Yaoundé', '', 'CM', 3.848, 11.5021],
  ['Douala', '', 'CM', 4.0511, 9.7679],
  ['Bafoussam', '', 'CM', 5.4737, 10.4179],
  ['Libreville', '', 'GA', 0.4162, 9.4673],
  ['Brazzaville', '', 'CG', -4.2634, 15.2429],
  ['Pointe-Noire', '', 'CG', -4.7761, 11.8635],
  ['Kinshasa', '', 'CD', -4.4419, 15.2663],
  ['Lubumbashi', '', 'CD', -11.6876, 27.5026],
  ['Goma', '', 'CD', -1.6777, 29.2285],
  ['Bukavu', '', 'CD', -2.5083, 28.8608],
  ['Kisangani', '', 'CD', 0.5153, 25.1911],
  ['Bangui', '', 'CF', 4.3947, 18.5582],
  ["N'Djaména", '', 'TD', 12.1348, 15.0557],
  ['Antananarivo', '', 'MG', -18.8792, 47.5079],
  ['Port-Louis', '', 'MU', -20.1609, 57.5012],
  ['Moroni', '', 'KM', -11.7172, 43.2473],
  ['Victoria', '', 'SC', -4.6191, 55.4513],
  ['Kigali', '', 'RW', -1.9441, 30.0619],
  ['Bujumbura', '', 'BI', -3.3614, 29.3599],
  ['Djibouti', '', 'DJ', 11.5721, 43.1456],
  ['Tunis', '', 'TN', 36.8065, 10.1815],
  ['Alger', '', 'DZ', 36.7538, 3.0588],
  ['Oran', '', 'DZ', 35.6971, -0.6308],
  ['Casablanca', '', 'MA', 33.5731, -7.5898],
  ['Rabat', '', 'MA', 34.0209, -6.8416],
  ['Marrakech', '', 'MA', 31.6295, -7.9811],
  // ── Amériques & reste du monde
  ['Port-au-Prince', '', 'HT', 18.5944, -72.3074],
  ['Cap-Haïtien', '', 'HT', 19.7594, -72.1985],
  ['Londres', '', 'GB', 51.5074, -0.1278],
  ['Madrid', '', 'ES', 40.4168, -3.7038],
  ['Barcelone', '', 'ES', 41.3851, 2.1734],
  ['Lisbonne', '', 'PT', 38.7223, -9.1393],
  ['Rome', '', 'IT', 41.9028, 12.4964],
  ['Milan', '', 'IT', 45.4642, 9.19],
  ['Berlin', '', 'DE', 52.52, 13.405],
  ['Francfort', '', 'DE', 50.1109, 8.6821],
  ['Amsterdam', '', 'NL', 52.3676, 4.9041],
  ['Vienne', '', 'AT', 48.2082, 16.3738],
  ['New York', '', 'US', 40.7128, -74.006],
  ['Miami', '', 'US', 25.7617, -80.1918],
  ['Beyrouth', '', 'LB', 33.8938, 35.5018],
];

// ─────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distance orthodromique en kilomètres entre deux points. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** « 3 km », « 42 km », « 1 250 km » — ou « à distance » si inconnu. */
export function formatDistance(km: number | null): string {
  if (km === null || Number.isNaN(km)) return 'Distance inconnue';
  if (km < 1) return "moins d'1 km";
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  if (km < 1000) return `${Math.round(km)} km`;
  return `${Math.round(km).toLocaleString('fr-FR')} km`;
}

/** Qualifie la proximité pour l'affichage : couleur + libellé. */
export function proximityBand(km: number | null): {
  label: string;
  tone: 'proche' | 'ville' | 'region' | 'lointain' | 'inconnu';
} {
  if (km === null) return { label: 'Distance inconnue', tone: 'inconnu' };
  if (km <= 5) return { label: 'Dans votre quartier', tone: 'proche' };
  if (km <= 25) return { label: 'Dans votre ville', tone: 'ville' };
  if (km <= 120) return { label: 'Dans votre région', tone: 'region' };
  return { label: 'À distance — rencontres en ligne', tone: 'lointain' };
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’\-\s]+/g, ' ')
    .trim();

export function countryName(code: string): string {
  return COUNTRIES[code] ?? code;
}

function toPlace(row: CityRow): PlaceRef {
  const [city, region, countryCode, lat, lng] = row;
  const country = countryName(countryCode);
  const label = region && region !== city ? `${city}, ${region}` : `${city}, ${country}`;
  return { label, city, region: region || undefined, country, countryCode, lat, lng };
}

/** Toutes les villes de l'annuaire, ordre alphabétique. */
export const allPlaces: PlaceRef[] = CITIES.map(toPlace).sort((a, b) =>
  a.city.localeCompare(b.city, 'fr')
);

/**
 * Recherche d'une ville. Insensible aux accents, à la casse et aux traits
 * d'union : « st etienne » trouve « Saint-Étienne ».
 */
export function searchPlaces(query: string, limit = 8): PlaceRef[] {
  const q = normalize(query).replace(/^st /, 'saint ');
  if (q.length < 2) return [];
  const scored: { place: PlaceRef; score: number }[] = [];

  for (const place of allPlaces) {
    const city = normalize(place.city);
    const haystack = `${city} ${normalize(place.region ?? '')} ${normalize(place.country)}`;
    let score = -1;
    if (city === q) score = 0;
    else if (city.startsWith(q)) score = 1;
    else if (city.includes(q)) score = 2;
    else if (haystack.includes(q)) score = 3;
    if (score >= 0) scored.push({ place, score });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.place.city.localeCompare(b.place.city, 'fr'))
    .slice(0, limit)
    .map((entry) => entry.place);
}

/** Ville connue la plus proche d'un point — sert au reverse-geocoding local. */
export function nearestPlace(point: GeoPoint): { place: PlaceRef; distanceKm: number } {
  let best = allPlaces[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const place of allPlaces) {
    const d = distanceKm(point, place);
    if (d < bestDistance) {
      bestDistance = d;
      best = place;
    }
  }
  return { place: best, distanceKm: bestDistance };
}

export class GeolocationRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeolocationRefused';
  }
}

/**
 * Demande la position au navigateur, puis la rattache à la ville connue la
 * plus proche. Les coordonnées conservées sont arrondies à 2 décimales
 * (~1 km) : assez précis pour trier des groupes, trop grossier pour situer
 * un domicile.
 */
export function locateMe(): Promise<PlaceRef> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeolocationRefused("Votre navigateur ne propose pas la géolocalisation."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Math.round(position.coords.latitude * 100) / 100;
        const lng = Math.round(position.coords.longitude * 100) / 100;
        const { place } = nearestPlace({ lat, lng });
        resolve({
          ...place,
          lat,
          lng,
          label: `Près de ${place.city}`,
          precise: true,
        });
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Vous avez refusé le partage de position. Choisissez votre ville dans la liste, cela fonctionne aussi bien.",
          2: "Position indisponible pour le moment. Choisissez votre ville dans la liste.",
          3: "La localisation a mis trop de temps. Choisissez votre ville dans la liste.",
        };
        reject(new GeolocationRefused(messages[error.code] ?? 'Localisation impossible.'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
}
