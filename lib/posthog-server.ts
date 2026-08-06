import { PostHog } from "posthog-node";

type EventProperties = Record<string, unknown>;

export const EVENT_JOB_FOUND = "job_found";
export const EVENT_COMPANY_RESEARCHED = "company_researched";
export const EVENT_PROFILE_COMPLETED = "profile_completed";
export const PROP_MATCH_SCORE = "matchScore";

const POSTHOG_QUERY_HOST = process.env.POSTHOG_QUERY_HOST ?? "https://eu.posthog.com";

export async function runPostHogQuery(
  name: string,
  query: string,
): Promise<unknown[][]> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!apiKey || !projectId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[posthog-server] POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID not set — skipping query",
        name,
      );
    }
    return [];
  }

  const url = `${POSTHOG_QUERY_HOST.replace(/\/+$/, "")}/api/projects/${projectId}/query/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query },
        name,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        `[posthog-server] query ${name} failed (${response.status})`,
        detail,
      );
      return [];
    }

    const data = (await response.json()) as { results?: unknown };
    if (!Array.isArray(data.results)) return [];
    return data.results.filter((row): row is unknown[] => Array.isArray(row));
  } catch (error) {
    console.error(`[posthog-server] query ${name} threw`, error);
    return [];
  }
}

export async function captureServerEvent(
  userId: string,
  event: string,
  properties?: EventProperties,
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[posthog-server] NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN or NEXT_PUBLIC_POSTHOG_HOST not set — skipping event",
        event,
      );
    }
    return;
  }

  const client = new PostHog(apiKey, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({
      distinctId: userId,
      event,
      properties,
    });
  } finally {
    await client.shutdown();
  }
}

export async function captureServerEventsBatch(
  userId: string,
  events: Array<{ event: string; properties?: EventProperties }>,
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) {
    if (process.env.NODE_ENV === "development" && events.length > 0) {
      console.warn(
        "[posthog-server] posthog not configured — skipping batch",
        events.length,
        "events",
      );
    }
    return;
  }

  if (events.length === 0) return;

  const client = new PostHog(apiKey, { host });

  try {
    for (const e of events) {
      client.capture({
        distinctId: userId,
        event: e.event,
        properties: e.properties,
      });
    }
    await client.flush();
  } finally {
    await client.shutdown();
  }
}
