import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import { HTML_ACCEPT_HEADER, LINK_PREVIEW_USER_AGENT } from "./utils";

const USER_AGENT = LINK_PREVIEW_USER_AGENT;

export const HTML_FETCH_HEADERS = {
  accept: HTML_ACCEPT_HEADER,
} as const;

type HeaderOverrides = {
  readonly set?: Record<string, string | undefined> | undefined;
  readonly remove?: readonly string[] | undefined;
};

type HostOverrides = {
  readonly domain: string;
  readonly headers?: HeaderOverrides | undefined;
  readonly userAgent?: string | undefined;
};

const HOST_OVERRIDES: readonly HostOverrides[] = [
  {
    domain: "facebook.com",
    userAgent:
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    headers: {
      set: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        referer: "https://www.facebook.com/",
      },
    },
  },
];

function findHostOverrides(hostname: string): HostOverrides | undefined {
  return HOST_OVERRIDES.find(({ domain }) =>
    matchesDomainOrSubdomain(hostname, domain)
  );
}

function applyHeaderRemovals(
  headers: Record<string, string>,
  toRemove?: readonly string[]
): void {
  if (!toRemove) {
    return;
  }

  for (const header of toRemove) {
    delete headers[header.toLowerCase()];
  }
}

function applyHeaderAssignments(
  headers: Record<string, string>,
  entries?: Record<string, string | undefined>
): void {
  if (!entries) {
    return;
  }

  for (const [key, value] of Object.entries(entries)) {
    const normalizedKey = key.toLowerCase();
    if (typeof value === "string" && value.length > 0) {
      headers[normalizedKey] = value;
    } else {
      delete headers[normalizedKey];
    }
  }
}

export function createFetchConfig(url: URL): {
  headers: Record<string, string>;
  userAgent: string;
} {
  const overrides = findHostOverrides(url.hostname);
  const headers: Record<string, string> = { ...HTML_FETCH_HEADERS };
  const userAgent = overrides?.userAgent ?? USER_AGENT;

  if (!overrides?.headers) {
    return {
      headers,
      userAgent,
    };
  }

  applyHeaderRemovals(headers, overrides.headers.remove);
  applyHeaderAssignments(headers, overrides.headers.set);

  return {
    headers,
    userAgent,
  };
}
