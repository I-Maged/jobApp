import type { ReactNode } from "react";

type ErrorBannerProps = {
  children: ReactNode;
};

export function ErrorBanner({ children }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-error bg-surface px-4 py-2.5 text-sm font-medium text-error"
    >
      {children}
    </div>
  );
}
