import { createInsforgeServer } from "@/lib/insforge-server";

export type StatCard = {
  label: string;
  value: string;
  trend?: string;
};

export type ActivityItem = {
  id: string;
  kind: "job_search" | "company_research";
  title: string;
  timestamp: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type DashboardCharts = {
  jobsOverTime: ChartPoint[];
  matchDistribution: ChartPoint[];
  researchActivity: ChartPoint[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type StatsRow = {
  match_score: number | null;
  company_research: Record<string, unknown> | null;
  found_at: string;
};

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function inWindow(row: StatsRow, start: number, end: number): boolean {
  const time = Date.parse(row.found_at);
  return time >= start && time < end;
}

export async function fetchDashboardStats(userId: string): Promise<StatCard[]> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("jobs")
    .select("match_score, company_research, found_at")
    .eq("user_id", userId);

  if (error) {
    console.error("[dashboard-data] fetch stats", error);
    return [
      { label: "Total Jobs Found", value: "0" },
      { label: "Avg. Match Rate", value: "—" },
      { label: "Companies Researched", value: "0" },
      { label: "Jobs This Week", value: "0" },
    ];
  }

  const rows = (data ?? []) as StatsRow[];

  const now = Date.now();
  const weekStart = now - WEEK_MS;
  const prevWeekStart = now - 2 * WEEK_MS;

  const scored = rows.filter((row) => row.match_score !== null);
  const avgMatchRate = scored.length
    ? Math.round(average(scored.map((row) => row.match_score as number)))
    : null;

  const thisWeek = rows.filter((row) => inWindow(row, weekStart, now));
  const lastWeek = rows.filter((row) => inWindow(row, prevWeekStart, weekStart));

  const thisWeekScores = thisWeek
    .map((row) => row.match_score)
    .filter((score): score is number => score !== null);
  const lastWeekScores = lastWeek
    .map((row) => row.match_score)
    .filter((score): score is number => score !== null);

  let matchTrend = "";
  if (thisWeekScores.length > 0 && lastWeekScores.length > 0) {
    const delta =
      Math.round(average(thisWeekScores)) - Math.round(average(lastWeekScores));
    matchTrend = `${formatDelta(delta)}% vs last week`;
  }

  return [
    {
      label: "Total Jobs Found",
      value: String(rows.length),
      trend: `+${thisWeek.length} this week`,
    },
    {
      label: "Avg. Match Rate",
      value: avgMatchRate === null ? "—" : `${avgMatchRate}%`,
      trend: matchTrend,
    },
    {
      label: "Companies Researched",
      value: String(
        rows.filter((row) => row.company_research !== null).length,
      ),
      trend: `+${thisWeek.filter((row) => row.company_research !== null).length} this week`,
    },
    {
      label: "Jobs This Week",
      value: String(thisWeek.length),
      trend: `${formatDelta(thisWeek.length - lastWeek.length)} vs last week`,
    },
  ];
}

export function getMockActivity(): ActivityItem[] {
  return [
    {
      id: "activity-1",
      kind: "job_search",
      title: "Found 8 jobs for Senior Frontend Engineer",
      timestamp: "2h ago",
    },
    {
      id: "activity-2",
      kind: "company_research",
      title: "Researched Stripe",
      timestamp: "4h ago",
    },
    {
      id: "activity-3",
      kind: "job_search",
      title: "Found 10 jobs for Product Manager",
      timestamp: "Yesterday",
    },
    {
      id: "activity-4",
      kind: "company_research",
      title: "Researched Linear",
      timestamp: "Yesterday",
    },
    {
      id: "activity-5",
      kind: "job_search",
      title: "Found 6 jobs for Backend Engineer",
      timestamp: "2 days ago",
    },
    {
      id: "activity-6",
      kind: "company_research",
      title: "Researched Vercel",
      timestamp: "3 days ago",
    },
  ];
}

function buildDaySeries(days: number): ChartPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    const value = Math.max(
      0,
      Math.round(1.4 + Math.sin(i / 3.4) * 1.5 + (i % 4 === 0 ? 1 : 0)),
    );
    return { label, value };
  });
}

export function getMockCharts(): DashboardCharts {
  return {
    jobsOverTime: buildDaySeries(30),
    matchDistribution: [
      { label: "50-60%", value: 2 },
      { label: "60-70%", value: 3 },
      { label: "70-80%", value: 5 },
      { label: "80-90%", value: 8 },
      { label: "90-100%", value: 4 },
    ],
    researchActivity: [
      { label: "Mon", value: 1 },
      { label: "Tue", value: 0 },
      { label: "Wed", value: 2 },
      { label: "Thu", value: 1 },
      { label: "Fri", value: 2 },
      { label: "Sat", value: 0 },
      { label: "Sun", value: 0 },
    ],
  };
}
