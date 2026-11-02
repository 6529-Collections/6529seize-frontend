import {
  FIXTURE_DAY_TEXTS,
  FIXTURE_INDEX_TEXT,
} from "@/lib/explained/fixtures/feedFixture";
import { PUBLIC_TDH_FEED_BASE } from "@/lib/tdh/verification/feedSource";

/** A fetch response with its body's exact bytes (jsdom has no Response). */
function respond(text: string, status: number): Response {
  const bytes = new TextEncoder().encode(text);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text) as unknown,
    text: async () => text,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as Response;
}

/**
 * The public feed of 2026-10-18 09:40 UTC (the moment the final mockups
 * were rendered), served byte for byte, so a page's hashes and counts can
 * be checked against the mockups' values. Every other request is refused
 * as CloudFront refuses a file it does not hold (403): the Lean manifest
 * falls back to the copy bundled with the site, and 6529.io's API is down.
 */
export function serveFixtureFeed(
  overrides: Readonly<Record<string, string | null>> = {}
): jest.Mock {
  const files: Record<string, string | null> = {
    [`${PUBLIC_TDH_FEED_BASE}index.json`]: FIXTURE_INDEX_TEXT,
    ...Object.fromEntries(
      Object.entries(FIXTURE_DAY_TEXTS).map(([cycle, text]) => [
        `${PUBLIC_TDH_FEED_BASE}days/${cycle}.json`,
        text,
      ])
    ),
    ...overrides,
  };
  const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
    const text = files[String(input)];
    return text === undefined || text === null
      ? respond('{"error":"AccessDenied"}', 403)
      : respond(text, 200);
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** The fixture's day file, parsed: a day as the feed published it. */
export function fixtureDay(cycle: number): Record<string, unknown> {
  const text = FIXTURE_DAY_TEXTS[cycle];
  if (text === undefined) {
    throw new Error(`no fixture day ${cycle}`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}
