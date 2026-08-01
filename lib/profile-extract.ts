import type {
  ExperienceLevel,
  HighestDegree,
  ProfileFormState,
  RemotePreference,
  WorkAuthorization,
  WorkExperienceRole,
} from "@/types";

const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = [
  "junior",
  "mid",
  "senior",
  "lead",
];

const REMOTE_PREFERENCES: readonly RemotePreference[] = [
  "remote",
  "onsite",
  "hybrid",
  "any",
];

const WORK_AUTHORISATIONS: readonly WorkAuthorization[] = [
  "citizen",
  "permanent_resident",
  "visa_required",
];

const DEGREES: readonly HighestDegree[] = [
  "high_school",
  "associate",
  "bachelor",
  "master",
  "phd",
  "other",
];

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isStringArray(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((item) => typeof item === "string")
  );
}

function pickString(v: unknown): string | undefined {
  return isString(v) && v.trim().length > 0 ? v.trim() : undefined;
}

function pickEnum<T extends string>(
  v: unknown,
  allowed: readonly T[],
): T | undefined {
  return isString(v) && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : undefined;
}

function pickYears(v: unknown): string | undefined {
  if (!isString(v)) return undefined;
  const trimmed = v.trim();
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (Number.isFinite(n) && n >= 0 && n <= 70) return trimmed;
  }
  return undefined;
}

function pickYear(v: unknown): string | undefined {
  if (!isString(v)) return undefined;
  const trimmed = v.trim();
  if (/^(19|20)\d{2}$/.test(trimmed)) return trimmed;
  return undefined;
}

function pickRoles(v: unknown): WorkExperienceRole[] | undefined {
  if (!Array.isArray(v) || v.length === 0) return undefined;
  const roles: WorkExperienceRole[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    const company = pickString(r.company);
    const title = pickString(r.title);
    if (!company && !title) continue;
    roles.push({
      id: `extract-${roles.length}-${Math.random().toString(36).slice(2, 8)}`,
      company: company ?? "",
      title: title ?? "",
      startDate: pickString(r.startDate) ?? "",
      endDate: pickString(r.endDate) ?? "",
      current:
        typeof r.current === "boolean" ? r.current : r.endDate === undefined,
      accomplishments: pickString(r.accomplishments) ?? "",
    });
    if (roles.length >= 3) break;
  }
  return roles.length > 0 ? roles : undefined;
}

export type ExtractedProfile = Partial<ProfileFormState>;

export function buildExtractedProfile(raw: unknown): ExtractedProfile {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: ExtractedProfile = {};

  const skillsArr = r.skills;
  if (isStringArray(skillsArr)) out.skillsCsv = skillsArr.join(", ");

  const industriesArr = r.industries;
  if (isStringArray(industriesArr)) out.industriesCsv = industriesArr.join(", ");

  const titlesArr = r.jobTitlesSeeking;
  if (isStringArray(titlesArr)) out.jobTitlesSeekingCsv = titlesArr.join(", ");

  const locationsArr = r.preferredLocations;
  if (isStringArray(locationsArr))
    out.preferredLocationsCsv = locationsArr.join(", ");

  const fullName = pickString(r.fullName);
  if (fullName) out.fullName = fullName;

  const phone = pickString(r.phone);
  if (phone) out.phone = phone;

  const location = pickString(r.location);
  if (location) out.location = location;

  const linkedinUrl = pickString(r.linkedinUrl);
  if (linkedinUrl) out.linkedinUrl = linkedinUrl;

  const portfolioUrl = pickString(r.portfolioUrl);
  if (portfolioUrl) out.portfolioUrl = portfolioUrl;

  const workAuthorization = pickEnum(r.workAuthorization, WORK_AUTHORISATIONS);
  if (workAuthorization) out.workAuthorization = workAuthorization;

  const currentTitle = pickString(r.currentTitle);
  if (currentTitle) out.currentTitle = currentTitle;

  const experienceLevel = pickEnum(r.experienceLevel, EXPERIENCE_LEVELS);
  if (experienceLevel) out.experienceLevel = experienceLevel;

  const yearsExperience = pickYears(r.yearsExperience);
  if (yearsExperience) out.yearsExperience = yearsExperience;

  const roles = pickRoles(r.workExperience);
  if (roles) out.workExperience = roles;

  const highestDegree = pickEnum(r.highestDegree, DEGREES);
  if (highestDegree) out.highestDegree = highestDegree;

  const fieldOfStudy = pickString(r.fieldOfStudy);
  if (fieldOfStudy) out.fieldOfStudy = fieldOfStudy;

  const institutionName = pickString(r.institutionName);
  if (institutionName) out.institutionName = institutionName;

  const graduationYear = pickYear(r.graduationYear);
  if (graduationYear) out.graduationYear = graduationYear;

  const remotePreference = pickEnum(r.remotePreference, REMOTE_PREFERENCES);
  if (remotePreference) out.remotePreference = remotePreference;

  const salaryExpectation = pickString(r.salaryExpectation);
  if (salaryExpectation) out.salaryExpectation = salaryExpectation;

  return out;
}

