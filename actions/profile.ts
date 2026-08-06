"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { captureServerEvent } from "@/lib/posthog-server";
import { calculateCompletion } from "@/lib/completion";
import { fetchProfile } from "@/lib/profile-data";
import type {
  HighestDegree,
  Profile,
  RemotePreference,
  WorkAuthorization,
  WorkExperienceRole,
  ExperienceLevel,
} from "@/types";

export type SaveProfileInput = {
  fullName: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: WorkAuthorization;
  currentTitle: string;
  experienceLevel: ExperienceLevel | "";
  yearsExperience: string;
  skillsCsv: string;
  industriesCsv: string;
  workExperience: WorkExperienceRole[];
  highestDegree: HighestDegree | "";
  fieldOfStudy: string;
  institutionName: string;
  graduationYear: string;
  jobTitlesSeekingCsv: string;
  remotePreference: RemotePreference;
  salaryExpectation: string;
  preferredLocationsCsv: string;
};

export function csvToArr(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseYears(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: ExperienceLevel | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperienceRole[];
  education: Profile["education"];
  job_titles_seeking: string[];
  remote_preference: RemotePreference | null;
  salary_expectation: string | null;
  preferred_locations: string[];
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: WorkAuthorization | null;
  resume_pdf_url: string | null;
  is_complete: boolean;
  updated_at: string;
};

function emptyStrToNull(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export async function saveProfile(
  input: SaveProfileInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return { success: false, error: "Not signed in" };

    const skills = csvToArr(input.skillsCsv);
    const industries = csvToArr(input.industriesCsv);
    const jobTitlesSeeking = csvToArr(input.jobTitlesSeekingCsv);
    const preferredLocations = csvToArr(input.preferredLocationsCsv);
    const yearsExperience = parseYears(input.yearsExperience);

    const candidate: Profile = {
      fullName: input.fullName.trim(),
      email: user.email ?? "",
      phone: input.phone.trim(),
      location: input.location.trim(),
      linkedinUrl: input.linkedinUrl.trim(),
      portfolioUrl: input.portfolioUrl.trim(),
      workAuthorization: input.workAuthorization,
      currentTitle: input.currentTitle.trim(),
      experienceLevel: input.experienceLevel,
      yearsExperience: yearsExperience ?? 0,
      skills,
      industries,
      workExperience: input.workExperience.map((r) => ({
        ...r,
        company: r.company.trim(),
        title: r.title.trim(),
        startDate: r.startDate,
        endDate: r.current ? "" : r.endDate,
        accomplishments: r.accomplishments.trim(),
      })),
      education: {
        highestDegree: input.highestDegree,
        fieldOfStudy: input.fieldOfStudy.trim(),
        institutionName: input.institutionName.trim(),
        graduationYear: input.graduationYear.trim(),
      },
      jobTitlesSeeking,
      remotePreference: input.remotePreference,
      salaryExpectation: input.salaryExpectation.trim(),
      preferredLocations,
      resumePdfUrl: null,
      isComplete: false,
    };

    const existing = await fetchProfile(user.id);
    candidate.resumePdfUrl = existing?.resumePdfUrl ?? null;

    const completion = calculateCompletion(candidate);

    const row: ProfileRow = {
      id: user.id,
      full_name: candidate.fullName || null,
      email: candidate.email || null,
      phone: candidate.phone || null,
      location: candidate.location || null,
      current_title: candidate.currentTitle || null,
      experience_level: input.experienceLevel || null,
      years_experience: yearsExperience,
      skills: candidate.skills,
      industries: candidate.industries,
      work_experience: candidate.workExperience,
      education: {
        highestDegree: input.highestDegree,
        fieldOfStudy: emptyStrToNull(candidate.education.fieldOfStudy),
        institutionName: emptyStrToNull(candidate.education.institutionName),
        graduationYear: emptyStrToNull(candidate.education.graduationYear),
      },
      job_titles_seeking: candidate.jobTitlesSeeking,
      remote_preference: input.remotePreference || null,
      salary_expectation: emptyStrToNull(candidate.salaryExpectation),
      preferred_locations: candidate.preferredLocations,
      linkedin_url: emptyStrToNull(candidate.linkedinUrl),
      portfolio_url: emptyStrToNull(candidate.portfolioUrl),
      work_authorization: input.workAuthorization || null,
      resume_pdf_url: candidate.resumePdfUrl,
      is_complete: completion.isComplete,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await insforge.database
      .from("profiles")
      .upsert(row, { onConflict: "id" });
    if (upsertErr) {
      console.error("[actions/profile] upsert", upsertErr);
      if (upsertErr.code === "23514") {
        return {
          success: false,
          error: "One or more fields have an invalid value. Please review and try again.",
        };
      }
      return { success: false, error: "Failed to save profile" };
    }

    if (completion.isComplete && !existing?.isComplete) {
      await captureServerEvent(user.id, "profile_completed", { userId: user.id });
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to save profile" };
  }
}
