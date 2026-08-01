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
