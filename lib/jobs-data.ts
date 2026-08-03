import { createInsforgeServer } from "@/lib/insforge-server";
import type { Job } from "@/types";

export async function fetchUserJobs(userId: string): Promise<Job[]> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .order("found_at", { ascending: false });

  if (error) {
    console.error("[jobs-data] fetch user jobs", error);
    return [];
  }

  return (data ?? []) as Job[];
}
