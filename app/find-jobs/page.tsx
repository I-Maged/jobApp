import type { Metadata } from "next";
import Link from "next/link";
import { FindJobsClient } from "@/components/find-jobs/FindJobsClient";
import { getCurrentUser } from "@/lib/get-current-user";

export const metadata: Metadata = {
  title: "Find Jobs",
};

export default async function FindJobsPage() {
  const user = await getCurrentUser();

  return (
    <main className="w-full bg-background">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold leading-7 text-text-primary">
            Find Jobs
          </h1>
          <p className="text-sm leading-5 text-text-secondary">
            Search Adzuna&apos;s job listings, scored against your profile by
            the agent.
          </p>
        </div>

        <FindJobsClient userId={user?.id ?? ""} />

        <p className="text-xs text-text-muted">
          Jobs by{" "}
          <Link
            href="https://www.adzuna.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary underline decoration-text-muted underline-offset-2 transition-colors hover:text-accent"
          >
            Adzuna
          </Link>
        </p>
      </div>
    </main>
  );
}
