import { createInsforgeServer } from "@/lib/insforge-server";
import type { Job } from "@/types";

const MAX_JOBS_LIST = 500;

const JOBS_LIST_COLUMNS =
  "id, title, company, location, match_score, salary, source, source_url, found_at";

export async function fetchUserJobs(userId: string): Promise<Job[]> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("jobs")
    .select(JOBS_LIST_COLUMNS)
    .eq("user_id", userId)
    .order("found_at", { ascending: false })
    .limit(MAX_JOBS_LIST);

  if (error) {
    console.error("[jobs-data] fetch user jobs", error);
    return [];
  }

  return (data ?? []) as Job[];
}

export async function fetchJob(
  jobId: string,
  userId: string,
): Promise<Job | null> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[jobs-data] fetch job", error);
    return null;
  }

  return (data as Job) ?? null;
}
