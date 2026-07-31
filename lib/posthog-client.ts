import posthog from "posthog-js";

type EventProperties = Record<string, unknown>;

function isReady(): boolean {
  return typeof window !== "undefined" && typeof posthog.capture === "function";
}

export function captureEvent(eventName: string, properties?: EventProperties): void {
  if (!isReady()) {
    return;
  }
  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error("[posthog-client] captureEvent", error);
  }
}

export function identifyUser(
  userId: string,
  traits?: { email?: string; name?: string },
): void {
  if (!isReady()) {
    return;
  }
  try {
    posthog.identify(userId, traits);
  } catch (error) {
    console.error("[posthog-client] identifyUser", error);
  }
}

export function resetUser(): void {
  if (!isReady()) {
    return;
  }
  try {
    posthog.reset();
  } catch (error) {
    console.error("[posthog-client] resetUser", error);
  }
}
