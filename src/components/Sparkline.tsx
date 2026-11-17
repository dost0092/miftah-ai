import { cn, numberLocale } from "@/lib/format";

export function Sparkline({ values, className, stroke = "#00804a", id }: { values: number[]; className?: string; stroke?: string; id: string }) {
  const w = 120, h = 36, pad = 3;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / (values.length - 1), h - pad - ((v - min) / span) * (h - pad * 2)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const gid = `sp-${id}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-28", className)} direction="ltr" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity=".22" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w - pad},${h} L${pad},${h} Z`} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={stroke} />
    </svg>
  );
}

/** Labelled trend chart for district pages. Pure SVG, server-rendered. */
export function TrendChart({ values, labels, locale, label }: { values: number[]; labels: string[]; locale: string; label: string }) {
  const w = 640, h = 240, l = 56, r = 16, t = 16, b = 32;
  const min = Math.min(...values) * 0.97, max = Math.max(...values) * 1.03;
  const span = max - min || 1;
  const x = (i: number) => l + (i * (w - l - r)) / (values.length - 1);
  const y = (v: number) => t + (1 - (v - min) / span) * (h - t - b);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * span);
  const nf = new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits: 0 });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" direction="ltr" role="img" aria-label={label}>
      <defs>
        <linearGradient id="tc-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#00804a" stopOpacity=".18" />
          <stop offset="1" stopColor="#00804a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={l} x2={w - r} y1={y(v)} y2={y(v)} stroke="#ede4d0" strokeDasharray={i ? "3 4" : undefined} />
          <text x={l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#7d8a83">{nf.format(Math.round(v / 10) * 10)}</text>
        </g>
      ))}
      <path d={`${d} L${x(values.length - 1)},${h - b} L${x(0)},${h - b} Z`} fill="url(#tc-fill)" />
      <path d={d} fill="none" stroke="#00804a" strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((v, i) => {
        const isLast = i === values.length - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={isLast ? 5 : 3} fill={isLast ? "#c49a3c" : "#00804a"} stroke="white" strokeWidth="1.5" />
            <text x={x(i)} y={h - 10} textAnchor="middle" fontSize="10.5" fill="#7d8a83">{labels[i].replace("-", " ")}</text>
          </g>
        );
      })}
    </svg>
  );
}
