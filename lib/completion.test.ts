import { describe, expect, it } from "vitest";
import { calculateCompletion, REQUIRED_LABELS } from "@/lib/completion";
import { makeProfile, makeMinimalProfile } from "@/tests/fixtures/profiles";

describe("calculateCompletion", () => {
  it("returns 100% and isComplete for a complete profile", () => {
    const result = calculateCompletion(makeProfile());
    expect(result.percent).toBe(100);
    expect(result.isComplete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("returns ~9% for a freshly created profile with all fields empty", () => {
    const result = calculateCompletion(makeMinimalProfile());
    expect(result.percent).toBe(9);
    expect(result.isComplete).toBe(false);
    expect(result.missing).toHaveLength(10);
    expect(result.missing).not.toContain(REQUIRED_LABELS.remotePreference);
  });

  it("flags each individual required field", () => {
    const cases: Array<[Partial<Parameters<typeof makeProfile>[0]>, string]> = [
      [{ fullName: "   " }, REQUIRED_LABELS.fullName],
      [{ phone: "" }, REQUIRED_LABELS.phone],
      [{ location: "  " }, REQUIRED_LABELS.location],
      [{ currentTitle: "" }, REQUIRED_LABELS.currentTitle],
      [{ experienceLevel: "" }, REQUIRED_LABELS.experienceLevel],
      [{ yearsExperience: 0 }, REQUIRED_LABELS.yearsExperience],
      [{ skills: [] }, REQUIRED_LABELS.skills],
      [{ jobTitlesSeeking: [] }, REQUIRED_LABELS.jobTitlesSeeking],
    ];

    for (const [overrides, label] of cases) {
      const result = calculateCompletion(makeProfile(overrides));
      expect(result.isComplete).toBe(false);
      expect(result.missing).toContain(label);
    }
  });

  it("does not flag the remotePreference default", () => {
    const result = calculateCompletion(makeMinimalProfile());
    expect(result.missing).not.toContain(REQUIRED_LABELS.remotePreference);
  });

  it("flags a falsy remotePreference when present", () => {
    // The type excludes "", but the guard runs defensively for rows
    // that predate the remotePreference default, so lock it in.
    const profile = { ...makeProfile(), remotePreference: "" as never };
    const result = calculateCompletion(profile);
    expect(result.missing).toContain(REQUIRED_LABELS.remotePreference);
  });

  it("flags missing education fields", () => {
    const result = calculateCompletion(
      makeProfile({
        education: {
          highestDegree: "",
          fieldOfStudy: null,
          institutionName: null,
          graduationYear: null,
        },
      }),
    );
    expect(result.missing).toContain(REQUIRED_LABELS.educationDegree);
    expect(result.missing).toContain(REQUIRED_LABELS.educationField);
  });

  it("treats whitespace-only education field as missing", () => {
    const result = calculateCompletion(
      makeProfile({
        education: {
          highestDegree: "bachelor",
          fieldOfStudy: "  ",
          institutionName: null,
          graduationYear: null,
        },
      }),
    );
    expect(result.missing).toContain(REQUIRED_LABELS.educationField);
  });

  it("rounds the completion percent to the nearest integer", () => {
    const result = calculateCompletion(makeProfile({ phone: "" }));
    expect(result.percent).toBe(Math.round((10 / 11) * 100));
  });
});
