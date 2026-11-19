/**
 * Fee model for the cost calculator.
 * Every rate is editable in the UI and must be re-verified against the official source
 * before launch. Not legal or tax advice.
 *
 * rett          5% Real Estate Transaction Tax, ZATCA (in force since 4 Oct 2020)
 * brokerage     2.5% default under the Real Estate Brokerage Law unless agreed otherwise in writing
 * brokerageVat  15% VAT on the commission
 * disposal      2% REGA fee on a non-Saudi's disposal of property rights in Riyadh, Jeddah,
 *               Makkah and Madinah (Executive Regulations approved 23 June 2026)
 */
export interface FeeRule {
  id: "rett" | "brokerage" | "brokerageVat" | "disposal";
  rate: number; // fraction of price (brokerageVat is fraction of brokerage)
  appliesTo: "buy" | "sell" | "both";
  source: string;
}

/** Cities where the 2% non-Saudi disposal fee applies. */
export const DISPOSAL_FEE_CITIES = ["Riyadh", "Jeddah", "Makkah", "Madinah"] as const;
export const FEES_CHECKED = "2026-11-19";

export const feeRules: FeeRule[] = [
  { id: "rett", rate: 0.05, appliesTo: "both", source: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/Real-Estate-Transaction-Tax.aspx" },
  { id: "brokerage", rate: 0.025, appliesTo: "both", source: "https://rega.gov.sa/en" },
  { id: "brokerageVat", rate: 0.15, appliesTo: "both", source: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/default.aspx" },
  { id: "disposal", rate: 0.02, appliesTo: "sell", source: "https://saudiproperties.rega.gov.sa" },
];
