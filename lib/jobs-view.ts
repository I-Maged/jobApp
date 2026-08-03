import { MATCH_THRESHOLD } from "@/lib/utils";
import type { Job } from "@/types";

export type MatchTier = "all" | "high" | "low";

export type SortKey = "score" | "newest" | "oldest";

export type DisplayJob = {
  id: string;
  company: string;
  role: string;
  matchScore: number;
  salary: string;
  source: string;
  dateFound: string;
};

export function toDisplayJob(job: Job): DisplayJob {
  return {
    id: job.id,
    company: job.company,
    role: job.title,
    matchScore: job.match_score,
    salary: job.salary ?? "N/A",
    source: job.source === "search" ? "Adzuna" : "URL",
    dateFound: job.found_at,
  };
}

export function filterAndSortJobs(
  jobs: Job[],
  filters: { text: string; tier: MatchTier; sort: SortKey },
): DisplayJob[] {
  const query = filters.text.trim().toLowerCase();

  const rows = jobs
    .filter((job) => {
      if (
        query &&
        !job.company.toLowerCase().includes(query) &&
        !job.title.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (filters.tier === "high" && job.match_score < MATCH_THRESHOLD) {
        return false;
      }
      if (filters.tier === "low" && job.match_score >= MATCH_THRESHOLD) {
        return false;
      }
      return true;
    })
    .map(toDisplayJob);

  rows.sort((a, b) => {
    if (filters.sort === "score") {
      return b.matchScore - a.matchScore;
    }
    const timeA = new Date(a.dateFound).getTime();
    const timeB = new Date(b.dateFound).getTime();
    return filters.sort === "newest" ? timeB - timeA : timeA - timeB;
  });

  return rows;
}