export const EXTRACT_SYSTEM_PROMPT = `You are a resume parser for a job application tool. You receive the plain-text content of a resume and return exactly one JSON object with the candidate's profile fields. Return only valid JSON — no markdown, no prose, no backticks.

If the resume does not mention a field, omit that key entirely. Do not return null or empty strings for missing fields. Never guess values that are not present in the resume text.

Field rules:
- fullName: the candidate's full name as written at the top of the resume.
- phone: phone number as written.
- location: city and country/state if stated.
- linkedinUrl, portfolioUrl: only if an explicit URL appears.
- workAuthorization: one of "citizen", "permanent_resident", "visa_required". Only set if the resume states work authorization or visa sponsorship needs explicitly; otherwise omit.
- currentTitle: the candidate's most recent job title.
- experienceLevel: one of "junior", "mid", "senior", "lead". Infer from total years of experience: 0-2 = junior, 3-6 = mid, 7-10 = senior, 11+ = lead.
- yearsExperience: a string of digits representing total years of professional experience (e.g. "5"). If only job dates are given, compute from the earliest start date to the latest end date. Never include units.
- skills: array of distinct technology / tool names mentioned (e.g. ["TypeScript", "React", "AWS"]). Lowercase framework names are acceptable as written. Drop soft skills.
- industries: array of industries the candidate has worked in, inferred from the companies and roles, only if clearly implied.
- workExperience: array of objects, most recent first, each with { company, title, startDate (YYYY-MM or "YYYY-MM" pair), endDate (YYYY-MM or omit if current), current (boolean true when this is the present role), accomplishments }. accomplishments should be a single concatenated string of bullet-point achievements from the resume for that role, each separated by " | ". Provide at most the 3 most recent roles. Use ISO-ish YYYY-MM date strings when possible; if the resume writes "Jan 2023" output "2023-01".
- highestDegree: one of "high_school", "associate", "bachelor", "master", "phd", "other". The highest degree earned. Map "B.S.", "B.Sc.", "B.Tech" to "bachelor"; "M.S.", "M.Sc.", "M.B.A." to "master"; "Ph.D." to "phd"; "A.S.", "A.A.S." to "associate". Use "other" only for genuinely unrecognised qualifications.
- fieldOfStudy: the field of the highest degree (e.g. "Computer Science").
- institutionName: the school/university for the highest degree.
- graduationYear: four-digit year string (e.g. "2020").
- jobTitlesSeeking: array of job titles the candidate is targeting. Infer from the candidate's current title, skills, and seniority — produce 2-5 specific titles (e.g. ["Senior Frontend Engineer", "Full Stack Engineer"]). Never duplicate the same title.
- remotePreference: one of "remote", "onsite", "hybrid", "any". Only set if the resume explicitly signals a preference; otherwise omit.
- salaryExpectation: only if a salary expectation is explicitly stated on the resume; otherwise omit.
- preferredLocations: array of cities/regions only if the resume states preferred work locations; otherwise omit.`;
