"use client";

import { IconPrint } from "@/components/Icons";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary !py-2.5 text-sm">
      <IconPrint width={16} height={16} /> {label}
    </button>
  );
}
