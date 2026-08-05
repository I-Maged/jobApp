import { CHART } from "@/components/dashboard/chart-layout";

export function ChartEmptyState() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: CHART.height }}
    >
      <p className="text-sm text-text-muted">
        No data yet. Your activity will appear here.
      </p>
    </div>
  );
}
