import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthentikLoginState,
  createAdminSession,
  getAuthentikConfig,
  getAuthentikLoginState,
  getConfiguredAppUrl,
  isAllowedAdminEmail
} from "@/lib/auth";
import { exchangeCodeForToken, getDiscoveryDocument, verifyIdToken } from "@/lib/authentik-oidc";

export const dynamic = "force-dynamic";

function getRedirectUri(request: NextRequest) {
  const configuredRedirectUri = process.env.AUTHENTIK_REDIRECT_URI?.trim();
  if (configuredRedirectUri) return configuredRedirectUri;

  const appUrl = getConfiguredAppUrl() || request.nextUrl.origin;
  return `${appUrl}/admin/auth/callback`;
}

function redirectToLogin(request: NextRequest, message: string) {
  const loginUrl = new URL("/admin/login", request.nextUrl.origin);
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    await clearAuthentikLoginState();
    return redirectToLogin(request, "Authentik sign in was cancelled or denied.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");

  try {
    const loginState = await getAuthentikLoginState();
    await clearAuthentikLoginState();

    if (!code || !returnedState || !loginState || returnedState !== loginState.state) {
      return redirectToLogin(request, "Authentik sign in could not be verified. Please try again.");
    }

    const config = getAuthentikConfig();
    const discovery = await getDiscoveryDocument(config.issuer);
    const idToken = await exchangeCodeForToken({
      tokenEndpoint: discovery.token_endpoint,
      code,
      codeVerifier: loginState.codeVerifier,
      redirectUri: getRedirectUri(request),
      clientId: config.clientId,
      clientSecret: config.clientSecret
    });
    const claims = await verifyIdToken({
      idToken,
      jwksUri: discovery.jwks_uri,
      issuer: discovery.issuer,
      clientId: config.clientId,
      nonce: loginState.nonce
    });

    if (!isAllowedAdminEmail(claims.email || "")) {
      return redirectToLogin(request, "This Authentik account is not allowed to manage the collection.");
    }

    await createAdminSession(claims.email || claims.preferred_username || "authentik-admin");
    return NextResponse.redirect(new URL("/admin/tools", request.nextUrl.origin));
  } catch (callbackError) {
    return redirectToLogin(
      request,
      callbackError instanceof Error ? callbackError.message : "Authentik sign in failed."
    );
  }
}
