import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="w-full bg-background">
      <div className="mx-auto max-w-[1440px] px-8 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-darkest md:text-6xl">
            Job hunting is hard. Your tools shouldn&apos;t be.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-6 text-text-secondary md:text-lg md:leading-7">
            Stop applying blind. JobPilot finds the jobs, researches the companies, and gives you everything you need to stand out.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
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

        <div className="mt-16 md:mt-20">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_48px_-12px_rgba(16,24,40,0.18)]">
            <Image
              src="/images/dashboard-demo.png"
              alt="JobPilot dashboard preview"
              width={2394}
              height={1208}
              priority
              className="block w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
