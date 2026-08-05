import type { StatCard } from "@/lib/dashboard-data";

const CARD_SHADOW =
  "shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]";

export function StatsBar({ stats }: { stats: StatCard[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl border border-border bg-surface p-6 ${CARD_SHADOW}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {stat.label}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[30px] font-semibold leading-9 text-text-primary tabular-nums">
              {stat.value}
            </span>
            {stat.trend ? (
              <span className="inline-flex items-center rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium text-success-darker">
                {stat.trend}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}
