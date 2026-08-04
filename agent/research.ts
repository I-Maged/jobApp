import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";
import { createBrowserbase } from "@/lib/browserbase";
import { createStagehand } from "@/lib/stagehand";
import { AI_MODEL, openai } from "@/lib/ai";
import type { Job, Profile } from "@/types";

export type CompanyDossier = {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
};

type HomepageLinkKind =
  | "about"
  | "careers"
  | "blog"
  | "engineering"
  | "product"
  | "team"
  | "other";

type HomepageLink = { url: string; kind: HomepageLinkKind };

type HomepageResearch = {
  oneLiner: string;
  productSummary: string;
  signals: string[];
  pageLinks: HomepageLink[];
};

type SubPageResearch = {
  url: string;
  keyPoints: string[];
  technologies: string[];
  valuesOrCulture: string[];
  notable: string[];
};

type CollectedResearch = {
  homepage: HomepageResearch;
  subPages: SubPageResearch[];
  visitedUrls: string[];
};

const HOMEPAGE_SCHEMA = z.object({
  oneLiner: z.string().describe("What the company does in one sentence"),
  productSummary: z
    .string()
    .describe("What they build/sell and who it's for"),
  signals: z
    .array(z.string())
    .describe("Funding, notable customers, scale, mission, recent news"),
  pageLinks: z
    .array(
      z.object({
        url: z.string(),
        kind: z.enum([
          "about",
          "careers",
          "blog",
          "engineering",
          "product",
          "team",
          "other",
        ]),
      }),
    )
    .describe("Internal links worth visiting"),
});

const SUBPAGE_SCHEMA = z.object({
  keyPoints: z.array(z.string()),
  technologies: z
    .array(z.string())
    .describe("Specific languages, frameworks, tools, platforms"),
  valuesOrCulture: z
    .array(z.string())
    .describe("Stated values, working style, team norms"),
  notable: z
    .array(z.string())
    .describe("Customers, funding, scale, projects, awards"),
});

const SUBPAGE_PRIORITY: Record<HomepageLinkKind, number> = {
  about: 0,
  engineering: 1,
  blog: 2,
  product: 3,
  team: 4,
  careers: 5,
  other: 6,
};

const RESEARCH_SYSTEM_PROMPT = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this exact shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

const COMPOUND_TLDS = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "net.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "net.nz", "org.nz", "govt.nz",
  "co.jp", "ne.jp", "or.jp",
  "com.br", "net.br", "org.br", "gov.br",
  "com.mx", "org.mx", "gob.mx", "net.mx",
  "com.ar", "org.ar", "net.ar", "gob.ar",
  "co.in", "org.in", "net.in", "gov.in",
  "com.sg", "org.sg", "net.sg",
  "com.hk", "org.hk", "net.hk",
  "com.tw", "org.tw", "net.tw",
  "co.kr", "or.kr",
  "com.tr", "org.tr", "net.tr",
  "com.cn", "org.cn", "net.cn",
  "com.sa", "org.sa",
  "com.eg", "org.eg",
  "com.ph", "org.ph",
  "com.my", "org.my",
  "co.za", "org.za",
  "com.co", "com.pe", "com.ve", "com.ec", "com.uy", "com.bo", "com.py",
  "com.ng", "com.gh", "com.ke", "co.ke",
]);

function stripSubdomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  const lastTwo = parts.slice(-2).join(".");
  if (COMPOUND_TLDS.has(lastTwo)) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

async function deriveHomepageUrl(job: Job): Promise<string> {
  if (job.source_url) {
    let target: URL | null;
    try {
      target = new URL(job.source_url);
    } catch {
      target = null;
    }

    if (
      target &&
      (target.protocol === "http:" || target.protocol === "https:")
    ) {
      try {
        const response = await fetch(target, {
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
        });
        const finalUrl = response.url;
        if (finalUrl && !/adzuna\.com/i.test(finalUrl)) {
          const hostname = new URL(finalUrl).hostname;
          return `https://${stripSubdomain(hostname)}`;
        }
      } catch (error) {
        console.error("[agent/research] failed to follow redirect", error);
      }
    }
  }

  const cleanName = (job.company || "")
    .replace(/\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?).*$/i, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  if (cleanName) {
    return `https://www.${cleanName}.com`;
  }
  throw new Error("Could not derive a company homepage URL");
}

