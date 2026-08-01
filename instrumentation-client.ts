import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (token && host) {
  posthog.init(token, {
    api_host: host,
    capture_exceptions: true,
    // Scroll-depth tracking has no use on JobPilot's fixed-height nav pages,
    // and PostHog's ratio clamp ("cannot be greater than max: 1") fires the
    // warning on every pageleave where early scroll context exceeds a near-
    // zero maxScrollHeight. Turn the computation off entirely.
    disable_scroll_properties: true,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  const missingVariable = !token
    ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
    : "NEXT_PUBLIC_POSTHOG_HOST";
  console.error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}
