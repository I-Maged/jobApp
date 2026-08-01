import type { Profile } from "@/types";

export const REQUIRED_LABELS = {
  fullName: "FULL NAME",
  phone: "PHONE",
  location: "LOCATION",
  currentTitle: "CURRENT TITLE",
  experienceLevel: "EXPERIENCE LEVEL",
  yearsExperience: "YEARS",
  skills: "SKILLS",
  educationDegree: "DEGREE",
  educationField: "FIELD OF STUDY",
  jobTitlesSeeking: "TITLES SEEKING",
  remotePreference: "REMOTE PREF",
} as const;

const REQUIRED_FIELD_COUNT = 11;

export type CompletionResult = {
  percent: number;
  isComplete: boolean;
  missing: string[];
};

export function calculateCompletion(profile: Profile): CompletionResult {
  const missing: string[] = [];

  if (!profile.fullName.trim()) missing.push(REQUIRED_LABELS.fullName);
  if (!profile.phone.trim()) missing.push(REQUIRED_LABELS.phone);
  if (!profile.location.trim()) missing.push(REQUIRED_LABELS.location);
  if (!profile.currentTitle.trim()) missing.push(REQUIRED_LABELS.currentTitle);
  if (!profile.experienceLevel) missing.push(REQUIRED_LABELS.experienceLevel);
  if (!profile.yearsExperience) missing.push(REQUIRED_LABELS.yearsExperience);
  if (profile.skills.length === 0) missing.push(REQUIRED_LABELS.skills);
  if (!profile.education.highestDegree) missing.push(REQUIRED_LABELS.educationDegree);
  if (!profile.education.fieldOfStudy || !profile.education.fieldOfStudy.trim())
    missing.push(REQUIRED_LABELS.educationField);
  if (profile.jobTitlesSeeking.length === 0) missing.push(REQUIRED_LABELS.jobTitlesSeeking);
  if (!profile.remotePreference) missing.push(REQUIRED_LABELS.remotePreference);

  const satisfied = REQUIRED_FIELD_COUNT - missing.length;
  const percent = Math.round((satisfied / REQUIRED_FIELD_COUNT) * 100);
  return { percent, isComplete: missing.length === 0, missing };
}
