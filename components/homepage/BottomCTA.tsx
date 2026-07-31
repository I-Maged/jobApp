import { AuthAwareCTAs } from "@/components/auth/AuthAwareCTAs";

export function BottomCTA() {
  return (
    <section className="w-full bg-surface">
      <div className="mx-auto max-w-[1440px] px-8 py-20 md:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-accent-muted px-8 py-16 text-center md:px-12">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-primary md:text-4xl">
            Your next job search can feel a lot less overwhelming
          </h2>
          <p className="mt-4 text-base leading-6 text-text-secondary md:text-lg">
            Set up your profile, upload your resume, and start finding matches in minutes.
          </p>

          <AuthAwareCTAs variant="bottom" />
        </div>
      </div>
    </section>
  );
}
