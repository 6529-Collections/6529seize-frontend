import type { Breadcrumb, Event } from "@sentry/nextjs";

const REDACTED = "[Filtered]";

const JWT_PATTERN = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
const STRIPE_KEY_PATTERN = /\b(sk|pk)_[a-zA-Z0-9]{16,}\b/g;
const BEARER_PATTERN = /\bBearer\s+([A-Za-z0-9._~+/=-]+)\b/g;
const BASIC_PATTERN = /\bBasic\s+([A-Za-z0-9+/=]+)\b/g;

const SENSITIVE_KEY_FRAGMENT_PATTERN =
  /(auth|authorization|cookie|set-cookie|token|secret|password|passwd|session|api[_-]?key|private[_-]?key|signature|body|payload)/i;

const SENSITIVE_HEADER_NAME_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|x-auth-token|x-csrf-token|x-xsrf-token|proxy-authorization|x-forwarded-for|x-real-ip|cf-connecting-ip)$/i;

function sanitizeString(value: string): string {
  if (!value) return value;
  let sanitized = value;
  sanitized = sanitized.replace(JWT_PATTERN, REDACTED);
  sanitized = sanitized.replace(STRIPE_KEY_PATTERN, REDACTED);
  sanitized = sanitized.replace(BEARER_PATTERN, "Bearer " + REDACTED);
  sanitized = sanitized.replace(BASIC_PATTERN, "Basic " + REDACTED);
  return sanitized.length > 2048 ? sanitized.slice(0, 2048) : sanitized;
}

export function sanitizeUrlString(value: unknown): unknown {
  if (typeof value !== "string") return value;

  // Fast-path: drop query / hash without needing URL parsing.
  const noHash = value.split("#", 1)[0] ?? value;
  const noQuery = noHash.split("?", 1)[0] ?? noHash;

  // If it looks like a URL, keep only the pathname.
  try {
    const parsed = new URL(value, "http://localhost");
    return parsed.pathname || "/";
  } catch {
    return noQuery;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function sanitizeUnknown(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (depth > 8) return REDACTED;

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeUnknown(v, depth + 1, seen));
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) return REDACTED;
    seen.add(value);

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEY_FRAGMENT_PATTERN.test(key)) {
        result[key] = REDACTED;
        continue;
      }

      if (key === "url" || key === "from" || key === "to") {
        result[key] = sanitizeUrlString(val);
        continue;
      }

      result[key] = sanitizeUnknown(val, depth + 1, seen);
    }
    return result;
  }

  return value;
}

function sanitizeHeaders(
  headers: unknown
): Record<string, unknown> | undefined {
  if (!headers) return undefined;
  if (!isPlainObject(headers)) return undefined;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(headers)) {
    if (/^(referer|referrer)$/i.test(key)) {
      result[key] = typeof val === "string" ? sanitizeUrlString(val) : REDACTED;
      continue;
    }

    if (SENSITIVE_HEADER_NAME_PATTERN.test(key)) {
      result[key] = REDACTED;
      continue;
    }

    if (typeof val === "string") {
      result[key] = sanitizeString(val);
      continue;
    }

    result[key] = sanitizeUnknown(val, 0, new WeakSet<object>());
  }
  return result;
}

export function sanitizeSentryBreadcrumb(
  breadcrumb: Breadcrumb | undefined | null
): Breadcrumb | null {
  if (!breadcrumb) return null;

  const crumb = { ...breadcrumb };
  if (typeof crumb.message === "string") {
    crumb.message = sanitizeString(crumb.message);
  }
  if (typeof crumb.category === "string") {
    crumb.category = sanitizeString(crumb.category);
  }
  if (typeof crumb.type === "string") {
    crumb.type = sanitizeString(crumb.type);
  }

  if (crumb.data) {
    const seen = new WeakSet<object>();
    crumb.data = sanitizeUnknown(crumb.data, 0, seen) as NonNullable<
      Breadcrumb["data"]
    >;
  }

  return crumb;
}

export function sanitizeSentryEvent<T extends Event>(event: T): T {
  // Avoid mutating the original reference in case Sentry reuses it.
  const next = { ...event } as T;

  // Do not send user-identifying fields by default.
  delete (next as any).user;

  if (next.request) {
    const req: Record<string, unknown> = { ...(next.request as any) };

    if (typeof req["url"] === "string") {
      req["url"] = sanitizeUrlString(req["url"]);
    }

    const sanitizedHeaders = sanitizeHeaders(req["headers"]);
    if (sanitizedHeaders) {
      req["headers"] = sanitizedHeaders;
    } else {
      delete req["headers"];
    }

    // Request bodies and cookies can contain user content and credentials.
    delete req["cookies"];
    delete req["data"];
    delete req["query_string"];

    (next as any).request = req;
  }

  if (typeof next.message === "string") {
    next.message = sanitizeString(next.message);
  }

  if (next.exception?.values) {
    next.exception = {
      ...next.exception,
      values: next.exception.values.map((v) => {
        const value = { ...v };
        if (typeof value.value === "string") {
          value.value = sanitizeString(value.value);
        }
        if (typeof value.type === "string") {
          value.type = sanitizeString(value.type);
        }
        return value;
      }),
    };
  }

  if (Array.isArray(next.breadcrumbs)) {
    next.breadcrumbs = next.breadcrumbs
      .map((b) => sanitizeSentryBreadcrumb(b))
      .filter(Boolean) as Breadcrumb[];
  }

  const seen = new WeakSet<object>();
  if (next.extra) {
    next.extra = sanitizeUnknown(next.extra, 0, seen) as NonNullable<
      Event["extra"]
    >;
  }
  if (next.contexts) {
    next.contexts = sanitizeUnknown(next.contexts, 0, seen) as NonNullable<
      Event["contexts"]
    >;
  }

  return next;
}
