import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { toASCII } from "node:punycode";

type UrlGuardErrorKind =
  | "missing-url"
  | "invalid-url"
  | "unsupported-protocol"
  | "host-not-allowed"
  | "dns-lookup-failed"
  | "ip-not-allowed"
  | "redirect-location-missing"
  | "redirect-location-invalid"
  | "too-many-redirects"
  | "fetch-failed"
  | "timeout";

export class UrlGuardError extends Error {
  readonly kind: UrlGuardErrorKind;
  readonly statusCode: number;

  constructor(
    message: string,
    kind: UrlGuardErrorKind,
    statusCode = 400,
    options?: { cause?: unknown | undefined }
  ) {
    super(message, options);
    this.name = "UrlGuardError";
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

export interface UrlGuardHostPolicy {
  readonly allowedHosts?: readonly string[] | undefined;
  readonly allowedHostSuffixes?: readonly string[] | undefined;
  readonly blockedHosts?: readonly string[] | undefined;
  readonly blockedHostSuffixes?: readonly string[] | undefined;
}

interface UrlGuardHooks {
  readonly onBlockedUrl?:
    | ((details: {
        readonly url: URL;
        readonly reason: UrlGuardErrorKind;
        readonly message: string;
      }) => void)
    | undefined
    | undefined;
}

export interface UrlGuardOptions {
  readonly policy?: UrlGuardHostPolicy | undefined;
  readonly allowIpAddresses?: boolean | undefined;
  readonly hooks?: UrlGuardHooks | undefined;
}

interface ParsePublicUrlOptions {
  readonly allowedProtocols?: readonly string[] | undefined;
  readonly missingUrlMessage?: string | undefined;
  readonly invalidUrlMessage?: string | undefined;
  readonly unsupportedProtocolMessage?: string | undefined;
}

export interface FetchPublicUrlOptions extends UrlGuardOptions {
  readonly maxRedirects?: number | undefined;
  readonly timeoutMs?: number | undefined;
  readonly redirectStatusCodes?: ReadonlySet<number> | undefined;
  readonly userAgent?: string | undefined;
  readonly fetchImpl?: typeof fetch | undefined;
  readonly revalidateFinalUrl?: boolean | undefined;
}

const DEFAULT_PROTOCOLS = ["http:", "https:"];
const DEFAULT_REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const DISALLOWED_HOST_PATTERNS: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
]);

const PRIVATE_IPV4_RANGES: ReadonlyArray<[number, number]> = [
  [ipv4ToInt("0.0.0.0"), ipv4ToInt("0.255.255.255")],
  [ipv4ToInt("10.0.0.0"), ipv4ToInt("10.255.255.255")],
  [ipv4ToInt("100.64.0.0"), ipv4ToInt("100.127.255.255")],
  [ipv4ToInt("127.0.0.0"), ipv4ToInt("127.255.255.255")],
  [ipv4ToInt("169.254.0.0"), ipv4ToInt("169.254.255.255")],
  [ipv4ToInt("172.16.0.0"), ipv4ToInt("172.31.255.255")],
  [ipv4ToInt("192.0.0.0"), ipv4ToInt("192.0.0.255")],
  [ipv4ToInt("192.0.2.0"), ipv4ToInt("192.0.2.255")],
  [ipv4ToInt("192.168.0.0"), ipv4ToInt("192.168.255.255")],
  [ipv4ToInt("198.18.0.0"), ipv4ToInt("198.19.255.255")],
  [ipv4ToInt("198.51.100.0"), ipv4ToInt("198.51.100.255")],
  [ipv4ToInt("203.0.113.0"), ipv4ToInt("203.0.113.255")],
  [ipv4ToInt("224.0.0.0"), ipv4ToInt("239.255.255.255")],
  [ipv4ToInt("240.0.0.0"), ipv4ToInt("255.255.255.255")],
];

function ipv4ToInt(ip: string): number {
  const segments = ip.split(".").map((segment) => Number.parseInt(segment, 10));
  if (
    segments.length !== 4 ||
    segments.some((segment) => Number.isNaN(segment))
  ) {
    return -1;
  }

  return (
    ((segments[0]! << 24) +
      (segments[1]! << 16) +
      (segments[2]! << 8) +
      segments[3]!) >>>
    0
  );
}

