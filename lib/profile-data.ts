import { createInsforgeServer } from "@/lib/insforge-server";
import type {
  Education,
  ExperienceLevel,
  HighestDegree,
  Profile,
  RemotePreference,
  WorkAuthorization,
  WorkExperienceRole,
} from "@/types";

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function asBoolean(v: unknown): boolean {
  return v === true;
}

function splitCsv(v: unknown): string[] {
  if (typeof v !== "string" || !v.trim()) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function joinCsv(items: string[]): string {
  return items.join(", ");
}

function asWorkExperience(v: unknown): WorkExperienceRole[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const r = item as Record<string, unknown>;
    return [
      {
        id:
          typeof r.id === "string"
            ? r.id
            : `role-${Math.random().toString(36).slice(2)}`,
        company: asString(r.company),
        title: asString(r.title),
        startDate: asString(r.startDate),
        endDate: asString(r.endDate),
        current: asBoolean(r.current),
        accomplishments: asString(r.accomplishments),
      },
    ];
  });
}

function asEducation(v: unknown): Education {
  if (!v || typeof v !== "object") {
    return { highestDegree: "", fieldOfStudy: null, institutionName: null, graduationYear: null };
  }
  const r = v as Record<string, unknown>;
  return {
    highestDegree: (typeof r.highestDegree === "string"
      ? r.highestDegree
      : "") as HighestDegree | "",
    fieldOfStudy: typeof r.fieldOfStudy === "string" && r.fieldOfStudy.trim() !== ""
      ? r.fieldOfStudy
      : null,
    institutionName: typeof r.institutionName === "string" && r.institutionName.trim() !== ""
      ? r.institutionName
      : null,
    graduationYear: typeof r.graduationYear === "string" && r.graduationYear.trim() !== ""
      ? r.graduationYear
      : null,
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;
  const r = data as Record<string, unknown>;

  const jobTitlesSeeking = Array.isArray(r.job_titles_seeking)
    ? asStringArray(r.job_titles_seeking)
    : splitCsv(r.job_titles_seeking);
  const preferredLocations = Array.isArray(r.preferred_locations)
    ? asStringArray(r.preferred_locations)
    : splitCsv(r.preferred_locations);

  return {
    fullName: asString(r.full_name),
    email: asString(r.email),
    phone: asString(r.phone),
    location: asString(r.location),
    linkedinUrl: asString(r.linkedin_url),
    portfolioUrl: asString(r.portfolio_url),
    workAuthorization: (asString(r.work_authorization) || "citizen") as WorkAuthorization,
    currentTitle: asString(r.current_title),
    experienceLevel: (asString(r.experience_level) || "") as ExperienceLevel | "",
    yearsExperience: asNumber(r.years_experience),
    skills: asStringArray(r.skills),
    industries: asStringArray(r.industries),
    workExperience: asWorkExperience(r.work_experience),
    education: asEducation(r.education),
    jobTitlesSeeking,
    remotePreference: (asString(r.remote_preference) || "any") as RemotePreference,
    salaryExpectation: asString(r.salary_expectation),
    preferredLocations,
    resumePdfUrl: asString(r.resume_pdf_url) || null,
    isComplete: r.is_complete === true,
  };
}

export function csvToArray(v: string): string[] {
  return splitCsv(v);
}

export function arrayToCsv(items: string[]): string {
  return joinCsv(items);
}
