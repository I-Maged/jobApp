import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ResumeContent } from "@/lib/resume-generate";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getCurrentUser } from "@/lib/get-current-user";
import { fetchProfile } from "@/lib/profile-data";
import { generateResumeContent } from "@/lib/resume-generate";
import { ResumeTemplate } from "@/components/profile/ResumeTemplate";
import type { Profile } from "@/types";

function buildResumeElement(profile: Profile, content: ResumeContent) {
  return (
    <ResumeTemplate
      profile={profile}
      summary={content.summary}
      experience={content.experience}
      resumeSkills={content.skills}
    />
  );
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchProfile(user.id);
    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found. Complete your profile first." }, { status: 400 });
    }

    const content = await generateResumeContent(profile);

    const buffer = await renderToBuffer(buildResumeElement(profile, content));

    const pdfBlob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });

    const insforge = await createInsforgeServer();
    const filePath = `resumes/${user.id}/resume.pdf`;

    const { error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(filePath, pdfBlob);

    if (uploadError) {
      console.error("[api/resume/generate] upload", uploadError);
      return NextResponse.json({ success: false, error: "Failed to upload resume" }, { status: 500 });
    }

    const { data: publicData } = insforge.storage
      .from("resumes")
      .getPublicUrl(filePath);

    const resumePdfUrl = publicData?.publicUrl ?? null;

    if (!resumePdfUrl) {
      return NextResponse.json({ success: false, error: "Failed to get public URL" }, { status: 500 });
    }

    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: resumePdfUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Resume/generate update", updateError);
    }

    return NextResponse.json({ success: true, resumePdfUrl });
  }catch (err) {
    console.error("api/resume/generate", err);
    return NextResponse.json({ success: false, error: "Generation failed" }, { status: 500 });
  }
}