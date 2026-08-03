"use client";

import { useState } from "react";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import type { Job } from "@/types";

type Props = {
  userId: string;
};

export function FindJobsClient({ userId }: Props) {
  const [jobs, setJobs] = useState<Job[] | undefined>(undefined);

  return (
    <div className="flex flex-col gap-6">
      <SearchControls userId={userId} onResults={setJobs} />
      <JobsTable jobs={jobs} />
      <JobsPagination />
    </div>
  );
}
