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
import { readLimitedText } from "@/lib/fetch/limitedBody";

const MAX_PASSWORD_LENGTH = 256;
// The form sends a password and a path; anything longer is not this form.
const MAX_FORM_BYTES = 4 * 1024;
const UNLOCK_WINDOW_MS = 15 * 60 * 1000;

// Counts every try, right or wrong, per address: ten in 15 minutes is
// plenty for a tester and far too few to guess the password.
const enforceUnlockRateLimit = createClientRateLimiter({
  limit: 10,
  windowMs: UNLOCK_WINDOW_MS,
  errorMessage: "Too many password attempts",
});

// Wrong passwords from all addresses share one budget per server process.
// Once it is spent the form answers "wait" to everyone until the window
// ends; right passwords never use it up.
const MAX_FAILED_UNLOCKS_PER_WINDOW = 100;
const failedUnlocks = { count: 0, resetAt: 0 };

function failureBudgetSpent(now: number): boolean {
  if (failedUnlocks.resetAt <= now) {
    failedUnlocks.count = 0;
    failedUnlocks.resetAt = now + UNLOCK_WINDOW_MS;
  }
  return failedUnlocks.count >= MAX_FAILED_UNLOCKS_PER_WINDOW;
}

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
    // Parse a bounded copy; formData() on the request would buffer any size.
    const body = await readLimitedText(request, MAX_FORM_BYTES);
    const form = await new Response(body, {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
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
  if (enforceUnlockRateLimit(request) || failureBudgetSpent(Date.now())) {
    return seeOther(`${next}?gate=wait`);
  }
  if (
    password.length === 0 ||
    password.length > MAX_PASSWORD_LENGTH ||
    !isPasswordCorrect(password, expected)
  ) {
    failedUnlocks.count += 1;
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
