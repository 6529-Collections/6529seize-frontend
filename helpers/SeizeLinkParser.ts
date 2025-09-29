import { publicEnv } from "@/config/env";

export interface SeizeQuoteLinkInfo {
  waveId: string;
  serialNo?: string;
  dropId?: string;
}

export function parseSeizeQuoteLink(href: string): SeizeQuoteLinkInfo | null {
  const regex =
    /\/my-stream\?wave=([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})&serialNo=(\d+)$/;

  const match = href.match(regex);
  if (!match) return null;

  const [, waveId, serialNo, dropId] = match;
  return { waveId, serialNo, dropId };
}

export function parseSeizeQueryLink(
  href: string,
  path: string,
  query: string[],
  exact: boolean = false
): Record<string, string> | null {
  try {
    const url = new URL(href);

    const allowedOrigins = new Set([publicEnv.BASE_ENDPOINT].filter(Boolean));

    if (!allowedOrigins.has(url.origin)) return null;
    if (url.pathname !== path) return null;

    if (exact) {
      const actualKeys = Array.from(url.searchParams.keys());
      const actualSet = new Set(actualKeys);
      const expectedSet = new Set(query);

      if (
        actualSet.size !== expectedSet.size ||
        actualKeys.some((key) => !expectedSet.has(key))
      ) {
        return null;
      }
    }

    const result: Record<string, string> = {};

    for (const key of query) {
      const value = url.searchParams.get(key);
      if (!value) return null;
      result[key] = value;
    }

    return result;
  } catch (err) {
    return null;
  }
}
