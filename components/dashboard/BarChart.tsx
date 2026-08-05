import { CHART } from "@/components/dashboard/chart-layout";
import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import type { ChartPoint } from "@/lib/dashboard-data";

const PAD_TOP = 24;

export function BarChart({
  data,
  color,
}: {
  data: ChartPoint[];
  color: string;
}) {
  if (!data.some((d) => d.value > 0)) {
    return <ChartEmptyState />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = CHART.width - CHART.padX * 2;
  const innerH = CHART.height - PAD_TOP - CHART.padBottom;
  const slot = innerW / data.length;
  const barWidth = Math.min(slot * 0.55, 48);
  const radius = Math.min(6, barWidth / 2);
  const baselineY = PAD_TOP + innerH;
  const gridFractions = [0.25, 0.5, 0.75, 1];

  const bars = data.map((d, i) => {
    const x = CHART.padX + i * slot + (slot - barWidth) / 2;
    const barH = (d.value / max) * innerH;
    const y = baselineY - barH;
    const path =
      barH > 0
        ? `M ${x} ${y + barH} L ${x} ${y + radius} Q ${x} ${y} ${x + radius} ${y} L ${x + barWidth - radius} ${y} Q ${x + barWidth} ${y} ${x + barWidth} ${y + radius} L ${x + barWidth} ${y + barH} Z`
        : "";
    return { ...d, x, y, barH, path };
  });

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="h-auto w-full"
    >
      {gridFractions.map((f) => {
        const y = baselineY - f * innerH;
        return (
          <line
            key={f}
            x1={CHART.padX}
            y1={y}
            x2={CHART.padX + innerW}
            y2={y}
            strokeWidth={1}
            strokeDasharray="4 4"
            style={{ stroke: "var(--color-border)" }}
          />
        );
      })}

      <line
        x1={CHART.padX}
        y1={baselineY}
        x2={CHART.padX + innerW}
        y2={baselineY}
        strokeWidth={1}
        style={{ stroke: "var(--color-border)" }}
      />

      {bars.map((bar) =>
        bar.barH > 0 ? (
          <path key={bar.label} d={bar.path} style={{ fill: color }} />
        ) : null,
      )}

      {bars.map((bar) =>
        bar.barH > 0 ? (
          <text
            key={bar.label}
            x={bar.x + barWidth / 2}
            y={bar.y - 8}
            textAnchor="middle"
            fontSize={12}
            style={{ fill: "var(--color-text-muted)" }}
          >
            {bar.value}
          </text>
        ) : null,
      )}

      {bars.map((bar) => (
        <text
          key={bar.label}
          x={bar.x + barWidth / 2}
          y={CHART.height - 8}
          textAnchor="middle"
          fontSize={12}
          style={{ fill: "var(--color-text-muted)" }}
        >
          {bar.label}
        </text>
      ))}
    </svg>
  );
}
