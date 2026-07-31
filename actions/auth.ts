"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";
import { createInsforgeServer } from "@/lib/insforge-server";

type Provider = "google" | "github";

const VERIFIER_COOKIE = "insforge_pkce_verifier";

async function buildAuthActions() {
  const cookieStore = await cookies();
  return createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    cookies: cookieStore,
  });
}

export async function signInWithProvider(provider: Provider) {
  try {
    const auth = await buildAuthActions();
    const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: `${origin}/callback`,
      additionalParams: { prompt: "select_account" },
    });

    if (error || !data?.url || !data.codeVerifier) {
      console.error("[actions/auth] signInWithOAuth", error ?? "missing codeVerifier");
      redirect("/login?error=signin");
    }

    const cookieStore = await cookies();
    cookieStore.set(VERIFIER_COOKIE, data.codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    redirect(data.url);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("[actions/auth]", error);
    redirect("/login?error=signin");
  }
}

export async function signOutAction() {
  try {
    const auth = await buildAuthActions();
    await auth.signOut();
  } catch (error) {
    console.error("[actions/auth]", error);
  }
  redirect("/");
}

export async function checkSessionAction(): Promise<
  | { signedIn: true; user: { id: string; email: string; name?: string } }
  | { signedIn: false }
> {
  try {
    const insforge = await createInsforgeServer();
    const { data } = await insforge.auth.getCurrentUser();
    const user = data?.user;

    if (!user) {
      return { signedIn: false };
    }

    return {
      signedIn: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile?.name,
      },
    };
  } catch (error) {
    console.warn("[actions/auth] checkSessionAction", error);
    return { signedIn: false };
  }
}
