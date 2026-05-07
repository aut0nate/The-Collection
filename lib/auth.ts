import "server-only";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "the_collection_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 14;
const loginWindowMs = 15 * 60 * 1000;
const maxFailedLoginAttempts = 5;
const dummyPasswordHash = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8vYw7zvCX6WyqXn9PZSNTEvQw8b1lC";

type LoginAttempt = {
  count: number;
  firstFailedAt: number;
};

const failedLoginAttempts = new Map<string, LoginAttempt>();

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

function safeEqualString(actual: string, expected: string) {
  const actualHash = crypto.createHash("sha256").update(actual).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(actualHash, expectedHash);
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

function parseSessionValue(value: string | undefined) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!payload || !signature || !safeEqualSignature(sign(payload), signature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username: string;
      expiresAt: number;
    };
    if (!session.username || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

async function getLoginAttemptKey(username: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || headerStore.get("x-real-ip") || "local";
  return crypto
    .createHash("sha256")
    .update(`${ipAddress}:${username.trim().toLowerCase()}`)
    .digest("base64url");
}

export async function getLoginAttemptStatus(username: string) {
  const key = await getLoginAttemptKey(username);
  const attempt = failedLoginAttempts.get(key);

  if (!attempt) return { allowed: true, key, retryAfterSeconds: 0 };

  const windowEndsAt = attempt.firstFailedAt + loginWindowMs;
  if (Date.now() >= windowEndsAt) {
    failedLoginAttempts.delete(key);
    return { allowed: true, key, retryAfterSeconds: 0 };
  }

  if (attempt.count < maxFailedLoginAttempts) return { allowed: true, key, retryAfterSeconds: 0 };

  return {
    allowed: false,
    key,
    retryAfterSeconds: Math.ceil((windowEndsAt - Date.now()) / 1000)
  };
}

export function recordFailedLoginAttempt(key: string) {
  const attempt = failedLoginAttempts.get(key);
  const now = Date.now();

  if (!attempt || now >= attempt.firstFailedAt + loginWindowMs) {
    failedLoginAttempts.set(key, { count: 1, firstFailedAt: now });
    return;
  }

  failedLoginAttempts.set(key, {
    count: attempt.count + 1,
    firstFailedAt: attempt.firstFailedAt
  });
}

export function clearFailedLoginAttempts(key: string) {
  failedLoginAttempts.delete(key);
}

export async function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUsername || !passwordHash) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be configured.");
  }

  const usernameMatches = safeEqualString(username, expectedUsername);
  const passwordMatches = await bcrypt.compare(password, usernameMatches ? passwordHash : dummyPasswordHash);
  return usernameMatches && passwordMatches;
}

export async function createAdminSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, createSessionValue(username), {
    httpOnly: true,
    sameSite: "strict",
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
