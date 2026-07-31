import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

const VERIFIER_COOKIE = "insforge_pkce_verifier";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value;

  if (!code || !verifier) {
    const url = new URL("/login", request.url);
    if (!code) url.searchParams.set("error", "missing_code");
    else url.searchParams.set("error", "missing_verifier");
    return NextResponse.redirect(url);
  }

  const redirectTo = new URL("/dashboard", request.url);
  const response = NextResponse.redirect(redirectTo);

  try {
    const auth = createAuthActions({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });

    const { error } = await auth.exchangeOAuthCode(code, verifier);

    if (error) {
      console.error("[callback] exchangeOAuthCode", error);
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "exchange");
      return NextResponse.redirect(url);
    }

    response.cookies.delete(VERIFIER_COOKIE);
    return response;
  } catch (error) {
    console.error("[callback]", error);
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "callback");
    return NextResponse.redirect(url);
  }
}
