import { describe, expect, it } from "vitest";
import { buildExtractedProfile } from "@/lib/profile-extract";
import type { ProfileFormState } from "@/types";

const validInput = {
  fullName: "  Jane Doe ",
  phone: "555-0100",
  location: "Austin, TX",
  linkedinUrl: "https://linkedin.com/in/jane",
  portfolioUrl: "https://jane.dev",
  workAuthorization: "citizen",
  currentTitle: "Frontend Engineer",
  experienceLevel: "mid",
  yearsExperience: "5",
  skills: ["TypeScript", "React"],
  industries: ["SaaS", "Fintech"],
  workExperience: [
    {
      company: "Acme",
      title: "Engineer",
      startDate: "2021-01",
      endDate: "",
      current: true,
      accomplishments: "Built things",
    },
  ],
  highestDegree: "bachelor",
  fieldOfStudy: "Computer Science",
  institutionName: "UT",
  graduationYear: "2020",
  jobTitlesSeeking: ["Frontend Engineer"],
  remotePreference: "remote",
  salaryExpectation: "$150k",
  preferredLocations: ["Austin, TX"],
};

describe("buildExtractedProfile", () => {
  it("maps a valid payload into form state", () => {
    const result = buildExtractedProfile(validInput);
    expect(result).toMatchObject<Partial<ProfileFormState>>({
      fullName: "Jane Doe",
      phone: "555-0100",
      location: "Austin, TX",
      workAuthorization: "citizen",
      currentTitle: "Frontend Engineer",
      experienceLevel: "mid",
      yearsExperience: "5",
      skillsCsv: "TypeScript, React",
      industriesCsv: "SaaS, Fintech",
      highestDegree: "bachelor",
      fieldOfStudy: "Computer Science",
      institutionName: "UT",
      graduationYear: "2020",
      jobTitlesSeekingCsv: "Frontend Engineer",
      remotePreference: "remote",
      salaryExpectation: "$150k",
      preferredLocationsCsv: "Austin, TX",
    });
  });

  it("returns an empty object for null and non-object inputs", () => {
    expect(buildExtractedProfile(null)).toEqual({});
    expect(buildExtractedProfile("nope")).toEqual({});
    expect(buildExtractedProfile(42)).toEqual({});
    expect(buildExtractedProfile([])).toEqual({});
  });

  it("rejects invalid enum values", () => {
    const result = buildExtractedProfile({
      ...validInput,
      workAuthorization: "superhero",
      experienceLevel: "god",
      remotePreference: "mars",
      highestDegree: "wizard",
    });
    expect(result.workAuthorization).toBeUndefined();
    expect(result.experienceLevel).toBeUndefined();
    expect(result.remotePreference).toBeUndefined();
    expect(result.highestDegree).toBeUndefined();
  });

  it("drops invalid yearsExperience values", () => {
    for (const value of ["-1", "abc", "71", "5.5", "  "]) {
      expect(buildExtractedProfile({ ...validInput, yearsExperience: value }).yearsExperience).toBeUndefined();
    }
    for (const value of ["0", "70", "5"]) {
      expect(buildExtractedProfile({ ...validInput, yearsExperience: value }).yearsExperience).toBe(value);
    }
  });

  it("only accepts 19xx/20xx graduation years", () => {
    expect(buildExtractedProfile({ ...validInput, graduationYear: "2100" }).graduationYear).toBeUndefined();
    expect(buildExtractedProfile({ ...validInput, graduationYear: "999" }).graduationYear).toBeUndefined();
    expect(buildExtractedProfile({ ...validInput, graduationYear: "1999" }).graduationYear).toBe("1999");
    expect(buildExtractedProfile({ ...validInput, graduationYear: "2024" }).graduationYear).toBe("2024");
  });

  it("caps work experience at 3 roles and skips entries without company or title", () => {
    const roles = [
      { company: "A", title: "R1" },
      { company: "B", title: "R2" },
      { company: "", title: "" },
      { company: "C", title: "R3" },
      { company: "D", title: "R4" },
    ];
    const result = buildExtractedProfile({ ...validInput, workExperience: roles });
    expect(result.workExperience).toHaveLength(3);
    expect(result.workExperience?.map((r) => r.company)).toEqual(["A", "B", "C"]);
  });

  it("derives current from a missing endDate when current is not a boolean", () => {
    const result = buildExtractedProfile({
      ...validInput,
      workExperience: [
        { company: "A", title: "R1", endDate: "2023-01" },
        { company: "B", title: "R2" },
      ],
    });
    expect(result.workExperience?.[0].current).toBe(false);
    expect(result.workExperience?.[1].current).toBe(true);
  });

  it("drops empty arrays and empty strings", () => {
    const result = buildExtractedProfile({
      ...validInput,
      skills: [],
      fullName: "   ",
      workExperience: [],
    });
    expect(result.skillsCsv).toBeUndefined();
    expect(result.fullName).toBeUndefined();
    expect(result.workExperience).toBeUndefined();
  });
});
