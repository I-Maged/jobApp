import Image from "next/image";
import { AuthAwareCTAs } from "@/components/auth/AuthAwareCTAs";

export function Hero() {
  return (
    <section className="w-full bg-background">
      <div className="mx-auto max-w-[1440px] px-8 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary md:text-6xl">
            Job hunting is hard. Your tools shouldn&apos;t be.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-6 text-text-secondary md:text-lg md:leading-7">
            Stop applying blind. JobPilot finds the jobs, researches the companies, and gives you everything you need to stand out.
          </p>

          <AuthAwareCTAs variant="hero" />
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
