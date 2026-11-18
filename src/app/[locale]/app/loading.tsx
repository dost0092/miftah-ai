/** Shown instantly while a workspace page loads, so clicks never feel unanswered. */
export default function Loading() {
  return (
    <div className="container-x py-8" aria-busy="true">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-sand-100" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-sand-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-sand-200 bg-sand-50" />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl border border-sand-200 bg-sand-50" />
    </div>
  );
}
