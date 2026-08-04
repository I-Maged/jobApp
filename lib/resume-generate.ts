import type { Profile, WorkExperienceRole } from "@/types";
import { AI_MODEL, openai } from "@/lib/ai";

export type ResumeContent = {
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }>;
  skills: string[];
};

const SYSTEM_PROMPT = `You are a professional resume writer. You are given a candidate's profile data and must produce polished, ATS-friendly resume content.

Return ONLY valid JSON matching this shape:
{
  "summary": string (2-3 sentence professional summary),
  "experience": [{ "company": string, "title": string, "startDate": string, "endDate": string, "current": boolean, "bullets": string[] }] (2-4 accomplishment bullets per role, each starting with a strong action verb, quantified results where possible),
  "skills": string[] (the candidate's skills, ordered by relevance)
}

Rules:
- Summary must be 2-3 sentences, professional tone, no first-person pronouns
- Bullet points must start with strong past-tense action verbs, be specific and measurable
- Never invent companies, titles, dates, or skills not in the profile
- If a field in the profile is empty, omit that section rather than writing placeholder text
- Keep every bullet to one line. No fluff.`;

export async function generateResumeContent(profile: Profile): Promise<ResumeContent> {
  const rolesText = profile.workExperience.map((r: WorkExperienceRole) => ({
    company: r.company || "[Company]",
    title: r.title || "[Role]",
    startDate: r.startDate || "",
    endDate: r.current ? "Present" : r.endDate || "",
    current: r.current,
    accomplishments: r.accomplishments || "",
  }));

  const userPrompt = JSON.stringify({
    fullName: profile.fullName,
    currentTitle: profile.currentTitle,
    yearsExperience: profile.yearsExperience,
    experienceLevel: profile.experienceLevel,
    skills: profile.skills,
    workExperience: rolesText,
    education: profile.education,
  });

  const completion = await openai().chat.completions.create({
    model: AI_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 1000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content ?? "{}") as Record<string, unknown>;

  const summary = typeof raw.summary === "string" ? raw.summary : "";
  const skills = Array.isArray(raw.skills)
    ? raw.skills.filter((s: unknown): s is string => typeof s === "string")
    : [];
  const experience = Array.isArray(raw.experience)
    ? raw.experience.flatMap((item: unknown) => {
        if (!item || typeof item !== "object") return [];
        const r = item as Record<string, unknown>;
        const bullets = Array.isArray(r.bullets)
          ? r.bullets.filter((b: unknown): b is string => typeof b === "string")
          : [];
        return [{
          company: typeof r.company === "string" ? r.company : "",
          title: typeof r.title === "string" ? r.title : "",
          startDate: typeof r.startDate === "string" ? r.startDate : "",
          endDate: typeof r.endDate === "string" ? r.endDate : "",
          current: r.current === true,
          bullets,
        }];
      })
    : [];

  return { summary, experience, skills };
}