import { PostHog } from "posthog-node";

type EventProperties = Record<string, unknown>;

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
