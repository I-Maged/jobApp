import type { Profile, WorkExperienceRole } from "@/types";

export function makeWorkRole(overrides: Partial<WorkExperienceRole> = {}): WorkExperienceRole {
  return {
    id: "role-1",
    company: "Acme Corp",
    title: "Software Engineer",
    startDate: "2021-01",
    endDate: "",
    current: true,
    accomplishments: "Built the checkout flow",
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+1 555 0100",
    location: "Austin, TX",
    linkedinUrl: "https://linkedin.com/in/janedoe",
    portfolioUrl: "https://janedoe.dev",
    workAuthorization: "citizen",
    currentTitle: "Frontend Engineer",
    experienceLevel: "mid",
    yearsExperience: 5,
    skills: ["TypeScript", "React", "Node.js"],
    industries: ["SaaS"],
    workExperience: [makeWorkRole()],
    education: {
      highestDegree: "bachelor",
      fieldOfStudy: "Computer Science",
      institutionName: "UT Austin",
      graduationYear: "2019",
    },
    jobTitlesSeeking: ["Frontend Engineer", "Full Stack Engineer"],
    remotePreference: "remote",
    salaryExpectation: "$140k",
    preferredLocations: ["Austin, TX"],
    resumePdfUrl: null,
    isComplete: true,
    ...overrides,
  };
}

export function makeMinimalProfile(): Profile {
  return {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    portfolioUrl: "",
    workAuthorization: "citizen",
    currentTitle: "",
    experienceLevel: "",
    yearsExperience: 0,
    skills: [],
    industries: [],
    workExperience: [],
    education: {
      highestDegree: "",
      fieldOfStudy: null,
      institutionName: null,
      graduationYear: null,
    },
    jobTitlesSeeking: [],
    remotePreference: "any",
    salaryExpectation: "",
    preferredLocations: [],
    resumePdfUrl: null,
    isComplete: false,
  };
}
