import { describe, expect, it } from "vitest";
import {
  filterAndSortJobs,
  formatDate,
  getScoreTier,
  toDisplayJob,
} from "@/lib/jobs-view";
import { makeJob } from "@/tests/fixtures/jobs";

describe("toDisplayJob", () => {
  it("maps job fields to display fields", () => {
    const job = makeJob();
    expect(toDisplayJob(job)).toEqual({
      id: "job-1",
      company: "Stripe",
      role: "Senior Frontend Engineer",
      matchScore: 85,
      salary: "$120k - $150k",
      source: "Adzuna",
      dateFound: "2026-08-01T00:00:00.000Z",
    });
  });

  it("maps null salary to N/A", () => {
    expect(toDisplayJob(makeJob({ salary: null })).salary).toBe("N/A");
  });

  it("maps url source to URL badge", () => {
    expect(toDisplayJob(makeJob({ source: "url" })).source).toBe("URL");
  });
});

describe("getScoreTier", () => {
  it("classifies by MATCH_THRESHOLD boundaries", () => {
    expect(getScoreTier(100)).toBe("high");
    expect(getScoreTier(70)).toBe("high");
    expect(getScoreTier(69)).toBe("mid");
    expect(getScoreTier(60)).toBe("mid");
    expect(getScoreTier(59)).toBe("low");
    expect(getScoreTier(0)).toBe("low");
  });
});

describe("formatDate", () => {
  it("formats an ISO date as Mon D, YYYY", () => {
    expect(formatDate("2026-08-05T12:00:00.000Z")).toMatch(/^Aug \d{1,2}, 2026$/);
  });
});

describe("filterAndSortJobs", () => {
  const stripe = makeJob({
    id: "1",
    company: "Stripe",
    title: "Frontend Engineer",
    match_score: 92,
    found_at: "2026-08-01T00:00:00.000Z",
  });
  const google = makeJob({
    id: "2",
    company: "Google",
    title: "Backend Engineer",
    match_score: 55,
    found_at: "2026-08-03T00:00:00.000Z",
  });
  const linear = makeJob({
    id: "3",
    company: "Linear",
    title: "Full Stack Engineer",
    match_score: 70,
    found_at: "2026-08-02T00:00:00.000Z",
  });
  const jobs = [stripe, google, linear];

  it("returns all jobs mapped when no filters applied", () => {
    const result = filterAndSortJobs(jobs, { text: "", tier: "all", sort: "score" });
    expect(result).toHaveLength(3);
  });

  it("filters by text case-insensitively across company and title", () => {
    expect(filterAndSortJobs(jobs, { text: "STRIPE", tier: "all", sort: "score" })).toHaveLength(1);
    expect(
      filterAndSortJobs(jobs, { text: "engineer", tier: "all", sort: "score" }),
    ).toHaveLength(3);
    expect(filterAndSortJobs(jobs, { text: "  backend  ", tier: "all", sort: "score" })[0].company).toBe("Google");
  });

  it("filters by high tier using MATCH_THRESHOLD", () => {
    const result = filterAndSortJobs(jobs, { text: "", tier: "high", sort: "score" });
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("filters by low tier", () => {
    const result = filterAndSortJobs(jobs, { text: "", tier: "low", sort: "score" });
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("sorts by match score descending", () => {
    const result = filterAndSortJobs(jobs, { text: "", tier: "all", sort: "score" });
    expect(result.map((r) => r.matchScore)).toEqual([92, 70, 55]);
  });

  it("sorts by newest first", () => {
    const result = filterAndSortJobs(jobs, { text: "", tier: "all", sort: "newest" });
    expect(result.map((r) => r.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by oldest first", () => {
    const result = filterAndSortJobs(jobs, { text: "", tier: "all", sort: "oldest" });
    expect(result.map((r) => r.id)).toEqual(["1", "3", "2"]);
  });

  it("combines text and tier filters", () => {
    const result = filterAndSortJobs(jobs, { text: "engineer", tier: "high", sort: "score" });
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });
});
