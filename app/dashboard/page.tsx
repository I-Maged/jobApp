import type { Metadata } from "next";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { getCurrentUser } from "@/lib/get-current-user";
import { fetchProfile } from "@/lib/profile-data";
import { calculateCompletion, REQUIRED_LABELS } from "@/lib/completion";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  getMockCharts,
} from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const profile = user ? await fetchProfile(user.id) : null;

  const completion = profile
    ? calculateCompletion(profile)
    : { percent: 0, isComplete: false, missing: Object.values(REQUIRED_LABELS) };

  const stats = user ? await fetchDashboardStats(user.id) : [];
  const activity = user ? await fetchRecentActivity(user.id) : [];
  const charts = getMockCharts();

  return (
    <main className="w-full bg-background">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-8 md:px-8 md:py-10">
        {!completion.isComplete ? (
          <header className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-semibold leading-7 text-text-primary">
                  Profile needs attention
                </h1>
                <p className="max-w-2xl text-sm leading-5 text-text-secondary">
                  Complete the missing fields to improve your chance of getting
                  tailored matches and generating quality resumes.
                </p>
              </div>
              <CompletionIndicator
                percent={completion.percent}
                missingLabels={completion.missing}
              />
            </div>
          </header>
        ) : null}

        <StatsBar stats={stats} />
        <RecentActivity items={activity} />
        <AnalyticsCharts charts={charts} />
      </div>
    </main>
  );
}
