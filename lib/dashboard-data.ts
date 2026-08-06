import { createInsforgeServer } from "@/lib/insforge-server";
import {
  runPostHogQuery,
  EVENT_JOB_FOUND,
  EVENT_COMPANY_RESEARCHED,
  PROP_MATCH_SCORE,
} from "@/lib/posthog-server";

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

const MAX_STATS_ROWS = 500;

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
    .eq("user_id", userId)
    .order("found_at", { ascending: false })
    .limit(MAX_STATS_ROWS);

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

const MATCH_BUCKETS = [
  { label: "50-60%", key: "50-60", min: 50 },
  { label: "60-70%", key: "60-70", min: 60 },
  { label: "70-80%", key: "70-80", min: 70 },
  { label: "80-90%", key: "80-90", min: 80 },
  { label: "90-100%", key: "90-100", min: 90 },
];

const CHART_CACHE_TTL_MS = 60_000;

const chartCache = new Map<
  string,
  { data: DashboardCharts; expiresAt: number }
>();

const chartInFlight = new Map<string, Promise<DashboardCharts>>();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toDayKey(value: unknown): string | null {
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
    if (match) return match[1];
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  }
  return null;
}

function buildCountSeries(rows: unknown[][], days: number): ChartPoint[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = toDayKey(row[0]);
    if (key) counts.set(key, toCount(row[1]));
  }

  const today = new Date();
  const points: ChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
    );
    const key = date.toISOString().slice(0, 10);
    points.push({
      label: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
      value: counts.get(key) ?? 0,
    });
  }
  return points;
}

function buildMatchDistribution(rows: unknown[][]): ChartPoint[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[0] ?? "");
    if (key) counts.set(key, toCount(row[1]));
  }
  return MATCH_BUCKETS.map(({ label, key }) => ({
    label,
    value: counts.get(key) ?? 0,
  }));
}

function buildMatchDistributionQuery(userId: string): string {
  const reversed = [...MATCH_BUCKETS].reverse();
  const whens = reversed
    .slice(0, -1)
    .map(
      ({ key, min }) => `WHEN properties.${PROP_MATCH_SCORE} >= ${min} THEN '${key}'`,
    )
    .join("\n       ");
  const lowest = reversed[reversed.length - 1];
  return `SELECT CASE
       ${whens}
       ELSE '${lowest.key}'
     END AS bucket, count() AS count
     FROM events
     WHERE event = '${EVENT_JOB_FOUND}' AND distinct_id = '${userId}'
       AND timestamp >= toStartOfDay(now()) - INTERVAL 29 DAY
       AND properties.${PROP_MATCH_SCORE} >= ${lowest.min}
     GROUP BY bucket`;
}

async function loadDashboardCharts(userId: string): Promise<DashboardCharts> {
  const [jobsRows, researchRows, distributionRows] = await Promise.all([
    runPostHogQuery(
      "dashboard_jobs_found_over_time_30d",
      `SELECT toStartOfDay(timestamp) AS day, count() AS count
       FROM events
       WHERE event = '${EVENT_JOB_FOUND}' AND distinct_id = '${userId}'
         AND timestamp >= toStartOfDay(now()) - INTERVAL 29 DAY
       GROUP BY day ORDER BY day`,
    ),
    runPostHogQuery(
      "dashboard_company_researched_7d",
      `SELECT toStartOfDay(timestamp) AS day, count() AS count
       FROM events
       WHERE event = '${EVENT_COMPANY_RESEARCHED}' AND distinct_id = '${userId}'
         AND timestamp >= toStartOfDay(now()) - INTERVAL 6 DAY
       GROUP BY day ORDER BY day`,
    ),
    runPostHogQuery(
      "dashboard_job_found_match_distribution",
      buildMatchDistributionQuery(userId),
    ),
  ]);

  return {
    jobsOverTime: buildCountSeries(jobsRows, 30),
    matchDistribution: buildMatchDistribution(distributionRows),
    researchActivity: buildCountSeries(researchRows, 7),
  };
}

export async function fetchDashboardCharts(
  userId: string,
): Promise<DashboardCharts> {
  if (!UUID_PATTERN.test(userId)) {
    console.warn("[dashboard-data] fetch charts rejected non-uuid userId");
    return { jobsOverTime: [], matchDistribution: [], researchActivity: [] };
  }

  const cached = chartCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const inFlight = chartInFlight.get(userId);
  if (inFlight) return inFlight;

  const pending = loadDashboardCharts(userId)
    .then((data) => {
      chartCache.set(userId, {
        data,
        expiresAt: Date.now() + CHART_CACHE_TTL_MS,
      });
      return data;
    })
    .finally(() => {
      chartInFlight.delete(userId);
    });

  chartInFlight.set(userId, pending);
  return pending;
}
