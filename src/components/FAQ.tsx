import { IconChevron } from "./Icons";

export function FAQ({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="divide-y divide-sand-200 overflow-hidden rounded-3xl border border-sand-200 bg-white">
      {items.map((item, i) => (
        <details key={i} className="group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-start font-semibold text-ink-900 transition hover:bg-sand-50 [&::-webkit-details-marker]:hidden">
            {item.q}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand-100 text-ink-500 transition group-open:rotate-180 group-open:bg-green-600 group-open:text-white">
              <IconChevron width={16} height={16} />
            </span>
          </summary>
          <p className="px-6 pb-6 leading-relaxed text-ink-500">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
