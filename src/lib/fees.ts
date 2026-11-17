/**
 * Fee model for the cost calculator.
 * Every rate is editable in the UI and must be re-verified against the official source
 * before launch. Not legal or tax advice.
 */
export interface FeeRule {
  id: "rett" | "brokerage" | "brokerageVat" | "disposal";
  rate: number; // fraction of price (brokerageVat is fraction of brokerage)
  appliesTo: "buy" | "sell" | "both";
  source: string;
}

export const feeRules: FeeRule[] = [
  { id: "rett", rate: 0.05, appliesTo: "both", source: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/Real-Estate-Transaction-Tax.aspx" },
  { id: "brokerage", rate: 0.025, appliesTo: "both", source: "https://rega.gov.sa/en" },
  { id: "brokerageVat", rate: 0.15, appliesTo: "both", source: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/default.aspx" },
  { id: "disposal", rate: 0.02, appliesTo: "sell", source: "https://gulfconstructiononline.com/Article/467296" },
];
