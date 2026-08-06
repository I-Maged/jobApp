import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookup } from "node:dns/promises";
import {
  asDossier,
  buildUserPrompt,
  deriveHomepageUrl,
  isBlockedHost,
  isPrivateIp,
  isSafeHttpUrl,
  mergeSources,
  pickSubPages,
  stripSubdomain,
} from "@/agent/research";
import { makeJob, makeScoredJob } from "@/tests/fixtures/jobs";
import { makeProfile } from "@/tests/fixtures/profiles";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

const mockLookup = vi.mocked(lookup);

beforeEach(() => {
  mockLookup.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("stripSubdomain", () => {
  it("strips a leading subdomain", () => {
    expect(stripSubdomain("jobs.stripe.com")).toBe("stripe.com");
    expect(stripSubdomain("www.google.com")).toBe("google.com");
    expect(stripSubdomain("blog.bbc.co.uk")).toBe("bbc.co.uk");
  });

  it("handles compound TLDs", () => {
    expect(stripSubdomain("jobs.bbc.co.uk")).toBe("bbc.co.uk");
    expect(stripSubdomain("careers.shopify.com.au")).toBe("shopify.com.au");
  });

  it("leaves bare domains untouched", () => {
    expect(stripSubdomain("stripe.com")).toBe("stripe.com");
    expect(stripSubdomain("localhost")).toBe("localhost");
  });
});

describe("isPrivateIp", () => {
  it("flags private and reserved ranges", () => {
    for (const ip of [
      "0.0.0.0",
      "10.1.2.3",
      "127.0.0.1",
      "169.254.1.1",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "224.0.0.1",
      "255.255.255.255",
    ]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it("allows public IPs", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "151.101.1.140"]) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });

  it("rejects malformed input", () => {
    for (const ip of ["", "localhost", "8.8.8", "8.8.8.8.8", "a.b.c.d"]) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });
});

describe("isBlockedHost", () => {
  it("blocks localhost, loopback and IPv4 literals without DNS", () => {
    expect(isBlockedHost("localhost")).resolves.toBe(true);
    expect(isBlockedHost("::1")).resolves.toBe(true);
    expect(isBlockedHost("0.0.0.0")).resolves.toBe(true);
    expect(isBlockedHost("192.168.1.1")).resolves.toBe(true);
    expect(isBlockedHost("8.8.8.8")).resolves.toBe(false);
  });

  it("blocks hosts whose DNS resolves to a private IP", async () => {
    mockLookup.mockResolvedValue({ address: "10.0.0.5", family: 4 });
    await expect(isBlockedHost("internal.example.com")).resolves.toBe(true);
    expect(mockLookup).toHaveBeenCalledWith("internal.example.com");
  });

  it("allows hosts whose DNS resolves to a public IP", async () => {
    mockLookup.mockResolvedValue({ address: "8.8.8.8", family: 4 });
    await expect(isBlockedHost("stripe.com")).resolves.toBe(false);
  });

  it("blocks hosts on DNS failure", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(isBlockedHost("nope.invalid")).resolves.toBe(true);
  });

  it("trims a trailing dot before resolution", async () => {
    mockLookup.mockResolvedValue({ address: "8.8.8.8", family: 4 });
    await expect(isBlockedHost("Stripe.com.")).resolves.toBe(false);
    expect(mockLookup).toHaveBeenCalledWith("stripe.com");
  });
});

describe("isSafeHttpUrl", () => {
  it("rejects null and non-http(s) protocols", async () => {
    await expect(isSafeHttpUrl(null)).resolves.toBe(false);
    await expect(isSafeHttpUrl(new URL("ftp://example.com"))).resolves.toBe(false);
    await expect(isSafeHttpUrl(new URL("javascript:alert(1)"))).resolves.toBe(false);
  });

  it("rejects private hosts", async () => {
    await expect(isSafeHttpUrl(new URL("http://127.0.0.1:8080/admin"))).resolves.toBe(false);
  });

  it("accepts public https hosts", async () => {
    mockLookup.mockResolvedValue({ address: "151.101.1.140", family: 4 });
    await expect(isSafeHttpUrl(new URL("https://stripe.com/about"))).resolves.toBe(true);
  });
});

describe("deriveHomepageUrl", () => {
  it("derives the registrable domain after following the redirect", async () => {
    mockLookup.mockResolvedValue({ address: "151.101.1.140", family: 4 });
    const fetchMock = vi.fn().mockResolvedValue({ url: "https://jobs.stripe.com/apply" });
    vi.stubGlobal("fetch", fetchMock);

    const url = await deriveHomepageUrl(makeJob());
    expect(url).toBe("https://stripe.com");
  });

  it("falls back to the company domain when the redirect fetch fails", async () => {
    mockLookup.mockResolvedValue({ address: "151.101.1.140", family: 4 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const url = await deriveHomepageUrl(makeJob({ company: "Stripe" }));
    expect(url).toBe("https://www.stripe.com");
  });

  it("refuses to keep an adzuna redirect target", async () => {
    mockLookup.mockResolvedValue({ address: "151.101.1.140", family: 4 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ url: "https://www.adzuna.com/jobs/123" }));

    const url = await deriveHomepageUrl(makeJob({ company: "Stripe" }));
    expect(url).toBe("https://www.stripe.com");
  });

  it("skips non-http source urls and uses the company fallback", async () => {
    const url = await deriveHomepageUrl(makeJob({ source_url: "not-a-url" }));
    expect(url).toBe("https://www.stripe.com");
  });

  it("refuses private hosts and falls back", async () => {
    const url = await deriveHomepageUrl(
      makeJob({ source_url: "http://192.168.1.1/job" }),
    );
    expect(url).toBe("https://www.stripe.com");
  });

  it("cleans company suffixes from the fallback domain", async () => {
    expect(await deriveHomepageUrl(makeJob({ company: "Stripe Inc." }))).toBe("https://www.stripe.com");
    expect(await deriveHomepageUrl(makeJob({ company: "Acme Corp." }))).toBe("https://www.acme.com");
    expect(await deriveHomepageUrl(makeJob({ company: "Acme LLC" }))).toBe("https://www.acme.com");
  });

  it("throws when no source url and no company name", async () => {
    await expect(
      deriveHomepageUrl(makeJob({ source_url: null, company: "" })),
    ).rejects.toThrow("Could not derive a company homepage URL");
  });
});

describe("pickSubPages", () => {
  const homepage = "https://stripe.com";

  it("keeps same-root and subdomain links, dropping external hosts", () => {
    const links = [
      { url: "https://stripe.com/about", kind: "about" as const },
      { url: "https://blog.stripe.com/engineering", kind: "blog" as const },
      { url: "https://evil.example.com/phish", kind: "other" as const },
      { url: "https://google.com/", kind: "other" as const },
    ];
    const result = pickSubPages(links, homepage);
    expect(result.map((l) => l.url)).toEqual([
      "https://stripe.com/about",
      "https://blog.stripe.com/engineering",
    ]);
  });

  it("dedupes fragment and trailing-slash variants", () => {
    const links = [
      { url: "https://stripe.com/about", kind: "about" as const },
      { url: "https://stripe.com/about#team", kind: "about" as const },
      { url: "https://stripe.com/about/", kind: "about" as const },
    ];
    expect(pickSubPages(links, homepage)).toHaveLength(1);
  });

  it("resolves relative urls against the homepage", () => {
    const result = pickSubPages(
      [{ url: "/about", kind: "about" as const }],
      homepage,
    );
    expect(result[0].url).toBe("https://stripe.com/about");
  });

  it("sorts by priority and caps at 3", () => {
    const links = [
      { url: "https://stripe.com/careers", kind: "careers" as const },
      { url: "https://stripe.com/engineering", kind: "engineering" as const },
      { url: "https://stripe.com/team", kind: "team" as const },
      { url: "https://stripe.com/about", kind: "about" as const },
      { url: "https://stripe.com/blog", kind: "blog" as const },
    ];
    const result = pickSubPages(links, homepage);
    expect(result.map((l) => l.kind)).toEqual(["about", "engineering", "blog"]);
  });

  it("returns an empty list for an invalid homepage", () => {
    expect(pickSubPages([{ url: "/about", kind: "about" as const }], "nope")).toEqual([]);
  });
});

describe("mergeSources", () => {
  it("appends visited urls without duplicating model sources", () => {
    expect(mergeSources(["https://stripe.com"], ["https://stripe.com", "https://stripe.com/about"]))
      .toEqual(["https://stripe.com", "https://stripe.com/about"]);
  });
});

describe("asDossier", () => {
  it("narrows and merges sources", () => {
    const dossier = asDossier(
      {
        companyOverview: "Payments infra.",
        techStack: ["TypeScript", 42, null],
        culture: ["Low ego"],
        whyThisRole: "Scaling.",
        yourEdge: ["React depth"],
        gapsToAddress: ["GraphQL"],
        smartQuestions: ["How is reliability measured?"],
        interviewPrep: ["Read API docs"],
        sources: ["https://stripe.com"],
        junk: "ignored",
      },
      ["https://stripe.com/about"],
    );
    expect(dossier).toEqual({
      companyOverview: "Payments infra.",
      techStack: ["TypeScript"],
      culture: ["Low ego"],
      whyThisRole: "Scaling.",
      yourEdge: ["React depth"],
      gapsToAddress: ["GraphQL"],
      smartQuestions: ["How is reliability measured?"],
      interviewPrep: ["Read API docs"],
      sources: ["https://stripe.com", "https://stripe.com/about"],
    });
  });
});

describe("buildUserPrompt", () => {
  it("uses the placeholder when no research is available", () => {
    const prompt = buildUserPrompt(makeJob(), makeProfile(), null);
    expect(prompt).toContain("No company website research available.");
    expect(prompt).toContain("Stripe");
    expect(prompt).toContain("TypeScript, React");
  });

  it("embeds research JSON when present", () => {
    const research = {
      homepage: {
        oneLiner: "Payments for the internet",
        productSummary: "Sells API infrastructure",
        signals: ["Raised $6.5B"],
        pageLinks: [{ url: "https://stripe.com/about", kind: "about" as const }],
      },
      subPages: [],
      visitedUrls: ["https://stripe.com"],
    };
    const prompt = buildUserPrompt(makeJob(), makeProfile(), research);
    expect(prompt).toContain("Payments for the internet");
    expect(prompt).toContain('"sources":["https://stripe.com"]');
  });

  it("includes matched and missing skills from the scored job", () => {
    const job = makeJob({
      matched_skills: ["TypeScript"],
      missing_skills: ["GraphQL"],
    });
    const prompt = buildUserPrompt(job, makeProfile(), null);
    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("GraphQL");
    void makeScoredJob;
  });
});