function isPrivateIpv4(address: string): boolean {
  const value = ipv4ToInt(address);

  if (value < 0) {
    return true;
  }

  return PRIVATE_IPV4_RANGES.some(
    ([start, end]) => value >= start && value <= end
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (
    normalized === "::1" ||
    normalized === "0:0:0:0:0:0:0:1" ||
    normalized === "::" ||
    normalized === "0:0:0:0:0:0:0:0"
  ) {
    return true;
  }

  const segments = normalized.split(":");
  const firstBlock = segments.find((segment) => segment.length > 0) ?? "";

  if (firstBlock.startsWith("fc") || firstBlock.startsWith("fd")) {
    return true;
  }

  if (
    firstBlock.startsWith("fe8") ||
    firstBlock.startsWith("fe9") ||
    firstBlock.startsWith("fea") ||
    firstBlock.startsWith("feb")
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    const mappedIpv4 = normalized.split("::ffff:")[1];
    if (mappedIpv4) {
      return isPrivateIpv4(mappedIpv4);
    }
  }

  return false;
}

function isSuspiciousIpFormat(host: string): boolean {
  const lowerHost = host.toLowerCase();

  if (/^0x[0-9a-f]+$/i.test(lowerHost)) {
    return true;
  }

  if (/^0[0-7.]+$/.test(lowerHost)) {
    return true;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(lowerHost)) {
    const segments = lowerHost.split(".");
    return segments.some(
      (segment) => segment.length > 1 && segment.startsWith("0")
    );
  }

  return false;
}

function isForbiddenAddress(address: string): boolean {
  const ipType = isIP(address);

  if (ipType === 4) {
    return isPrivateIpv4(address);
  }

  if (ipType === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

function stripTrailingDots(value: string): string {
  let end = value.length;
  while (end > 0 && value.codePointAt(end - 1) === 46) {
    end -= 1;
  }
  return end === value.length ? value : value.slice(0, end);
}

function normalizeHostname(hostname: string): string {
  try {
    const ascii = toASCII(hostname.trim());
    return stripTrailingDots(ascii).toLowerCase();
  } catch {
    return stripTrailingDots(hostname.trim()).toLowerCase();
  }
}

function emitBlockedHook(
  url: URL,
  reason: UrlGuardErrorKind,
  message: string,
  hooks?: UrlGuardHooks
): void {
  if (hooks?.onBlockedUrl) {
    try {
      hooks.onBlockedUrl({ url, reason, message });
    } catch {
      // swallow hook errors to avoid masking guard failures
    }
  }
}

function checkHostPolicy(
  hostname: string,
  url: URL,
  policy: UrlGuardHostPolicy | undefined,
  hooks?: UrlGuardHooks
): void {
  if (!policy) {
    return;
  }

  const {
    allowedHosts,
    allowedHostSuffixes,
    blockedHosts,
    blockedHostSuffixes,
  } = policy;

  if (blockedHosts?.some((entry) => hostname === entry.toLowerCase())) {
    const message = "URL host is explicitly blocked.";
    emitBlockedHook(url, "host-not-allowed", message, hooks);
    throw new UrlGuardError(message, "host-not-allowed");
  }

  if (
    blockedHostSuffixes?.some((suffix) =>
      hostname.endsWith(suffix.toLowerCase())
    )
  ) {
    const message = "URL host suffix is blocked.";
    emitBlockedHook(url, "host-not-allowed", message, hooks);
    throw new UrlGuardError(message, "host-not-allowed");
  }

  if (allowedHosts || allowedHostSuffixes) {
    const isAllowedByExactMatch =
      allowedHosts?.some((entry) => hostname === entry.toLowerCase()) ?? false;
    const isAllowedBySuffix =
      allowedHostSuffixes?.some(
        (suffix) =>
          hostname === suffix.toLowerCase() ||
          hostname.endsWith(`.${suffix.toLowerCase()}`)
      ) ?? false;

    if (!isAllowedByExactMatch && !isAllowedBySuffix) {
      const message = "URL host is not in the allowed list.";
      emitBlockedHook(url, "host-not-allowed", message, hooks);
      throw new UrlGuardError(message, "host-not-allowed");
    }
  }
}

export function parsePublicUrl(
  value: string | null | undefined,
  options: ParsePublicUrlOptions = {}
): URL {
  if (!value) {
    throw new UrlGuardError(
      options.missingUrlMessage ?? "A url query parameter is required.",
      "missing-url"
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new UrlGuardError(
      options.invalidUrlMessage ??
        "The provided url parameter is not a valid URL.",
      "invalid-url"
    );
  }

  const protocol = parsed.protocol.toLowerCase();
  const allowedProtocols = options.allowedProtocols ?? DEFAULT_PROTOCOLS;
  if (!allowedProtocols.includes(protocol)) {
    throw new UrlGuardError(
      options.unsupportedProtocolMessage ?? "Only HTTP(S) URLs are supported.",
      "unsupported-protocol"
    );
  }

  return parsed;
}

export async function assertPublicUrl(
  url: URL,
  options: UrlGuardOptions = {}
): Promise<void> {
  let hostname = url.hostname;

  if (!hostname) {
    const message = "URL host is required.";
    emitBlockedHook(url, "host-not-allowed", message, options.hooks);
    throw new UrlGuardError(message, "host-not-allowed");
  }

  hostname = normalizeHostname(hostname);

  const lowerHost = hostname.toLowerCase();
  if (
    DISALLOWED_HOST_PATTERNS.has(lowerHost) ||
    lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local") ||
    isSuspiciousIpFormat(lowerHost) ||
    lowerHost.startsWith("::ffff:")
  ) {
    const message = "URL host is not allowed.";
    emitBlockedHook(url, "host-not-allowed", message, options.hooks);
    throw new UrlGuardError(message, "host-not-allowed");
  }

  checkHostPolicy(lowerHost, url, options.policy, options.hooks);

  if (isIP(hostname) !== 0) {
    if (options.allowIpAddresses) {
      return;
    }

    if (isForbiddenAddress(hostname)) {
      const message = "IP addresses in this range are not allowed.";
      emitBlockedHook(url, "ip-not-allowed", message, options.hooks);
      throw new UrlGuardError(message, "ip-not-allowed");
    }
    return;
  }

  let lookupResults: readonly { address: string; family: number }[];
  try {
    lookupResults = await lookup(hostname, { all: true });
  } catch (error) {
    const message = "Failed to resolve URL host.";
    emitBlockedHook(url, "dns-lookup-failed", message, options.hooks);
    throw new UrlGuardError(message, "dns-lookup-failed", 400, {
      cause: error,
    });
  }

  if (lookupResults.length === 0) {
    const message = "Failed to resolve URL host.";
    emitBlockedHook(url, "dns-lookup-failed", message, options.hooks);
    throw new UrlGuardError(message, "dns-lookup-failed");
  }

  const hasForbiddenAddress = lookupResults.some(({ address }) => {
    const resolvedAddress = address.toLowerCase();
    return isForbiddenAddress(resolvedAddress);
  });

  if (hasForbiddenAddress) {
    const message = "Resolved host is not reachable.";
    emitBlockedHook(url, "ip-not-allowed", message, options.hooks);
    throw new UrlGuardError(message, "ip-not-allowed");
  }
}

export async function fetchPublicUrl(
  input: string | URL,
  init: RequestInit = {},
  options: FetchPublicUrlOptions = {}
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRedirects = options.maxRedirects ?? 5;
  const redirectStatusCodes =
    options.redirectStatusCodes ?? DEFAULT_REDIRECT_STATUS_CODES;

  let initialUrl: URL;
  try {
    initialUrl =
      typeof input === "string" ? new URL(input) : new URL(input.toString());
  } catch (error) {
    throw new UrlGuardError("Invalid URL provided.", "invalid-url", 400, {
      cause: error,
    });
  }

  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (true) {
    await assertPublicUrl(currentUrl, options);

    const headers = new Headers(init.headers);
    if (options.userAgent && !headers.has("user-agent")) {
      headers.set("user-agent", options.userAgent);
    }

    let timeoutId: NodeJS.Timeout | undefined;
    let abortedByTimeout = false;
    const controller = new AbortController();
    const signals: AbortSignal[] = [];
    if (init.signal) {
      signals.push(init.signal);
    }

    const abortHandler = (event: Event) => {
      const target = event.target as AbortSignal;
      controller.abort(target.reason);
    };

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
      } else {
        signal.addEventListener("abort", abortHandler, { once: true });
      }
    }

    if (options.timeoutMs !== undefined) {
      timeoutId = setTimeout(() => {
        abortedByTimeout = true;
        controller.abort();
      }, options.timeoutMs);
    }

    let response: Response;
    try {
      response = await fetchImpl(currentUrl.toString(), {
        ...init,
        redirect: "manual",
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      if (abortedByTimeout) {
        throw new UrlGuardError("Request timed out.", "timeout", 504, {
          cause: error,
        });
      }

      if (error instanceof UrlGuardError) {
        throw error;
      }

      throw new UrlGuardError("Failed to fetch URL.", "fetch-failed", 502, {
        cause: error,
      });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      for (const signal of signals) {
        signal.removeEventListener("abort", abortHandler);
      }
    }

    if (redirectStatusCodes.has(response.status)) {
      if (redirectCount >= maxRedirects) {
        throw new UrlGuardError(
          "Too many redirects.",
          "too-many-redirects",
          502
        );
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new UrlGuardError(
          "Redirect response missing location header.",
          "redirect-location-missing",
          502
        );
      }

      let nextUrl: URL;
      try {
        nextUrl = new URL(location, currentUrl);
      } catch (error) {
        throw new UrlGuardError(
          "Redirect response has invalid location.",
          "redirect-location-invalid",
          502,
          { cause: error }
        );
      }

      currentUrl = nextUrl;
      redirectCount += 1;
      continue;
    }

    if (options.revalidateFinalUrl !== false && response.url) {
      try {
        const finalUrl = new URL(response.url);
        await assertPublicUrl(finalUrl, options);
      } catch (error) {
        if (error instanceof UrlGuardError) {
          throw error;
        }
        throw new UrlGuardError(
          "Failed to validate final URL.",
          "fetch-failed",
          502,
          { cause: error }
        );
      }
    }

    return response;
  }
}

export async function fetchPublicJson<T>(
  input: string | URL,
  init: RequestInit = {},
  options: FetchPublicUrlOptions = {}
): Promise<T> {
  const response = await fetchPublicUrl(input, init, options);

  if (!response.ok) {
    throw new UrlGuardError(
      `Request failed with status ${response.status}`,
      "fetch-failed",
      response.status
    );
  }

  return (await response.json()) as T;
}
