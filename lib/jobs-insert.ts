import type { AdzunaJob, Job, ScoredJob } from "@/types";

export function formatSalary(adzuna: AdzunaJob): string | null {
  const min = adzuna.salary_min;
  const max = adzuna.salary_max;

  if (min == null && max == null) return null;

  const upper = max ?? min ?? 0;
  const lower = min ?? 0;

  if (min == null || lower <= 0) {
    return `Up to $${Math.round(upper / 1000)}k`;
  }
  if (max == null || max === min) {
    return `$${Math.round(lower / 1000)}k`;
  }
  return `$${Math.round(lower / 1000)}k - $${Math.round(upper / 1000)}k`;
}

export function mapToJobInsert(
  adzuna: AdzunaJob,
  scored: ScoredJob,
  userId: string,
  runId: string,
): Omit<Job, "id" | "found_at"> {
  return {
    run_id: runId,
    user_id: userId,
    source: "search",
    source_url: adzuna.redirect_url,
    external_apply_url: adzuna.redirect_url,
    title: adzuna.title,
    company: adzuna.company?.display_name ?? "Unknown",
    location: adzuna.location?.display_name ?? "Unknown",
    salary: formatSalary(adzuna),
    job_type: adzuna.contract_type ?? "fulltime",
    about_role: adzuna.description,
    responsibilities: null,
    requirements: null,
    nice_to_have: null,
    benefits: null,
    about_company: null,
    match_score: scored.matchScore,
    match_reason: scored.matchReason,
    matched_skills: scored.matchedSkills,
    missing_skills: scored.missingSkills,
    company_research: null,
  };
}
