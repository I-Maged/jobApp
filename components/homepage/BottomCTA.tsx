import Link from "next/link";

export function BottomCTA() {
  return (
    <section className="w-full bg-surface">
      <div className="mx-auto max-w-[1440px] px-8 py-20 md:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-accent-muted px-8 py-16 text-center md:px-12">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-darkest md:text-4xl">
            Your next job search can feel a lot less overwhelming
          </h2>
          <p className="mt-4 text-base leading-6 text-text-secondary md:text-lg">
            Set up your profile, upload your resume, and start finding matches in minutes.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-text-darkest px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay"
            >
              Get Started
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              Find Your First Match
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
