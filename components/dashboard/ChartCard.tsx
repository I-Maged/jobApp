import type { ReactNode } from "react";

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold leading-6 text-text-primary">
          {title}
        </h3>
        {subtitle ? (
          <p className="text-xs text-text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