function pickSubPages(
  links: HomepageLink[],
  homepageUrl: string,
): HomepageLink[] {
  let rootHostname: string;
  try {
    rootHostname = new URL(homepageUrl).hostname;
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const internal: HomepageLink[] = [];
  for (const link of links) {
    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(link.url, homepageUrl).toString();
    } catch {
      continue;
    }

    let hostname: string;
    try {
      hostname = new URL(absoluteUrl).hostname;
    } catch {
      continue;
    }
    if (hostname !== rootHostname && !hostname.endsWith(`.${rootHostname}`)) {
      continue;
    }

    const normalized = absoluteUrl.replace(/#.*$/, "").replace(/\/+$/, "");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    internal.push({ ...link, url: normalized });
  }

  internal.sort(
    (a, b) => SUBPAGE_PRIORITY[a.kind] - SUBPAGE_PRIORITY[b.kind],
  );

  return internal.slice(0, 3);
}

async function collectWebsiteResearch(
  job: Job,
): Promise<CollectedResearch | null> {
  let homepageUrl: string;
  try {
    homepageUrl = await deriveHomepageUrl(job);
  } catch (error) {
    console.error("[agent/research] derive homepage url", error);
    return null;
  }

  const visitedUrls = [homepageUrl];

  try {
    const bb = createBrowserbase();
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      timeout: 120,
    });
    let stagehand: Stagehand | null = null;

    try {
      stagehand = createStagehand(session.id);
      await stagehand.init();
      const page = stagehand.context.pages()[0];

      await page.goto(homepageUrl, {
        waitUntil: "load",
        timeoutMs: 30_000,
      });
      try {
        await page.waitForLoadState("networkidle", 10_000);
      } catch (error) {
        console.error(
          "[agent/research] networkidle wait skipped",
          homepageUrl,
          error,
        );
      }

      const homepage = await stagehand.extract(
        "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
        HOMEPAGE_SCHEMA,
        { timeout: 60_000 },
      );

      if (!homepage.oneLiner && !homepage.productSummary) {
        return { homepage, subPages: [], visitedUrls };
      }

      const subPages: SubPageResearch[] = [];
      for (const link of pickSubPages(homepage.pageLinks ?? [], homepageUrl)) {
        try {
          await page.goto(link.url, {
            waitUntil: "load",
            timeoutMs: 30_000,
          });
          try {
            await page.waitForLoadState("networkidle", 10_000);
          } catch (error) {
            console.error(
              "[agent/research] sub-page networkidle wait skipped",
              link.url,
              error,
            );
          }
          const data = await stagehand.extract(
            "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
            SUBPAGE_SCHEMA,
            { timeout: 45_000 },
          );
          subPages.push({ url: link.url, ...data });
          visitedUrls.push(link.url);
        } catch (error) {
          console.error("[agent/research] sub-page failed", link.url, error);
        }
      }

      return { homepage, subPages, visitedUrls };
    } finally {
      if (stagehand) {
        try {
          await stagehand.close();
        } catch (error) {
          console.error("[agent/research] failed to close stagehand", error);
        }
      } else {
        try {
          await bb.sessions.update(session.id, {
            status: "REQUEST_RELEASE",
          });
        } catch (error) {
          console.error("[agent/research] failed to release session", error);
        }
      }
    }
  } catch (error) {
    console.error("[agent/research] browser research failed", error);
    return null;
  }
}

function buildUserPrompt(
  job: Job,
  profile: Profile,
  research: CollectedResearch | null,
): string {
  const researchJson = research
    ? JSON.stringify({
        homepage: research.homepage,
        subPages: research.subPages,
        sources: research.visitedUrls,
      })
    : "No company website research available.";

  return `COMPANY RESEARCH (from their website):
${researchJson}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.about_role}
Matched skills (already computed): ${job.matched_skills.join(", ") || "none"}
Missing skills (already computed): ${job.missing_skills.join(", ") || "none"}

CANDIDATE PROFILE:
Current title: ${profile.currentTitle || "not specified"}
Experience: ${profile.yearsExperience} years, level ${profile.experienceLevel || "not specified"}
Skills: ${profile.skills.join(", ") || "none listed"}
Work history: ${JSON.stringify(profile.workExperience)}`;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function mergeSources(
  modelSources: string[],
  visitedUrls: string[],
): string[] {
  const merged = [...modelSources];
  for (const url of visitedUrls) {
    if (!merged.includes(url)) merged.push(url);
  }
  return merged;
}

function asDossier(
  raw: Record<string, unknown>,
  visitedUrls: string[],
): CompanyDossier {
  return {
    companyOverview: asString(raw.companyOverview),
    techStack: asStringArray(raw.techStack),
    culture: asStringArray(raw.culture),
    whyThisRole: asString(raw.whyThisRole),
    yourEdge: asStringArray(raw.yourEdge),
    gapsToAddress: asStringArray(raw.gapsToAddress),
    smartQuestions: asStringArray(raw.smartQuestions),
    interviewPrep: asStringArray(raw.interviewPrep),
    sources: mergeSources(asStringArray(raw.sources), visitedUrls),
  };
}

async function synthesizeDossier(
  job: Job,
  profile: Profile,
  research: CollectedResearch | null,
): Promise<CompanyDossier> {
  const response = await openai().chat.completions.create({
    model: AI_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 800,
    messages: [
      { role: "system", content: RESEARCH_SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(job, profile, research) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return asDossier(parsed, research?.visitedUrls ?? []);
}

export async function researchCompany(
  job: Job,
  profile: Profile,
): Promise<CompanyDossier> {
  let research: CollectedResearch | null = null;

  try {
    research = await collectWebsiteResearch(job);
  } catch (error) {
    console.error("[agent/research] website research failed", error);
  }

  return synthesizeDossier(job, profile, research);
}
