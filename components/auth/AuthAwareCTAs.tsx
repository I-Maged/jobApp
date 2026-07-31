"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkSessionAction, signOutAction } from "@/actions/auth";

type Variant = "hero" | "bottom" | "navbar";

type Props = {
  variant: Variant;
};

export function AuthAwareCTAs({ variant }: Props) {
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkSessionAction()
      .then((res) => {
        if (!cancelled) {
          setSignedIn(res.signedIn);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSignedIn(false);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (variant === "navbar") {
    if (!ready) {
      return (
        <span className="inline-flex h-9 w-24 items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-accent-foreground opacity-60">
          &nbsp;
        </span>
      );
    }
    if (signedIn) {
      return (
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay"
          >
            Sign Out
          </button>
        </form>
      );
    }
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay"
      >
        Start For Free
      </Link>
    );
  }

  const targetHref = signedIn ? "/dashboard" : "/login";

  if (variant === "hero") {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href={targetHref}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-text-darkest px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay"
        >
          {signedIn ? "Open Dashboard" : "Get Started"}
          <span aria-hidden="true">&rarr;</span>
        </Link>
        <Link
          href={targetHref}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
        >
          {signedIn ? "Find Your Next Match" : "Find Your First Match"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
      <Link
        href={targetHref}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-text-darkest px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay"
      >
        {signedIn ? "Open Dashboard" : "Get Started"}
        <span aria-hidden="true">&rarr;</span>
      </Link>
      <Link
        href={targetHref}
        className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
      >
        {signedIn ? "Find Your Next Match" : "Find Your First Match"}
      </Link>
    </div>
  );
}
