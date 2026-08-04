import Browserbase from "@browserbasehq/sdk";

export function createBrowserbase(): Browserbase {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERBASE_API_KEY must be set");
  }
  return new Browserbase({ apiKey });
}
