import { NextRequest, NextResponse } from "next/server";
import {
  createCodeChallenge,
  createRandomToken,
  getAuthentikConfig,
  getConfiguredAppUrl,
  setAuthentikLoginState
} from "@/lib/auth";
import { getDiscoveryDocument } from "@/lib/authentik-oidc";

export const dynamic = "force-dynamic";

function getRedirectUri(request: NextRequest) {
  const configuredRedirectUri = process.env.AUTHENTIK_REDIRECT_URI?.trim();
  if (configuredRedirectUri) return configuredRedirectUri;

  return `${getAppOrigin(request)}/admin/auth/callback`;
}

function getAppOrigin(request: NextRequest) {
  return getConfiguredAppUrl() || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const config = getAuthentikConfig();
    const discovery = await getDiscoveryDocument(config.issuer);
    const state = createRandomToken();
    const nonce = createRandomToken();
    const codeVerifier = createRandomToken();
    const codeChallenge = await createCodeChallenge(codeVerifier);
    const redirectUri = getRedirectUri(request);

    await setAuthentikLoginState({
      state,
      nonce,
      codeVerifier,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const authoriseUrl = new URL(discovery.authorization_endpoint);
    authoriseUrl.searchParams.set("client_id", config.clientId);
    authoriseUrl.searchParams.set("redirect_uri", redirectUri);
    authoriseUrl.searchParams.set("response_type", "code");
    authoriseUrl.searchParams.set("scope", "openid profile email");
    authoriseUrl.searchParams.set("state", state);
    authoriseUrl.searchParams.set("nonce", nonce);
    authoriseUrl.searchParams.set("code_challenge", codeChallenge);
    authoriseUrl.searchParams.set("code_challenge_method", "S256");

    return NextResponse.redirect(authoriseUrl);
  } catch (error) {
    const loginUrl = new URL("/admin/login", getAppOrigin(request));
    loginUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Authentik sign in could not be started."
    );
    return NextResponse.redirect(loginUrl);
  }
}
