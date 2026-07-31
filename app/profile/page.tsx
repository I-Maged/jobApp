import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  const initialEmail = user?.email ?? "";
  const initialFullName = "";
  const mockCompletion = 70;
  const mockMissing = ["PHONE", "LOCATION", "EDUCATION"];

  return (
    <main className="w-full bg-background">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-6 py-8 md:px-8 md:py-10">
        <header className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold leading-7 text-text-primary">
                Profile needs attention
              </h1>
              <p className="max-w-2xl text-sm leading-5 text-text-secondary">
                Complete the missing fields to improve your chance of getting
                tailored matches and generating quality resumes.
              </p>
            </div>
            <CompletionIndicator
              percent={mockCompletion}
              missingLabels={mockMissing}
            />
          </div>
        </header>

        <ResumeUpload />

        <ProfileForm
          initialEmail={initialEmail}
          initialFullName={initialFullName}
          hasResume={false}
        />
      </div>
    </main>
  );
}
