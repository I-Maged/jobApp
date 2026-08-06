import { describe, expect, it } from "vitest";
import { formatSalary, mapToJobInsert } from "@/lib/jobs-insert";
import { makeAdzunaJob, makeScoredJob } from "@/tests/fixtures/jobs";

describe("formatSalary", () => {
  it("formats a min-max range in thousands", () => {
    expect(formatSalary(makeAdzunaJob({ salary_min: 120000, salary_max: 150000 }))).toBe("$120k - $150k");
  });

  it("formats a single value when only min is present", () => {
    expect(formatSalary(makeAdzunaJob({ salary_min: 120000, salary_max: null }))).toBe("$120k");
  });

  it("formats an upper bound when only max is present", () => {
    expect(formatSalary(makeAdzunaJob({ salary_min: null, salary_max: 150000 }))).toBe("Up to $150k");
  });

  it("collapses equal min and max to a single value", () => {
    expect(formatSalary(makeAdzunaJob({ salary_min: 120000, salary_max: 120000 }))).toBe("$120k");
  });

  it("returns null when both bounds are missing", () => {
    expect(formatSalary(makeAdzunaJob({ salary_min: null, salary_max: null }))).toBeNull();
  });

  it("treats a non-positive min as an upper-bound only", () => {
    expect(formatSalary(makeAdzunaJob({ salary_min: 0, salary_max: 150000 }))).toBe("Up to $150k");
  });

  it("rounds to the nearest thousand", () => {
    expect(formatSalary(makeAdzunaJob({ salary_min: 120500, salary_max: 151500 }))).toBe("$121k - $152k");
  });
});

describe("mapToJobInsert", () => {
  it("maps adzuna + scored job into a search-sourced insert row", () => {
    const row = mapToJobInsert(
      makeAdzunaJob({ contract_type: "permanent" }),
      makeScoredJob(),
      "user-1",
      "run-1",
    );
    expect(row).toMatchObject({
      run_id: "run-1",
      user_id: "user-1",
      source: "search",
      source_url: "https://www.adzuna.com/jobs/redirect/1",
      external_apply_url: "https://www.adzuna.com/jobs/redirect/1",
      title: "Senior Frontend Engineer",
      company: "Stripe",
      location: "New York",
      salary: "$120k - $150k",
      job_type: "permanent",
      match_score: 85,
      match_reason: "Strong fit on frontend skills and React experience.",
      matched_skills: ["TypeScript", "React"],
      missing_skills: ["GraphQL"],
    });
    expect(row.responsibilities).toBeNull();
    expect(row.requirements).toBeNull();
    expect(row.nice_to_have).toBeNull();
    expect(row.benefits).toBeNull();
    expect(row.about_company).toBeNull();
    expect(row.company_research).toBeNull();
  });

  it("defaults missing company, location and contract type", () => {
    const row = mapToJobInsert(
      makeAdzunaJob({
        company: undefined as never,
        location: undefined as never,
        contract_type: undefined,
      }),
      makeScoredJob(),
      "user-1",
      "run-1",
    );
    expect(row.company).toBe("Unknown");
    expect(row.location).toBe("Unknown");
    expect(row.job_type).toBe("fulltime");
  });

  it("nulls the salary when adzuna provides no bounds", () => {
    const row = mapToJobInsert(
      makeAdzunaJob({ salary_min: null, salary_max: null }),
      makeScoredJob(),
      "user-1",
      "run-1",
    );
    expect(row.salary).toBeNull();
  });
});
