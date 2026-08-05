export type StatCard = {
  label: string;
  value: string;
  trend: string;
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

export function getMockStats(): StatCard[] {
  return [
    { label: "Total Jobs Found", value: "24", trend: "+3 this week" },
    { label: "Avg. Match Rate", value: "78%", trend: "+4% vs last week" },
    { label: "Companies Researched", value: "9", trend: "+2 this week" },
    { label: "Jobs This Week", value: "5", trend: "on track" },
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
