import { describe, expect, it } from "vitest";
import { MATCH_THRESHOLD, JOBS_PAGE_SIZE } from "@/lib/utils";

describe("lib/utils", () => {
  it("exposes the shared constants", () => {
    expect(MATCH_THRESHOLD).toBe(70);
    expect(JOBS_PAGE_SIZE).toBe(20);
  });
});
