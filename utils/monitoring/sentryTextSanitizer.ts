import type { Event } from "@sentry/nextjs";
import { redactSensitiveQueryParams } from "./sensitiveQueryParams";

const REDACTED = "[Filtered]";
const MAX_TEXT_LENGTH = 2048;
const JWT_PATTERN = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
const STRIPE_KEY_PATTERN = /\b(sk|pk)_[a-zA-Z0-9]{16,}\b/g;
const BEARER_PATTERN = /\bBearer\s+([A-Za-z0-9._~+/=-]+)\b/g;
const BASIC_PATTERN = /\bBasic\s+([A-Za-z0-9+/=]+)\b/g;

type SentryExceptionValue = NonNullable<
  NonNullable<Event["exception"]>["values"]
>[number];

type SentryStackFrame = NonNullable<
  NonNullable<SentryExceptionValue["stacktrace"]>["frames"]
>[number];

/** Redacts credentials embedded in free-text telemetry and bounds its size. */
export function sanitizeSentryText(value: string): string {
  if (!value) return value;
  let sanitized = value;
  sanitized = sanitized.replace(JWT_PATTERN, REDACTED);
  sanitized = sanitized.replace(STRIPE_KEY_PATTERN, REDACTED);
  sanitized = sanitized.replace(BEARER_PATTERN, "Bearer " + REDACTED);
  sanitized = sanitized.replace(BASIC_PATTERN, "Basic " + REDACTED);
  sanitized = redactSensitiveQueryParams(sanitized);
  return sanitized.length > MAX_TEXT_LENGTH
    ? sanitized.slice(0, MAX_TEXT_LENGTH)
    : sanitized;
}

function sanitizeStackFrame(frame: SentryStackFrame): SentryStackFrame {
  const next = { ...frame };
  // Inline-script frames use the document URL, including its query string.
  if (typeof next.filename === "string") {
    next.filename = redactSensitiveQueryParams(next.filename);
  }
  if (typeof next.abs_path === "string") {
    next.abs_path = redactSensitiveQueryParams(next.abs_path);
  }
  return next;
}

/** Sanitizes an exception's text and the URLs of its stack frames. */
export function sanitizeSentryExceptionValue(
  exception: SentryExceptionValue
): SentryExceptionValue {
  const value = { ...exception };
  if (typeof value.value === "string") {
    value.value = sanitizeSentryText(value.value);
  }
  if (typeof value.type === "string") {
    value.type = sanitizeSentryText(value.type);
  }
  const frames = value.stacktrace?.frames;
  if (Array.isArray(frames)) {
    value.stacktrace = {
      ...value.stacktrace,
      frames: frames.map(sanitizeStackFrame),
    };
  }
  return value;
}
