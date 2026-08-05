import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { getCurrentUser } from "@/lib/get-current-user";
import { fetchProfile } from "@/lib/profile-data";
import { calculateCompletion, REQUIRED_LABELS } from "@/lib/completion";
import { EMPTY_EDUCATION, type ProfileFormState } from "@/types";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = user ? await fetchProfile(user.id) : null;

  const completion = profile
    ? calculateCompletion(profile)
    : { percent: 0, isComplete: false, missing: Object.values(REQUIRED_LABELS) };

  const initialEmail = profile?.email ?? user?.email ?? "";
  const initial: ProfileFormState = {
    fullName: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
    workAuthorization: profile?.workAuthorization ?? "citizen",
    currentTitle: profile?.currentTitle ?? "",
    experienceLevel: profile?.experienceLevel ?? "",
    yearsExperience: profile?.yearsExperience
      ? profile.yearsExperience.toString()
      : "",
    skillsCsv: profile?.skills.join(", ") ?? "",
    industriesCsv: profile?.industries.join(", ") ?? "",
    workExperience: profile?.workExperience ?? [],
    highestDegree: profile?.education.highestDegree ?? EMPTY_EDUCATION.highestDegree,
    fieldOfStudy: profile?.education.fieldOfStudy ?? "",
    institutionName: profile?.education.institutionName ?? "",
    graduationYear: profile?.education.graduationYear ?? "",
    jobTitlesSeekingCsv: profile?.jobTitlesSeeking.join(", ") ?? "",
    remotePreference: profile?.remotePreference ?? "any",
    salaryExpectation: profile?.salaryExpectation ?? "",
    preferredLocationsCsv: profile?.preferredLocations.join(", ") ?? "",
  };

  const hasResume = Boolean(profile?.resumePdfUrl);
  const resumeUrl = profile?.resumePdfUrl ?? null;

  return (
    <main className="w-full bg-background">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-6 py-8 md:px-8 md:py-10">
        <header className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold leading-7 text-text-primary">
                {completion.isComplete ? "Profile complete" : "Profile needs attention"}
              </h1>
              <p className="max-w-2xl text-sm leading-5 text-text-secondary">
                {completion.isComplete
                  ? "Tailored matches and resume generation are unlocked."
                  : "Complete the missing fields to improve your chance of getting tailored matches and generating quality resumes."}
              </p>
            </div>
            <CompletionIndicator
              percent={completion.percent}
              missingLabels={completion.missing}
            />
          </div>
        </header>

        <ResumeUpload hasResume={hasResume} resumeUrl={resumeUrl} />

        <ProfileForm
          initialEmail={initialEmail}
          initial={initial}
          hasResume={hasResume}
        />
      </div>
    </main>
  );
}
