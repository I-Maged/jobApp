import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/get-current-user";
import { fetchJob } from "@/lib/jobs-data";
import { fetchProfile } from "@/lib/profile-data";
import { createInsforgeServer } from "@/lib/insforge-server";
import { researchCompany } from "@/agent/research";
import { captureServerEvent, EVENT_COMPANY_RESEARCHED } from "@/lib/posthog-server";

export const maxDuration = 300;

const RESEARCH_DEADLINE_MS = 4 * 60_000;

async function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type ResearchRequestBody = {
  jobId?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not signed in" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as ResearchRequestBody;
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job id is required" },
        { status: 400 },
      );
    }

    const [job, profile] = await Promise.all([
      fetchJob(jobId, user.id),
      fetchProfile(user.id),
    ]);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found. Complete your profile first.",
        },
        { status: 404 },
      );
    }

    if (job.company_research) {
      return NextResponse.json({ success: true, dossier: job.company_research });
    }

    const dossier = await withDeadline(
      researchCompany(job, profile),
      RESEARCH_DEADLINE_MS,
    );

    const insforge = await createInsforgeServer();
    const { error } = await insforge.database
      .from("jobs")
      .update({ company_research: dossier })
      .eq("id", job.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[agent/research] save dossier", error);
      return NextResponse.json(
        { success: false, error: "Failed to save company research" },
        { status: 500 },
      );
    }

    await captureServerEvent(user.id, EVENT_COMPANY_RESEARCHED, {
      userId: user.id,
      jobId: job.id,
      company: job.company,
    }).catch((error: unknown) => {
      console.error("[agent/research] capture event failed", error);
    });

    revalidatePath(`/find-jobs/${job.id}`);

    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    console.error("[agent/research]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
