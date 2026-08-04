import { Stagehand } from "@browserbasehq/stagehand";

export function createStagehand(sessionId: string): Stagehand {
  const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!browserbaseApiKey || !projectId || !openaiApiKey) {
    throw new Error(
      "BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, and OPENAI_API_KEY must be set",
    );
  }

  return new Stagehand({
    env: "BROWSERBASE",
    apiKey: browserbaseApiKey,
    projectId,
    browserbaseSessionID: sessionId,
    model: { modelName: "gpt-4o", apiKey: openaiApiKey },
    disablePino: true,
  });
}
