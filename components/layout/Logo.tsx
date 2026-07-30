import Link from "next/link";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
};

export function Logo({ href = "/", size = "md", showText = true }: Props) {
  const dimensions = {
    sm: { box: "h-8 w-8", radius: "rounded-lg", text: "text-base" },
    md: { box: "h-9 w-9", radius: "rounded-[10px]", text: "text-[19px]" },
    lg: { box: "h-12 w-12", radius: "rounded-xl", text: "text-2xl" },
  }[size];

  const content = (
    <span className="flex items-center gap-2">
      <span
        className={`${dimensions.box} ${dimensions.radius} flex items-center justify-center`}
        style={{
          background: "linear-gradient(45deg, #7C5CFC 0%, #4A2EC5 100%)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            d="M12 2L2 7v6c0 5 4 9 10 11 6-2 10-6 10-11V7l-10-5z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showText && (
        <span className={`font-bold ${dimensions.text} text-text-darkest leading-7`}>
          JobPilot
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
