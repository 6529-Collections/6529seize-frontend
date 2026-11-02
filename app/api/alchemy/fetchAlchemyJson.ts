import {
  createFetchDeadline,
  discardResponse,
} from "@/lib/fetch/fetchDeadline";
import { readLimitedText } from "@/lib/fetch/limitedBody";

const UPSTREAM_TIMEOUT_MS = 8000;

type AlchemyJsonResult =
  | { readonly ok: true; readonly payload: unknown; readonly text: string }
  | { readonly ok: false; readonly status: number };

/**
 * Fetches an Alchemy JSON response within a deadline and a byte cap. Upstream
 * failures resolve to a status (504 for timeouts, 502 for network, size, or
 * parse failures); only a caller abort rejects.
 */
export async function fetchAlchemyJson(
  url: string,
  {
    maxBytes,
    signal,
  }: { readonly maxBytes: number; readonly signal: AbortSignal }
): Promise<AlchemyJsonResult> {
  const deadline = createFetchDeadline(
    signal,
    UPSTREAM_TIMEOUT_MS,
    () => new Error("Alchemy request timed out")
  );
  try {
    return await deadline.run(async (): Promise<AlchemyJsonResult> => {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: deadline.signal,
      });
      if (!response.ok) {
        discardResponse(response);
        return { ok: false, status: response.status };
      }
      const text = await readLimitedText(response, maxBytes);
      return { ok: true, payload: JSON.parse(text) as unknown, text };
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    return { ok: false, status: deadline.signal.aborted ? 504 : 502 };
  } finally {
    deadline.dispose();
  }
}
