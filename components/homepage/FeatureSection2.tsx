import { AgentLog } from "./AgentLog";

type Feature = {
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    title: "Understand your match score",
    description: "See how your profile aligns with each role before applying.",
  },
  {
    title: "AI-Powered Job Matching",
    description: "Automatically scores roles against your actual skills.",
  },
  {
    title: "Focus on the right roles",
    description: "Filter out low-fit jobs to save time.",
  },
];

export function FeatureSection2() {
  return (
    <section className="w-full bg-surface">
      <div className="mx-auto max-w-[1440px] px-8 py-20 md:py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-darkest md:text-4xl">
            Apply With More Confidence, Every Time
          </h2>
        </div>

        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <AgentLog />
          </div>

          <div className="flex flex-col gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <span
                  className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      "linear-gradient(45deg, rgba(124,92,252,0.15) 0%, rgba(74,46,197,0.15) 100%)",
                  }}
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12l4 4L19 6"
                      stroke="#7C5CFC"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold leading-6 text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-6 text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
