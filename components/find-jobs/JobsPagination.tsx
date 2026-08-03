"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

function getPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const candidates = new Set<number>([
    1,
    total,
    current - 1,
    current,
    current + 1,
  ]);
  const pages = [...candidates]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const list: (number | "…")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) list.push("…");
    list.push(p);
    prev = p;
  }
  return list;
}

export function JobsPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Props) {
  if (totalCount === 0) return null;

  const totalPages = Math.ceil(totalCount / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-text-secondary">
        Showing <span className="font-medium text-text-primary">{start}</span>{" "}
        to <span className="font-medium text-text-primary">{end}</span> of{" "}
        <span className="font-medium text-text-primary">{totalCount}</span>{" "}
        results
      </p>
      <div className="flex items-center gap-0 rounded-md border border-border bg-surface">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        {getPageList(page, totalPages).map((item, index) =>
          item === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="border-l border-border px-3 py-1.5 text-sm text-text-muted"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`border-l border-border px-3 py-1.5 text-sm transition-colors ${
                item === page
                  ? "bg-accent-muted font-medium text-on-accent-tint"
                  : "text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 border-l border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
