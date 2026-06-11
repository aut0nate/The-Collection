import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "the_collection_session";
const oauthCookieName = "the_collection_authentik_oauth";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 14;
const oauthCookieMaxAgeSeconds = 60 * 10;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long.");
  }
  return secret;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function safeEqualSignature(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function createSessionValue(username: string) {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      expiresAt: Date.now() + sessionMaxAgeSeconds * 1000
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function createSignedJsonValue(value: unknown) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function parseSignedJsonValue<T>(value: string | undefined) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!payload || !signature || !safeEqualSignature(sign(payload), signature)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function parseSessionValue(value: string | undefined) {
  const session = parseSignedJsonValue<{
    username: string;
    expiresAt: number;
  }>(value);

  if (!session) return null;
  if (!session.username || session.expiresAt < Date.now()) return null;
  return session;
}

type AuthentikLoginState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  expiresAt: number;
};

export function createRandomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createCodeChallenge(codeVerifier: string) {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
}

export async function setAuthentikLoginState(state: AuthentikLoginState) {
  const cookieStore = await cookies();
  cookieStore.set(oauthCookieName, createSignedJsonValue(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/auth",
    maxAge: oauthCookieMaxAgeSeconds,
    priority: "high"
  });
}

export async function getAuthentikLoginState() {
  const cookieStore = await cookies();
  const state = parseSignedJsonValue<AuthentikLoginState>(cookieStore.get(oauthCookieName)?.value);

  if (!state) return null;
  if (!state.state || !state.nonce || !state.codeVerifier || state.expiresAt < Date.now()) return null;
  return state;
}

export async function clearAuthentikLoginState() {
  const cookieStore = await cookies();
  cookieStore.set(oauthCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/auth",
    maxAge: 0
  });
}

export function isAllowedAdminEmail(email: string) {
  const expectedEmail = process.env.AUTHENTIK_ADMIN_EMAIL;
  if (!expectedEmail) {
    throw new Error("AUTHENTIK_ADMIN_EMAIL must be configured.");
  }

  return email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
}

export function getAuthentikConfig() {
  const issuer = process.env.AUTHENTIK_ISSUER?.trim();
  const clientId = process.env.AUTHENTIK_CLIENT_ID?.trim();
  const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET?.trim();

  if (!issuer || !clientId || !clientSecret) {
    throw new Error("AUTHENTIK_ISSUER, AUTHENTIK_CLIENT_ID, and AUTHENTIK_CLIENT_SECRET must be configured.");
  }

  return {
    issuer: issuer.endsWith("/") ? issuer : `${issuer}/`,
    clientId,
    clientSecret
  };
}

export function getConfiguredAppUrl() {
  return process.env.APP_URL?.trim().replace(/\/$/, "") || null;
}

export async function createAdminSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, createSessionValue(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
    priority: "high"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return parseSessionValue(cookieStore.get(cookieName)?.value);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
