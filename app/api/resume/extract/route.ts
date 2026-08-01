import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";
import { createInsforgeServer } from "@/lib/insforge-server";
import { buildExtractedProfile, EXTRACT_SYSTEM_PROMPT } from "@/lib/profile-extract";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const MIN_EXTRACT_CHARS = 50;
const MAX_TEXT_CHARS = 12000; // keep prompt + completion within gpt-4o context headroom

// pdf-parse v2 spawns a pdfjs worker that Next's Turbopack bundler cannot
// resolve from its default path. The producer's own `pdf-parse/worker`
// subpath would supply a prebuilt worker data URL but it also eagerly imports
// @napi-rs/canvas, which is not an ESM-placeable native asset and breaks the
// production build. We only need text extraction here (no images/screenshots),
// so we read pdfjs-dist's legacy worker bundled file directly and pass its
// base64 data URL into PDFParse.setWorker once per process. This must run at
// request time (not module load) — Next's build-time page-data collection
// evaluates the route module with no real file descriptors, so a top-level
// fs read throws EBADF on fstat.
let workerConfigured = false;
function ensureWorker() {
  if (workerConfigured) return;
  const requireFromImportMeta = createRequire(import.meta.url);
  const workerFile = requireFromImportMeta.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  );
  PDFParse.setWorker(
    "data:text/javascript;base64," + readFileSync(workerFile).toString("base64"),
  );
  workerConfigured = true;
}

export async function POST() {
  try {
    ensureWorker();
    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not signed in" },
        { status: 401 },
      );
    }

    const path = `resumes/${user.id}/resume.pdf`;
    const { data: fileBlob, error: downloadErr } = await insforge.storage
      .from("resumes")
      .download(path);
    if (downloadErr || !fileBlob) {
      console.error("[api/resume/extract] storage download", downloadErr);
      return NextResponse.json(
        {
          success: false,
          error: "Resume file not found. Please upload a resume first.",
        },
        { status: 404 },
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pagesText: string;
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      await parser.destroy();
      pagesText = textResult.text ?? "";
    } catch (err) {
      console.error("[api/resume/extract] pdf parse", err);
      return NextResponse.json(
        {
          success: false,
          error: "Could not read this PDF. Please try a different file.",
        },
        { status: 422 },
      );
    }

    const trimmed = pagesText.replace(/\s+/g, " ").trim();
    if (trimmed.length < MIN_EXTRACT_CHARS) {
      return NextResponse.json({
        success: false,
        error:
          "Could not extract text from this PDF. It may be an image-only document — please upload a text-based resume.",
      });
    }

    const resumeText = trimmed.slice(0, MAX_TEXT_CHARS);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    let rawJson: unknown;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: "system", content: EXTRACT_SYSTEM_PROMPT },
          { role: "user", content: resumeText },
        ],
      });
      rawJson = JSON.parse(completion.choices[0].message.content ?? "");
    } catch (err) {
      console.error("[api/resume/extract] openai", err);
      return NextResponse.json(
        { success: false, error: "Failed to extract profile. Please try again." },
        { status: 502 },
      );
    }

    const profile = buildExtractedProfile(rawJson);
    if (Object.keys(profile).length === 0) {
      return NextResponse.json({
        success: false,
        error: "No profile fields could be extracted from this resume.",
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("[api/resume/extract]", error);
    return NextResponse.json(
      { success: false, error: "Failed to extract profile" },
      { status: 500 },
    );
  }
}
