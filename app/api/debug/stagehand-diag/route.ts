import { NextResponse } from "next/server";
import { createBrowserbase } from "@/lib/browserbase";
import { createStagehand } from "@/lib/stagehand";

export async function POST() {
  const startedAt = Date.now();
  try {
    const bb = createBrowserbase();
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      timeout: 120,
    });

    let stagehand = null;
    try {
      stagehand = createStagehand(session.id);
      await stagehand.init();
      const page = stagehand.context.pages()[0];
      const url = page.url();
      await page.goto("https://example.com", {
        waitUntil: "load",
        timeoutMs: 30_000,
      });
      return NextResponse.json({
        success: true,
        beforeUrl: url,
        afterUrl: page.url(),
        elapsedMs: Date.now() - startedAt,
      });
    } finally {
      if (stagehand) {
        try {
          await stagehand.close();
        } catch (error) {
          console.error("[stagehand-diag] close", error);
        }
      } else {
        try {
          await bb.sessions.update(session.id, { status: "REQUEST_RELEASE" });
        } catch (error) {
          console.error("[stagehand-diag] release", error);
        }
      }
    }
  } catch (error) {
    const err = error as Error & { cause?: unknown; stack?: string };
    console.error("[stagehand-diag] FULL", err.stack);
    return NextResponse.json(
      {
        success: false,
        name: err?.name,
        message: err?.message,
        cause: err?.cause,
        stack: err?.stack,
        elapsedMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
