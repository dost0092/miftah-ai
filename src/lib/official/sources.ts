/**
 * Official sources the advisor is allowed to rely on.
 * Pure data (no imports) so `scripts/db-setup.mts` can load it with Node and seed the
 * `official_sources` table. The app reads the table and falls back to this file.
 */

export type SourceKind = "regulator" | "ministry" | "platform" | "gazette" | "open-data";

export interface OfficialSource {
  id: string;
  name: string;
  nameAr: string;
  publisher: string;
  url: string;
  kind: SourceKind;
  description: string;
}

export const officialSources: OfficialSource[] = [
  {
    id: "rega",
    name: "Real Estate General Authority (REGA)",
    nameAr: "الهيئة العامة للعقار",
    publisher: "Real Estate General Authority",
    url: "https://rega.gov.sa/en",
    kind: "regulator",
    description: "Regulator of the Saudi real estate sector: foreign ownership zones, brokerage licensing (FAL), off-plan sales (Wafi), owners' associations and the Real Estate Registry.",
  },
  {
    id: "saudi-properties",
    name: "Saudi Properties portal (REGA)",
    nameAr: "منصة عقارات السعودية",
    publisher: "Real Estate General Authority",
    url: "https://saudiproperties.rega.gov.sa",
    kind: "platform",
    description: "REGA's official portal for property ownership by non-Saudis: applications, eligibility checks and the designated zone map.",
  },
  {
    id: "misa",
    name: "Ministry of Investment (Invest Saudi)",
    nameAr: "وزارة الاستثمار",
    publisher: "Ministry of Investment",
    url: "https://misa.gov.sa/en",
    kind: "ministry",
    description: "Registration of foreign companies (Unified Number 700) before they can own property.",
  },
  {
    id: "rega-indicators",
    name: "REGA Real Estate Indicators",
    nameAr: "المؤشرات العقارية",
    publisher: "Real Estate General Authority",
    url: "https://rei.rega.gov.sa/en",
    kind: "open-data",
    description: "Official sales and rental indicators by city and district.",
  },
  {
    id: "moj",
    name: "Ministry of Justice (MOJ)",
    nameAr: "وزارة العدل",
    publisher: "Ministry of Justice",
    url: "https://www.moj.gov.sa/en",
    kind: "ministry",
    description: "Issues and transfers title deeds through notaries and the Najiz platform; publishes registered real estate transactions.",
  },
  {
    id: "moj-srem",
    name: "MOJ Real Estate Market Indicators",
    nameAr: "البورصة العقارية - وزارة العدل",
    publisher: "Ministry of Justice",
    url: "https://srem.moj.gov.sa",
    kind: "open-data",
    description: "Registered deed transactions by city, district, property type, area and price.",
  },
  {
    id: "najiz",
    name: "Najiz",
    nameAr: "ناجز",
    publisher: "Ministry of Justice",
    url: "https://najiz.sa",
    kind: "platform",
    description: "Electronic justice services, including title deed enquiries and electronic property transfer.",
  },
  {
    id: "zatca",
    name: "Zakat, Tax and Customs Authority (ZATCA)",
    nameAr: "هيئة الزكاة والضريبة والجمارك",
    publisher: "ZATCA",
    url: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/Real-Estate-Transaction-Tax.aspx",
    kind: "regulator",
    description: "Administers the Real Estate Transaction Tax (RETT) and VAT.",
  },
  {
    id: "ejar",
    name: "Ejar",
    nameAr: "إيجار",
    publisher: "Ejar network",
    url: "https://www.ejar.sa/en",
    kind: "platform",
    description: "National platform for registering residential and commercial lease contracts and paying rent.",
  },
  {
    id: "sapr",
    name: "Premium Residency Center",
    nameAr: "مركز الإقامة المميزة",
    publisher: "Premium Residency Center",
    url: "https://sapr.gov.sa/en",
    kind: "regulator",
    description: "Saudi Premium Residency products and the rights they grant, including property ownership.",
  },
  {
    id: "momah",
    name: "Ministry of Municipalities and Housing",
    nameAr: "وزارة البلديات والإسكان",
    publisher: "Ministry of Municipalities and Housing",
    url: "https://momah.gov.sa/en",
    kind: "ministry",
    description: "Housing policy, building permits (Balady), white land fees and urban planning.",
  },
  {
    id: "uqn",
    name: "Umm Al-Qura Gazette",
    nameAr: "جريدة أم القرى",
    publisher: "Official Gazette",
    url: "https://uqn.gov.sa",
    kind: "gazette",
    description: "Official gazette where laws and royal decrees are published.",
  },
  {
    id: "open-data",
    name: "National Open Data Portal",
    nameAr: "منصة البيانات المفتوحة",
    publisher: "Saudi Data & AI Authority",
    url: "https://open.data.gov.sa",
    kind: "open-data",
    description: "Official home of Saudi government open datasets, including MOJ transaction files.",
  },
];
