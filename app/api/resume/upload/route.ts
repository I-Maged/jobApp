import { NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { success: false, error: "Resume must be a PDF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not signed in" },
        { status: 401 },
      );
    }

    const path = `${user.id}/resume.pdf`;
    const { error: uploadErr } = await insforge.storage
      .from("resumes")
      .upload(path, file);
    if (uploadErr) {
      console.error("[api/resume/upload] storage upload", uploadErr);
      return NextResponse.json(
        { success: false, error: "Failed to upload resume" },
        { status: 500 },
      );
    }

    const { data: publicData } = insforge.storage
      .from("resumes")
      .getPublicUrl(path);
    const resumeUrl = publicData?.publicUrl ?? null;

    const { error: updateErr } = await insforge.database
      .from("profiles")
      .update({
        resume_pdf_url: resumeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateErr) {
      console.error("[api/resume/upload] update resume_url", updateErr);
      return NextResponse.json(
        { success: false, error: "Failed to save resume URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      resumeUrl,
    });
  } catch (error) {
    console.error("[api/resume/upload]", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload resume" },
      { status: 500 },
    );
  }
}
