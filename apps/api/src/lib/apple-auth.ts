/**
 * Sign in with Apple — server-side identity token verification.
 *
 * Apple issues a short-lived JWT (identityToken) signed with RS256 against keys
 * published at https://appleid.apple.com/auth/keys.  We verify:
 *   1. Signature against Apple's JWKS.
 *   2. iss == "https://appleid.apple.com"
 *   3. aud == APPLE_SERVICES_ID (your app's bundle / services ID)
 *   4. exp has not passed.
 *
 * The sub claim is the stable Apple user identifier (appleSubjectId).
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");

// Cache the JWKS fetcher — jose handles key caching internally.
const appleJwks = createRemoteJWKSet(APPLE_JWKS_URL);

export interface AppleIdentityClaims {
  sub: string; // stable Apple user identifier
  email: string | null;
  emailVerified: boolean;
}

export async function verifyAppleIdentityToken(
  identityToken: string,
): Promise<AppleIdentityClaims> {
  const audience = env.APPLE_SERVICES_ID;
  if (!audience) {
    throw new AppError(
      400,
      "provider_validation_failed",
      "Sign in with Apple is not configured on this server.",
    );
  }

  let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
  try {
    ({ payload } = await jwtVerify(identityToken, appleJwks, {
      issuer: APPLE_ISSUER,
      audience,
    }));
  } catch {
    throw new AppError(400, "provider_validation_failed", "Identity token verification failed.");
  }

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new AppError(400, "provider_validation_failed", "Identity token is missing sub claim.");
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: payload.email_verified === true,
  };
}
