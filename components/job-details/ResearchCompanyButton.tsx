"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

type Props = {
  jobId: string;
  company: string;
};

export function ResearchCompanyButton({ jobId, company }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  const handleResearch = () => {
    if (isPending) return;

    setErrorMessage("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });

        const json = (await res.json()) as {
          success: boolean;
          error?: string;
        };

        if (!res.ok || !json.success) {
          setErrorMessage(json.error || "Research failed. Please try again.");
          return;
        }

        router.refresh();
      } catch {
        setErrorMessage("Research failed. Please try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleResearch}
        disabled={isPending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Researching…
          </>
        ) : (
          "Research Company"
        )}
      </button>
      {isPending && (
        <p className="max-w-md text-sm leading-5 text-text-secondary">
          Browsing {company}&apos;s public pages and building your dossier.
          This can take about a minute.
        </p>
      )}
      {errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}
    </>
  );
}
