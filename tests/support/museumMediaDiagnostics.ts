import type { Page } from "@playwright/test";

import type { PageDiagnostics } from "./consoleDiagnostics";

const MEDIA_HOSTS = new Set([
  "media-proxy.artblocks.io",
  "core-api.artblocks.io",
  "artblocks-mainnet.s3.amazonaws.com",
  "art-blocks-bright-moments-mainnet.s3.amazonaws.com",
  "abstudio-92-mainnet.s3.amazonaws.com",
  "sothebys-gen-art-mainnet.s3.amazonaws.com",
]);
const EVIDENCE_HEADERS = new Set([
  "content-type",
  "content-length",
  "server",
  "x-cache",
  "retry-after",
  "x-content-type-options",
]);
const MAX_RECORDS = 32;
const MAX_REQUESTS = 128;

export function museumMediaEvidenceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !MEDIA_HOSTS.has(url.hostname))
      return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function museumMediaEvidenceHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([name]) => EVIDENCE_HEADERS.has(name.toLowerCase()))
      .map(([name, value]) => [name.toLowerCase(), value.slice(0, 256)])
  );
}

/** CDP can expose the original status even when ORB hides it from Playwright. */
export async function attachMuseumMediaDiagnostics(
  page: Page,
  diagnostics: PageDiagnostics
) {
  if (page.context().browser()?.browserType().name() !== "chromium") {
    return () => Promise.resolve();
  }
  const session = await page.context().newCDPSession(page);
  const requests = new Map<string, string>();
  let records = 0;
  const record = (value: object) => {
    if (records >= MAX_RECORDS) return;
    records += 1;
    diagnostics.networkFailures?.push(
      `Museum original browser response ${JSON.stringify(value)}`
    );
  };
  session.on(
    "Network.requestWillBeSent",
    (event: { requestId: string; request: { url: string } }) => {
      const url = museumMediaEvidenceUrl(event.request.url);
      if (url === null) {
        requests.delete(event.requestId);
        return;
      }
      if (requests.size >= MAX_REQUESTS) return;
      requests.set(event.requestId, url);
    }
  );
  session.on(
    "Network.responseReceivedExtraInfo",
    (event: {
      requestId: string;
      statusCode: number;
      headers: Record<string, string>;
    }) => {
      const url = requests.get(event.requestId);
      if (url === undefined) return;
      const headers = museumMediaEvidenceHeaders(event.headers);
      const invalidImageType =
        event.statusCode === 200 &&
        !headers["content-type"]?.toLowerCase().startsWith("image/");
      if (event.statusCode < 400 && !invalidImageType) return;
      record({
        url,
        status: event.statusCode,
        headers,
      });
    }
  );
  session.on(
    "Network.loadingFailed",
    (event: {
      requestId: string;
      errorText: string;
      blockedReason?: string;
    }) => {
      const url = requests.get(event.requestId);
      if (url === undefined) return;
      // Bodies withheld by ORB cannot be inferred from a later HTTP replay.
      record({
        url,
        error: event.errorText,
        blockedReason: event.blockedReason,
      });
    }
  );
  await session.send("Network.enable");
  return async () => {
    await session.detach().catch(() => undefined);
  };
}
