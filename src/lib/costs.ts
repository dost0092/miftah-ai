import { feeRules } from "./fees";

export type CostLine = { id: string; label: string; rate: number; base: "price" | "commission"; amount: number; url: string; note?: string };

const LABEL: Record<string, string> = {
  rett: "Real Estate Transaction Tax (RETT)",
  brokerage: "Brokerage commission",
  brokerageVat: "VAT on brokerage",
};
const NOTE: Record<string, string> = {
  rett: "Legally owed by the seller; buyer and seller may agree otherwise in the contract.",
  brokerage: "Default rate; can be agreed differently in a written brokerage contract.",
};

/** Purchase-side costs on top of the price, using the calculator's fee rules. */
export function buyCosts(price: number): { lines: CostLine[]; fees: number; total: number } {
  const brokerageRate = feeRules.find((r) => r.id === "brokerage")?.rate ?? 0;
  const lines: CostLine[] = feeRules
    .filter((r) => r.appliesTo !== "sell")
    .map((r) => {
      const base = r.id === "brokerageVat" ? "commission" : "price";
      const amount = base === "commission" ? price * brokerageRate * r.rate : price * r.rate;
      return { id: r.id, label: LABEL[r.id] ?? r.id, rate: r.rate, base, amount: Math.round(amount), url: r.source, note: NOTE[r.id] };
    });
  const fees = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, fees, total: price + fees };
}
