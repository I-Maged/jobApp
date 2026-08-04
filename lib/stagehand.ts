import { Stagehand } from "@browserbasehq/stagehand";
import { AI_BASE_URL, AI_MODEL, getAiApiKey } from "@/lib/ai";

export function createStagehand(sessionId: string): Stagehand {
  const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!browserbaseApiKey || !projectId) {
    throw new Error(
      "BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set",
    );
  }

  return new Stagehand({
    env: "BROWSERBASE",
    apiKey: browserbaseApiKey,
    projectId,
    browserbaseSessionID: sessionId,
    model: {
      modelName: `openai/${AI_MODEL}`,
      apiKey: getAiApiKey(),
      baseURL: AI_BASE_URL,
      openaiEndpointFormat: "chat",
    },
    disablePino: true,
  });
}
