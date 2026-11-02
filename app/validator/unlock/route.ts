import type { NextRequest } from "next/server";

import {
  createAccessCookieValue,
  getValidatorGatePassword,
  isPasswordCorrect,
  sanitizeValidatorNextPath,
  VALIDATOR_ACCESS_COOKIE,
  VALIDATOR_ACCESS_COOKIE_OPTIONS,
  VALIDATOR_BASE_PATH,
} from "@/lib/validator-page/accessGate";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";

const MAX_PASSWORD_LENGTH = 256;

// Counts every try, right or wrong, per address: ten in 15 minutes is
// plenty for a tester and far too few to guess the password.
const enforceUnlockRateLimit = createClientRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  errorMessage: "Too many password attempts",
});

function seeOther(location: string, cookie?: string): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    // Relative, so it stays on the host the visitor used.
    Location: location,
    "X-Robots-Tag": "noindex, nofollow",
  });
  if (cookie) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status: 303, headers });
}

function serializeAccessCookie(value: string): string {
  const options = VALIDATOR_ACCESS_COOKIE_OPTIONS;
  return [
    `${VALIDATOR_ACCESS_COOKIE}=${value}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

async function readForm(
  request: NextRequest
): Promise<{ password: string; next: string }> {
  try {
    const form = await request.formData();
    const password = form.get("password");
    return {
      // A pasted password often carries a space or a line break.
      password: typeof password === "string" ? password.trim() : "",
      next: sanitizeValidatorNextPath(form.get("next")),
    };
  } catch {
    return { password: "", next: VALIDATOR_BASE_PATH };
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const { password, next } = await readForm(request);
  const expected = getValidatorGatePassword();
  if (expected === null) {
    return seeOther(next);
  }
  if (enforceUnlockRateLimit(request)) {
    return seeOther(`${next}?gate=wait`);
  }
  if (
    password.length === 0 ||
    password.length > MAX_PASSWORD_LENGTH ||
    !isPasswordCorrect(password, expected)
  ) {
    return seeOther(`${next}?gate=wrong`);
  }
  return seeOther(
    next,
    serializeAccessCookie(createAccessCookieValue(expected))
  );
}

export function GET(): Response {
  return seeOther(VALIDATOR_BASE_PATH);
}
