import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getCurrentUser } from "@/lib/get-current-user";
import { fetchProfile } from "@/lib/profile-data";
import { searchJobs } from "@/agent/adzuna";
import { scoreJobAgainstProfile } from "@/agent/matcher";
import { captureServerEventsBatch } from "@/lib/posthog-server";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { AdzunaJob, Job, ScoredJob } from "@/types";

type FindRequestBody = {
  jobTitle: string;
  location?: string;
};

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

const MAX_INPUT_LENGTH = 200;
const RUN_STALE_MS = 60_000;

function formatSalary(adzuna: AdzunaJob): string | null {
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

function mapToJobInsert(
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

async function markRunFailed(
  insforge: InsforgeServer,
  runId: string,
): Promise<void> {
  try {
    await insforge.database
      .from("agent_runs")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", runId);
  } catch (err) {
    console.error("[agent/find] failed to mark run as failed", err);
  }
}

async function markRunCompleted(
  insforge: InsforgeServer,
  runId: string,
  jobsFound: number,
): Promise<void> {
  try {
    await insforge.database
      .from("agent_runs")
      .update({
        status: "completed",
        jobs_found: jobsFound,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  } catch (err) {
    console.error("[agent/find] failed to mark run as completed", err);
  }
}

export async function POST(req: NextRequest) {
  let runId: string | null = null;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not signed in" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as Partial<FindRequestBody>;
    const jobTitle =
      typeof body.jobTitle === "string"
        ? body.jobTitle.trim().slice(0, MAX_INPUT_LENGTH)
        : "";
    const location =
      typeof body.location === "string"
        ? body.location.trim().slice(0, MAX_INPUT_LENGTH)
        : "";

    if (!jobTitle) {
      return NextResponse.json(
        { success: false, error: "Job title is required" },
        { status: 400 },
      );
    }

    const profile = await fetchProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found. Complete your profile first.",
        },
        { status: 404 },
      );
    }

    const insforge = await createInsforgeServer();

    await insforge.database
      .from("agent_runs")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "running")
      .lt(
        "started_at",
        new Date(Date.now() - RUN_STALE_MS).toISOString(),
      );

    const { data: runningRuns, error: runningError } =
      await insforge.database
        .from("agent_runs")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "running")
        .limit(1);

    if (runningError) {
      console.error("[agent/find] concurrency check", runningError);
      return NextResponse.json(
        { success: false, error: "Failed to check run status" },
        { status: 500 },
      );
    }

    if (runningRuns && runningRuns.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A job search is already in progress. Please wait for it to finish.",
        },
        { status: 429 },
      );
    }

    const startedAt = new Date().toISOString();

    const { data: runRow, error: runError } = await insforge.database
      .from("agent_runs")
      .insert([
        {
          user_id: user.id,
          status: "running",
          job_title_searched: jobTitle,
          location_searched: location,
          jobs_found: 0,
          started_at: startedAt,
        },
      ])
      .select("id")
      .single();

    if (runError || !runRow) {
      const errorText = JSON.stringify(runError) ?? "";
      if (/duplicate key|unique constraint/i.test(errorText)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A job search is already in progress. Please wait for it to finish.",
          },
          { status: 429 },
        );
      }
      console.error("[agent/find] create agent_run", runError);
      return NextResponse.json(
        { success: false, error: "Failed to start agent run" },
        { status: 500 },
      );
    }

    const runRowId = runRow.id;
    if (!runRowId) {
      console.error("[agent/find] agent run created without id");
      return NextResponse.json(
        { success: false, error: "Failed to start agent run" },
        { status: 500 },
      );
    }

    runId = runRowId;
    const currentRunId = runRowId;

    let adzunaJobs: AdzunaJob[];
    try {
      adzunaJobs = await searchJobs(jobTitle, location);
    } catch (err) {
      console.error("[agent/find] adzuna", err);
      await markRunFailed(insforge, currentRunId);
      return NextResponse.json(
        { success: false, error: "Failed to reach Adzuna" },
        { status: 502 },
      );
    }

    if (adzunaJobs.length === 0) {
      await markRunCompleted(insforge, currentRunId, 0);

      return NextResponse.json({
        success: true,
        adzunaFound: 0,
        totalFound: 0,
        strongMatches: 0,
        results: [],
      });
    }

    const scoredResults = await Promise.all(
      adzunaJobs.map(async (adzunaJob) => {
        try {
          const scored = await scoreJobAgainstProfile(adzunaJob, profile);
          return mapToJobInsert(adzunaJob, scored, user.id, currentRunId);
        } catch (err) {
          console.error(
            "[agent/matcher] score failed for job",
            adzunaJob.id,
            err,
          );
          return null;
        }
      }),
    );

    const rowsToInsert = scoredResults.filter(
      (r): r is Omit<Job, "id" | "found_at"> => r !== null,
    );

    if (rowsToInsert.length === 0) {
      console.error(
        "[agent/find] all scoring failed for",
        adzunaJobs.length,
        "jobs",
      );
      await markRunFailed(insforge, currentRunId);
      return NextResponse.json(
        {
          success: false,
          error: "Job scoring failed. Please try again.",
        },
        { status: 502 },
      );
    }

    const { data: insertedJobs, error: insertError } =
      await insforge.database
        .from("jobs")
        .insert(rowsToInsert)
        .select();

    if (insertError) {
      console.error("[agent/find] insert jobs", insertError);
      await markRunFailed(insforge, currentRunId);
      return NextResponse.json(
        { success: false, error: "Failed to save jobs" },
        { status: 500 },
      );
    }

    const savedJobs = (insertedJobs ?? []) as Job[];

    await captureServerEventsBatch(
      user.id,
      savedJobs.map((sj) => ({
        event: "job_found",
        properties: {
          userId: user.id,
          source: "search",
          matchScore: sj.match_score,
        },
      })),
    );

    const strongMatches = savedJobs.filter(
      (j) => j.match_score >= MATCH_THRESHOLD,
    ).length;

    await markRunCompleted(insforge, currentRunId, savedJobs.length);

    return NextResponse.json({
      success: true,
      adzunaFound: adzunaJobs.length,
      totalFound: savedJobs.length,
      strongMatches,
      results: savedJobs,
    });
  } catch (error) {
    console.error("[agent/find]", error);

    if (runId) {
      try {
        const insforge = await createInsforgeServer();
        await markRunFailed(insforge, runId);
      } catch (updateErr) {
        console.error(
          "[agent/find] failed to mark run as failed",
          updateErr,
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
