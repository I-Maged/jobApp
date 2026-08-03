export type ExperienceLevel = "junior" | "mid" | "senior" | "lead";

export type RemotePreference = "remote" | "onsite" | "hybrid" | "any";

export type WorkAuthorization =
  | "citizen"
  | "permanent_resident"
  | "visa_required";

export type HighestDegree =
  | "high_school"
  | "associate"
  | "bachelor"
  | "master"
  | "phd"
  | "other";

export type WorkExperienceRole = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  accomplishments: string;
};

export type Education = {
  highestDegree: HighestDegree | "";
  fieldOfStudy: string | null;
  institutionName: string | null;
  graduationYear: string | null;
};

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: WorkAuthorization;
  currentTitle: string;
  experienceLevel: ExperienceLevel | "";
  yearsExperience: number;
  skills: string[];
  industries: string[];
  workExperience: WorkExperienceRole[];
  education: Education;
  jobTitlesSeeking: string[];
  remotePreference: RemotePreference;
  salaryExpectation: string;
  preferredLocations: string[];
  resumePdfUrl: string | null;
  isComplete: boolean;
};

export type ProfileFormState = {
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

export const EMPTY_EDUCATION: Education = {
  highestDegree: "",
  fieldOfStudy: "",
  institutionName: "",
  graduationYear: "",
};

export type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: "0" | "1";
  contract_type?: string;
  created: string;
  category?: { tag: string; label: string };
};

export type ScoredJob = {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export type Job = {
  id: string;
  run_id: string | null;
  user_id: string;
  source: "search" | "url";
  source_url: string;
  external_apply_url: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  job_type: string;
  about_role: string;
  responsibilities: string[] | null;
  requirements: string[] | null;
  nice_to_have: string[] | null;
  benefits: string[] | null;
  about_company: string | null;
  match_score: number;
  match_reason: string;
  matched_skills: string[];
  missing_skills: string[];
  company_research: Record<string, unknown> | null;
  found_at: string;
};


