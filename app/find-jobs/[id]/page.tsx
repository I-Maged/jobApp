import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/get-current-user";
import { fetchJob } from "@/lib/jobs-data";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchScore } from "@/components/job-details/MatchScore";
import { JobDescription } from "@/components/job-details/JobDescription";
import { CompanyResearch } from "@/components/job-details/CompanyResearch";

export const metadata: Metadata = {
  title: "Job Details",
};

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const job = user ? await fetchJob(id, user.id) : null;

  if (!job) {
    notFound();
  }

  return (
    <main className="w-full bg-background">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-8 md:px-8 md:py-10">
        <Link
          href="/find-jobs"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Jobs
        </Link>

        <JobInfo job={job} />
        <MatchScore job={job} />
        <JobDescription job={job} />
        <CompanyResearch
          research={job.company_research}
          company={job.company}
          jobId={job.id}
        />
      </div>
    </main>
  );
}
