import type { ActivityItem } from "@/lib/dashboard-data";

const DOT_CLASS: Record<ActivityItem["kind"], { outer: string; inner: string }> = {
  job_search: { outer: "bg-success-light", inner: "bg-success-alt" },
  company_research: { outer: "bg-info-light", inner: "bg-info" },
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold leading-6 text-text-primary">
        Recent Activity
      </h2>
      <ul className="mt-5 flex flex-col gap-5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${DOT_CLASS[item.kind].outer}`}
            >
              <span
                className={`h-2 w-2 rounded-full border border-surface ${DOT_CLASS[item.kind].inner}`}
              />
            </span>
            <p className="flex-1 text-sm font-medium text-text-primary">
              {item.title}
            </p>
            <time className="text-xs text-text-muted">{item.timestamp}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
