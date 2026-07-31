"use client";

type Props = {
  percent: number;
  missingLabels: string[];
};

export function CompletionIndicator({ percent, missingLabels }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const size = 72;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-secondary p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
        <div className="relative h-18 shrink-0">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="h-full w-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={stroke}
              className="fill-none stroke-border-light"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="fill-none stroke-accent transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-text-primary tabular-nums">
              {clamped}%
            </span>
          </div>
        </div>
        <span className="text-xs font-medium text-text-secondary sm:hidden">
          {clamped}% complete
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <span className="hidden text-xs font-medium text-text-secondary sm:inline">
          {clamped}% complete
        </span>
        {missingLabels.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">
              Missing:
            </span>
            {missingLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs font-medium text-success-foreground">
            All required fields filled
          </span>
        )}
      </div>
    </div>
  );
}
