"use client";

import { useMemo, useState } from "react";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JOBS_PAGE_SIZE } from "@/lib/utils";
import { filterAndSortJobs } from "@/lib/jobs-view";
import type { MatchTier, SortKey } from "@/lib/jobs-view";
import type { Job } from "@/types";

type Props = {
  userId: string;
  initialJobs: Job[];
};

export function FindJobsClient({ userId, initialJobs }: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [filterText, setFilterText] = useState("");
  const [matchTier, setMatchTier] = useState<MatchTier>("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      filterAndSortJobs(jobs, {
        text: filterText,
        tier: matchTier,
        sort: sortKey,
      }),
    [jobs, filterText, matchTier, sortKey],
  );

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / JOBS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * JOBS_PAGE_SIZE;
  const visibleRows = filtered.slice(start, start + JOBS_PAGE_SIZE);

  const handleResults = (results: Job[]) => {
    setJobs((prev) => [...results, ...prev]);
    setPage(1);
  };

  const handleFilterTextChange = (value: string) => {
    setFilterText(value);
    setPage(1);
  };

  const handleMatchTierChange = (tier: MatchTier) => {
    setMatchTier(tier);
    setPage(1);
  };

  const handleSortKeyChange = (sort: SortKey) => {
    setSortKey(sort);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <SearchControls userId={userId} onResults={handleResults} />
      <JobsTable
        rows={visibleRows}
        hasJobs={jobs.length > 0}
        filterText={filterText}
        onFilterTextChange={handleFilterTextChange}
        matchTier={matchTier}
        onMatchTierChange={handleMatchTierChange}
        sortKey={sortKey}
        onSortKeyChange={handleSortKeyChange}
      />
      <JobsPagination
        page={safePage}
        pageSize={JOBS_PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </div>
  );
}
