import { ChartCard } from "@/components/dashboard/ChartCard";
import { LineChart } from "@/components/dashboard/LineChart";
import { BarChart } from "@/components/dashboard/BarChart";
import type { DashboardCharts } from "@/lib/dashboard-data";

export function AnalyticsCharts({ charts }: { charts: DashboardCharts }) {
  return (
    <section className="flex flex-col gap-6">
      <ChartCard title="Jobs Found Over Time" subtitle="Last 30 days">
        <LineChart data={charts.jobsOverTime} />
      </ChartCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Match Score Distribution" subtitle="All saved jobs">
          <BarChart
            data={charts.matchDistribution}
            color="var(--color-success)"
          />
        </ChartCard>
        <ChartCard title="Company Research Activity" subtitle="Last 7 days">
          <BarChart
            data={charts.researchActivity}
            color="var(--color-info)"
          />
        </ChartCard>
      </div>
    </section>
  );
}
