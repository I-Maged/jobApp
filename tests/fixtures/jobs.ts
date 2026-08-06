import type { AdzunaJob, Job, ScoredJob } from "@/types";

export function makeAdzunaJob(overrides: Partial<AdzunaJob> = {}): AdzunaJob {
  return {
    id: "adzuna-1",
    title: "Senior Frontend Engineer",
    company: { display_name: "Stripe" },
    location: { display_name: "New York" },
    description: "Build delightful payment experiences with TypeScript and React.",
    redirect_url: "https://www.adzuna.com/jobs/redirect/1",
    salary_min: 120000,
    salary_max: 150000,
    salary_is_predicted: "0",
    contract_type: "permanent",
    created: "2026-08-01T00:00:00Z",
    category: { tag: "it-jobs", label: "IT Jobs" },
    ...overrides,
  };
}

export function makeScoredJob(overrides: Partial<ScoredJob> = {}): ScoredJob {
  return {
    matchScore: 85,
    matchReason: "Strong fit on frontend skills and React experience.",
    matchedSkills: ["TypeScript", "React"],
    missingSkills: ["GraphQL"],
    ...overrides,
  };
}

export function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    run_id: "run-1",
    user_id: "user-1",
    source: "search",
    source_url: "https://www.adzuna.com/jobs/redirect/1",
    external_apply_url: "https://www.adzuna.com/jobs/redirect/1",
    title: "Senior Frontend Engineer",
    company: "Stripe",
    location: "New York",
    salary: "$120k - $150k",
    job_type: "permanent",
    about_role: "Build delightful payment experiences with TypeScript and React.",
    responsibilities: null,
    requirements: null,
    nice_to_have: null,
    benefits: null,
    about_company: null,
    match_score: 85,
    match_reason: "Strong fit on frontend skills and React experience.",
    matched_skills: ["TypeScript", "React"],
    missing_skills: ["GraphQL"],
    company_research: null,
    found_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}
