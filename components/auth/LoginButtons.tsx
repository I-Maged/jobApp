"use client";

import { useFormStatus } from "react-dom";
import { captureEvent } from "@/lib/posthog-client";
import { signInWithProvider } from "@/actions/auth";

type Provider = "google" | "github";

export function LoginButtons() {
  const handleSignIn = (provider: Provider) => {
    captureEvent("login_provider_selected", { provider });
    return signInWithProvider(provider);
  };

  return (
    <div className="flex flex-col gap-3">
      <form action={handleSignIn.bind(null, "google")}>
        <SubmitButton provider="google" />
      </form>
      <form action={handleSignIn.bind(null, "github")}>
        <SubmitButton provider="github" />
      </form>
    </div>
  );
}

function SubmitButton({ provider }: { provider: Provider }) {
  const { pending } = useFormStatus();
  const label = provider === "google" ? "Continue with Google" : "Continue with GitHub";

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-text-darkest px-5 py-3 text-sm font-medium text-on-dark transition-colors hover:bg-overlay disabled:cursor-not-allowed disabled:opacity-60"
    >
      {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
      <span>{pending ? "Redirecting…" : label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.45-1.55 4.25-5.35 4.25-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.97 4.18 14.7 3.2 12 3.2 6.95 3.2 2.85 7.3 2.85 12.35S6.95 21.5 12 21.5c6.92 0 9.6-4.85 9.6-9.3 0-.62-.07-1.1-.25-1.1z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.58 2 12.21c0 4.5 2.87 8.31 6.84 9.66.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.36-3.37-1.36-.46-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.4 9.4 0 0 1 12 7.05c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49C19.14 20.52 22 16.7 22 12.21 22 6.58 17.52 2 12 2z"
      />
    </svg>
  );
}
