import OpenAI from "openai";

export const AI_BASE_URL =
  process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";

export const AI_MODEL =
  process.env.AI_MODEL ?? "google/gemma-4-26b-a4b-it:free";

export function getAiApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY must be set");
  }
  return apiKey;
}

function createOpenAIClient(options?: {
  timeout?: number;
  maxRetries?: number;
}): OpenAI {
  return new OpenAI({
    baseURL: AI_BASE_URL,
    apiKey: getAiApiKey(),
    timeout: options?.timeout ?? 60_000,
    maxRetries: options?.maxRetries ?? 0,
  });
}

let openaiClient: OpenAI | null = null;

export function openai(): OpenAI {
  if (!openaiClient) openaiClient = createOpenAIClient();
  return openaiClient;
}

let openaiFastClient: OpenAI | null = null;

export function openaiFast(): OpenAI {
  if (!openaiFastClient) {
    openaiFastClient = createOpenAIClient({ timeout: 15_000 });
  }
  return openaiFastClient;
}
