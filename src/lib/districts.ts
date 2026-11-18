/**
 * ILLUSTRATIVE SAMPLE DATA.
 * These numbers are placeholders generated for design/demo purposes only.
 * Replace with the output of the MOJ/REGA data pipeline (district_stats table in Supabase)
 * before launch. Foreign-ownership status is "unknown" for every district until it is
 * verified against official REGA publications.
 */

export type City = "riyadh" | "jeddah";
export type ZoneStatus = "yes" | "no" | "conditional" | "unknown";
export type PropertyType = "apartment" | "villa" | "land";

export interface District {
  slug: string;
  city: City;
  nameEn: string;
  nameAr: string;
  zone: ZoneStatus;
  /** median SAR / sqm by type, latest quarter */
  median: Record<PropertyType, number>;
  /** deals in latest quarter (all types) */
  deals: number;
  /** last 8 quarters median SAR/sqm for apartments, oldest first */
  trend: number[];
  /** approximate district centre [lat, lng] (OpenStreetMap), used for the map */
  center: [number, number];
}

export const QUARTERS = ["2024-Q4", "2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2", "2026-Q3"];
export const DATA_UNTIL = "2026-09-30";
export const IS_SAMPLE_DATA = true;

const raw: Array<[City, string, string, string, number, number]> = [
  // city, slug, nameEn, nameAr, base apartment SAR/sqm, deals
  ["riyadh", "al-malqa", "Al Malqa", "الملقا", 7400, 212],
  ["riyadh", "hittin", "Hittin", "حطين", 8100, 168],
  ["riyadh", "al-narjis", "Al Narjis", "النرجس", 6200, 305],
  ["riyadh", "al-yasmin", "Al Yasmin", "الياسمين", 6600, 276],
  ["riyadh", "al-sahafah", "Al Sahafah", "الصحافة", 6900, 141],
  ["riyadh", "al-aqiq", "Al Aqiq", "العقيق", 7900, 97],
  ["riyadh", "al-olaya", "Al Olaya", "العليا", 8600, 88],
  ["riyadh", "al-nakheel", "Al Nakheel", "النخيل", 7100, 74],
  ["riyadh", "al-rawdah", "Al Rawdah", "الروضة", 5200, 133],
  ["riyadh", "al-muruj", "Al Muruj", "المروج", 6400, 102],
  ["riyadh", "qurtubah", "Qurtubah", "قرطبة", 5600, 189],
  ["riyadh", "al-arid", "Al Arid", "العارض", 4900, 241],
  ["jeddah", "al-shati", "Al Shati", "الشاطئ", 8800, 64],
  ["jeddah", "al-zahra", "Al Zahra", "الزهراء", 6300, 158],
  ["jeddah", "al-rawdah-jeddah", "Al Rawdah", "الروضة", 5900, 121],
  ["jeddah", "obhur-al-shamaliyah", "Obhur Al Shamaliyah", "أبحر الشمالية", 6100, 187],
  ["jeddah", "al-hamra", "Al Hamra", "الحمراء", 7300, 52],
  ["jeddah", "al-salamah", "Al Salamah", "السلامة", 5700, 143],
  ["jeddah", "al-naeem", "Al Naeem", "النعيم", 6000, 96],
  ["jeddah", "al-murjan", "Al Murjan", "المرجان", 6800, 81],
  ["jeddah", "al-khalidiyah", "Al Khalidiyah", "الخالدية", 6500, 77],
  ["jeddah", "al-andalus", "Al Andalus", "الأندلس", 5400, 109],
];

/** Approximate district centres (OpenStreetMap). Boundaries come later from the GIS pipeline. */
export const DISTRICT_CENTERS: Record<string, [number, number]> = {
  "al-malqa": [24.8105, 46.6105],
  hittin: [24.7635, 46.6005],
  "al-narjis": [24.8635, 46.6655],
  "al-yasmin": [24.8255, 46.6455],
  "al-sahafah": [24.8015, 46.6355],
  "al-aqiq": [24.7735, 46.6255],
  "al-olaya": [24.6955, 46.6855],
  "al-nakheel": [24.7455, 46.6305],
  "al-rawdah": [24.7335, 46.7705],
  "al-muruj": [24.7555, 46.6605],
  qurtubah: [24.8105, 46.7405],
  "al-arid": [24.8805, 46.6205],
  "al-shati": [21.5905, 39.1105],
  "al-zahra": [21.6005, 39.1305],
  "al-rawdah-jeddah": [21.5605, 39.1505],
  "obhur-al-shamaliyah": [21.7705, 39.1105],
  "al-hamra": [21.5205, 39.1705],
  "al-salamah": [21.5905, 39.1505],
  "al-naeem": [21.6205, 39.1405],
  "al-murjan": [21.6805, 39.1105],
  "al-khalidiyah": [21.5605, 39.1305],
  "al-andalus": [21.5405, 39.1505],
};

// Deterministic pseudo-random so server and client render the same numbers.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const districts: District[] = raw.map(([city, slug, nameEn, nameAr, base, deals], i) => {
  const rand = seeded(i * 97 + 13);
  const drift = (rand() - 0.35) * 0.025; // per-quarter drift
  const trend: number[] = [];
  let v = base * (1 - drift * 7);
  for (let q = 0; q < 8; q++) {
    v = v * (1 + drift + (rand() - 0.5) * 0.02);
    trend.push(Math.round(v / 10) * 10);
  }
  const apt = trend[trend.length - 1];
  return {
    slug,
    city,
    nameEn,
    nameAr,
    zone: "unknown",
    median: {
      apartment: apt,
      villa: Math.round((apt * (0.78 + rand() * 0.12)) / 10) * 10,
      land: Math.round((apt * (0.42 + rand() * 0.18)) / 10) * 10,
    },
    deals,
    trend,
    center: DISTRICT_CENTERS[slug],
  };
});

export function getDistrict(slug: string) {
  return districts.find((d) => d.slug === slug);
}

export function trendChange(d: District) {
  const last = d.trend[d.trend.length - 1];
  const yearAgo = d.trend[d.trend.length - 5];
  return (last - yearAgo) / yearAgo;
}
