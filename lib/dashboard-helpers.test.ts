import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCountSeries,
  buildMatchDistribution,
  buildMatchDistributionQuery,
  formatTimeAgo,
  toDayKey,
} from "@/lib/dashboard-data";

const NOW = new Date("2026-08-06T12:00:00.000Z");

afterEach(() => {
  vi.useRealTimers();
});

describe("formatTimeAgo", () => {
  it("returns Just now for fresh, future and invalid timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatTimeAgo("2026-08-06T12:00:00.000Z")).toBe("Just now");
    expect(formatTimeAgo("2026-08-06T12:05:00.000Z")).toBe("Just now");
    expect(formatTimeAgo("garbage")).toBe("Just now");
  });

  it("formats minutes, hours, days and the date fallback", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatTimeAgo("2026-08-06T11:58:00.000Z")).toBe("2m ago");
    expect(formatTimeAgo("2026-08-06T09:00:00.000Z")).toBe("3h ago");
    expect(formatTimeAgo("2026-08-05T09:00:00.000Z")).toBe("Yesterday");
    expect(formatTimeAgo("2026-08-03T09:00:00.000Z")).toBe("3 days ago");
    expect(formatTimeAgo("2026-07-30T09:00:00.000Z")).toBe("Jul 30");
  });
});

describe("toDayKey", () => {
  it("converts epoch seconds, iso strings and bare dates to YYYY-MM-DD", () => {
    expect(toDayKey(1751472000)).toBe("2025-07-02");
    expect(toDayKey("2026-08-01T00:00:00.000Z")).toBe("2026-08-01");
    expect(toDayKey("2026-08-01")).toBe("2026-08-01");
  });

  it("returns null for invalid input", () => {
    expect(toDayKey(null)).toBeNull();
    expect(toDayKey("garbage")).toBeNull();
    expect(toDayKey(undefined)).toBeNull();
  });
});

describe("buildCountSeries", () => {
  it("zero-fills the full window and merges counts by UTC day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T00:00:00.000Z"));

    const rows: unknown[][] = [
      ["2026-08-01", 2],
      ["2026-08-05", 4],
    ];
    const series = buildCountSeries(rows, 30);

    expect(series).toHaveLength(30);
    expect(series[0].label).toBe("7/8");
    expect(series[29].label).toBe("8/6");
    const aug1 = series.find((p) => p.label === "8/1");
    expect(aug1?.value).toBe(2);
    const aug5 = series.find((p) => p.label === "8/5");
    expect(aug5?.value).toBe(4);
    const others = series.filter((p) => p.label !== "8/1" && p.label !== "8/5");
    expect(others.every((p) => p.value === 0)).toBe(true);
  });
});

describe("buildMatchDistribution", () => {
  it("maps rows into the five fixed buckets and drops unknown keys", () => {
    const points = buildMatchDistribution([
      ["50-60", 3],
      ["90-100", 1],
      ["70-80", 0],
      ["unknown", 5],
    ]);
    expect(points).toEqual([
      { label: "50-60%", value: 3 },
      { label: "60-70%", value: 0 },
      { label: "70-80%", value: 0 },
      { label: "80-90%", value: 0 },
      { label: "90-100%", value: 1 },
    ]);
  });
});

describe("buildMatchDistributionQuery", () => {
  it("emits ordered CASE branches, the user filter and the score floor", () => {
    const query = buildMatchDistributionQuery("user-1");
    expect(query).toContain(`WHEN properties.matchScore >= 90 THEN '90-100'`);
    expect(query).toContain(`WHEN properties.matchScore >= 80 THEN '80-90'`);
    expect(query).toContain(`ELSE '50-60'`);
    expect(query).toContain(`distinct_id = 'user-1'`);
    expect(query).toContain(`event = 'job_found'`);
    expect(query).toContain(`properties.matchScore >= 50`);
  });
});
