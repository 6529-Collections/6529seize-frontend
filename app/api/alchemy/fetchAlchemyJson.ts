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
 * parse failures); only a caller abort rejects. A `jsonBody` is sent as a
 * JSON POST.
 */
export async function fetchAlchemyJson(
  url: string,
  {
    maxBytes,
    signal,
    jsonBody,
  }: {
    readonly maxBytes: number;
    readonly signal: AbortSignal;
    readonly jsonBody?: unknown;
  }
): Promise<AlchemyJsonResult> {
  const deadline = createFetchDeadline(
    signal,
    UPSTREAM_TIMEOUT_MS,
    () => new Error("Alchemy request timed out")
  );
  const init: RequestInit =
    jsonBody === undefined
      ? { headers: { Accept: "application/json" } }
      : {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jsonBody),
        };
  try {
    return await deadline.run(async (): Promise<AlchemyJsonResult> => {
      const response = await fetch(url, { ...init, signal: deadline.signal });
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
