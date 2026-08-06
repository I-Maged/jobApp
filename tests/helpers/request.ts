import type { NextRequest } from "next/server";

export function makeNextRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): NextRequest {
  const { method = "POST", body, headers = {} } = options;
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    if (typeof body === "string") {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      init.headers = { "Content-Type": "application/json", ...headers };
    }
  }
  const request = new Request(`http://localhost${path}`, init);
  return request as unknown as NextRequest;
}
