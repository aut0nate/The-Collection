import "server-only";

type DiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
};

type TokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

type IdTokenClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  nonce?: string;
  email?: string;
  preferred_username?: string;
};

type OpenIdJwk = JsonWebKey & {
  kid?: string;
};

type JwksDocument = {
  keys?: OpenIdJwk[];
};

function decodeBase64Url(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function decodeJwtPart<T>(value: string) {
  return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Authentik request failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function getDiscoveryDocument(issuer: string) {
  return fetchJson<DiscoveryDocument>(new URL(".well-known/openid-configuration", issuer).toString());
}

export async function exchangeCodeForToken(params: {
  tokenEndpoint: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code_verifier: params.codeVerifier
  });

  const response = await fetch(params.tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json"
    },
    body,
    cache: "no-store"
  });

  const tokenResponse = (await response.json()) as TokenResponse;
  if (!response.ok || tokenResponse.error) {
    throw new Error(tokenResponse.error_description || tokenResponse.error || "Authentik token exchange failed.");
  }
  if (!tokenResponse.id_token) {
    throw new Error("Authentik did not return an ID token.");
  }

  return tokenResponse.id_token;
}

export async function verifyIdToken(params: {
  idToken: string;
  jwksUri: string;
  issuer: string;
  clientId: string;
  nonce: string;
}) {
  const parts = params.idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Authentik returned an invalid ID token.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
  const header = decodeJwtPart<{ alg?: string; kid?: string }>(encodedHeader);
  const claims = decodeJwtPart<IdTokenClaims>(encodedPayload);

  if (header.alg !== "RS256") {
    throw new Error("Authentik ID token must use RS256 signing.");
  }

  const jwks = await fetchJson<JwksDocument>(params.jwksUri);
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) {
    throw new Error("Could not find the Authentik signing key for the ID token.");
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );

  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  if (!validSignature) {
    throw new Error("Authentik ID token signature could not be verified.");
  }

  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  if (claims.iss !== params.issuer) throw new Error("Authentik ID token issuer did not match.");
  if (!audience.includes(params.clientId)) throw new Error("Authentik ID token audience did not match.");
  if (!claims.exp || claims.exp <= now) throw new Error("Authentik ID token has expired.");
  if (claims.nbf && claims.nbf > now) throw new Error("Authentik ID token is not valid yet.");
  if (claims.nonce !== params.nonce) throw new Error("Authentik ID token nonce did not match.");
  if (!claims.email) throw new Error("Authentik did not include an email claim.");

  return claims;
}
