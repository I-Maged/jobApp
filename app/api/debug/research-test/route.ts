import { NextResponse } from "next/server";
import { researchCompany } from "@/agent/research";
import type { Job, Profile } from "@/types";

export async function POST() {
  const startedAt = Date.now();
  const job: Job = {
    id: "test-job",
    run_id: null,
    user_id: "test-user",
    source: "search",
    source_url: "https://stripe.com",
    external_apply_url: "https://stripe.com/jobs",
    title: "Senior Software Engineer",
    company: "Stripe",
    location: "Remote",
    salary: "$180k - $220k",
    job_type: "Full-time",
    about_role:
      "Stripe is seeking a Senior Software Engineer to build payments infrastructure. You will work on core APIs used by millions of businesses, using TypeScript, Node.js, Go, and Kafka. Responsibilities include designing resilient distributed systems, mentoring engineers, and shipping features that make it easy for businesses to accept payments. The right candidate has 5+ years of backend experience, strong TypeScript and Node.js skills, and experience with event-driven architecture.",
    responsibilities: null,
    requirements: null,
    nice_to_have: null,
    benefits: null,
    about_company: null,
    match_score: 92,
    match_reason: "test",
    matched_skills: ["TypeScript", "Node.js", "Distributed Systems"],
    missing_skills: ["Go", "Kafka"],
    company_research: null,
    found_at: new Date().toISOString(),
  };

  const profile: Profile = {
    fullName: "Test Candidate",
    email: "test@example.com",
    phone: "555-0100",
    location: "Cairo, Egypt",
    linkedinUrl: "",
    portfolioUrl: "",
    workAuthorization: "visa_required",
    currentTitle: "Senior Backend Engineer",
    experienceLevel: "senior",
    yearsExperience: 8,
    skills: ["TypeScript", "Node.js", "React", "PostgreSQL", "AWS", "Docker"],
    industries: ["SaaS", "Fintech"],
    workExperience: [
      {
        id: "1",
        company: "Fintech Co",
        title: "Senior Backend Engineer",
        startDate: "2021-01",
        endDate: "",
        current: true,
        accomplishments:
          "Led migration of payment reconciliation service to event-driven architecture; cut processing time 60%.",
      },
      {
        id: "2",
        company: "SaaS Shop",
        title: "Full-Stack Engineer",
        startDate: "2018-02",
        endDate: "2020-12",
        current: false,
        accomplishments:
          "Built REST APIs serving 2M requests/day on Node.js and PostgreSQL.",
      },
    ],
    education: {
      highestDegree: "bachelor",
      fieldOfStudy: "Computer Science",
      institutionName: "Cairo University",
      graduationYear: "2016",
    },
    jobTitlesSeeking: ["Senior Software Engineer"],
    remotePreference: "remote",
    salaryExpectation: "$160k+",
    preferredLocations: ["Remote"],
    resumePdfUrl: null,
    isComplete: true,
  };

  try {
    const dossier = await researchCompany(job, profile);
    return NextResponse.json({
      success: true,
      elapsedMs: Date.now() - startedAt,
      dossier,
    });
  } catch (error) {
    console.error("[research-test]", error);
    return NextResponse.json(
      { success: false, error: String(error), elapsedMs: Date.now() - startedAt },
      { status: 500 },
    );
  }
}
