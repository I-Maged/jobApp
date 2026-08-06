import type { CompanyDossier } from "@/agent/research";

export function makeDossier(overrides: Partial<CompanyDossier> = {}): CompanyDossier {
  return {
    companyOverview: "Stripe builds payments infrastructure for the internet.",
    techStack: ["TypeScript", "React", "Go"],
    culture: ["Low ego", "High ownership"],
    whyThisRole: "The team is scaling checkout infrastructure.",
    yourEdge: ["Your React expertise maps to their frontend platform."],
    gapsToAddress: ["No GraphQL experience — lean on REST API depth."],
    smartQuestions: ["How does the team measure checkout reliability?"],
    interviewPrep: ["Review Stripe's published API design docs."],
    sources: ["https://stripe.com"],
    ...overrides,
  };
}
