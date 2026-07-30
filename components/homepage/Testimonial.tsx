import Image from "next/image";

export function Testimonial() {
  return (
    <section className="w-full bg-background">
      <div className="mx-auto max-w-[1440px] px-8 py-20 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-10 w-10 text-accent"
            aria-hidden="true"
          >
            <path
              d="M9.333 22.667H4l3.334-8c.886-2.13 2.917-3.334 5-3.334v3.334c-1.103 0-2.13.59-2.5 1.666L9.333 18h2.5v4.667H9.333zm14.667 0h-5.334l3.334-8c.886-2.13 2.917-3.334 5-3.334v3.334c-1.104 0-2.13.59-2.5 1.666L24 18h2.5v4.667H24z"
              fill="currentColor"
            />
          </svg>

          <blockquote className="mt-8 text-2xl font-medium leading-snug text-text-primary md:text-3xl">
            &ldquo;I used to spend my evenings copy-pasting resumes. Now I open my dashboard to see interviews waiting. It feels like cheating. Had 3 offers on the table simultaneously.&rdquo;
          </blockquote>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
              <Image
                src="/images/user-icon.png"
                alt="Tom Wilson"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-text-primary">
                Tom Wilson
              </span>
              <span className="text-xs text-text-secondary">
                Frontend Developer
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
