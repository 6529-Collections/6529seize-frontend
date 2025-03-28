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
  query: string
): string | null {
  try {
    const url = new URL(href);
    if (url.origin !== process.env.BASE_ENDPOINT) return null;
    if (url.pathname !== path) return null;

    const value = url.searchParams.get(query);
    if (!value) return null;
    return value;
  } catch (err) {
    return null;
  }
}
