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

type RunActivityRow = {
  id: string;
  job_title_searched: string;
  jobs_found: number;
  started_at: string;
};

type ResearchActivityRow = {
  id: string;
  company: string;
  found_at: string;
};

type ActivityEntry = {
  id: string;
  kind: ActivityItem["kind"];
  title: string;
  time: string;
};

const ACTIVITY_LIMIT = 8;

function formatTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - Date.parse(timestamp);
  if (Number.isNaN(diffMs) || diffMs < 60_000) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

export async function fetchRecentActivity(
  userId: string,
): Promise<ActivityItem[]> {
  const insforge = await createInsforgeServer();

  const [runsResult, researchResult] = await Promise.all([
    insforge.database
      .from("agent_runs")
      .select("id, job_title_searched, jobs_found, started_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
    insforge.database
      .from("jobs")
      .select("id, company, found_at")
      .eq("user_id", userId)
      .not("company_research", "is", null)
      .order("found_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
  ]);

  if (runsResult.error) {
    console.error("[dashboard-data] fetch activity runs", runsResult.error);
  }
  if (researchResult.error) {
    console.error("[dashboard-data] fetch activity research", researchResult.error);
  }

  const runs = (runsResult.data ?? []) as RunActivityRow[];
  const research = (researchResult.data ?? []) as ResearchActivityRow[];

  const entries: ActivityEntry[] = [
    ...runs.map((run) => ({
      id: `run-${run.id}`,
      kind: "job_search" as const,
      title: `Found ${run.jobs_found} jobs for ${run.job_title_searched}`,
      time: run.started_at,
    })),
    ...research.map((job) => ({
      id: `job-${job.id}`,
      kind: "company_research" as const,
      title: `Researched ${job.company}`,
      time: job.found_at,
    })),
  ];

  return entries
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
    .slice(0, ACTIVITY_LIMIT)
    .map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      timestamp: formatTimeAgo(entry.time),
    }));
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
