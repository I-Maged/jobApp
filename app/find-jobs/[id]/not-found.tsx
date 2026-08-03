import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function JobNotFound() {
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

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <h1 className="text-xl font-semibold leading-7 text-text-primary">
            Job not found
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-text-secondary">
            This job may have been removed, or the link is invalid.
          </p>
          <Link
            href="/find-jobs"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark"
          >
            Go to Find Jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
