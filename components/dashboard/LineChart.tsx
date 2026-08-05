import { useId } from "react";
import { CHART } from "@/components/dashboard/chart-layout";
import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import type { ChartPoint } from "@/lib/dashboard-data";

const PAD_TOP = 16;

export function LineChart({ data }: { data: ChartPoint[] }) {
  const gradientId = useId().replace(/:/g, "");

  if (!data.some((d) => d.value > 0)) {
    return <ChartEmptyState />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = CHART.width - CHART.padX * 2;
  const innerH = CHART.height - PAD_TOP - CHART.padBottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const labelStep = Math.ceil(data.length / 7);

  const points = data.map((d, i) => {
    const x = CHART.padX + (data.length > 1 ? i * stepX : innerW / 2);
    const y = PAD_TOP + innerH - (d.value / max) * innerH;
    return { ...d, x, y };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${CHART.padX},${PAD_TOP + innerH} ${linePoints} ${CHART.padX + innerW},${PAD_TOP + innerH}`;
  const gridFractions = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            style={{ stopColor: "var(--color-accent)", stopOpacity: 0.2 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "var(--color-accent)", stopOpacity: 0 }}
          />
        </linearGradient>
      </defs>

      {gridFractions.map((f) => {
        const y = PAD_TOP + innerH - f * innerH;
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

      <polygon points={areaPoints} style={{ fill: `url(#${gradientId})` }} />
      <polyline
        points={linePoints}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: "var(--color-accent)" }}
      />

      {points.map((p) => (
        <circle
          key={p.label}
          cx={p.x}
          cy={p.y}
          r={3.5}
          style={{ fill: "var(--color-accent)" }}
        />
      ))}

      {points.map((p, i) =>
        i % labelStep === 0 ? (
          <text
            key={p.label}
            x={p.x}
            y={CHART.height - 8}
            textAnchor="middle"
            fontSize={12}
            style={{ fill: "var(--color-text-muted)" }}
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
