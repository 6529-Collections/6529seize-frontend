import { PUBLIC_VECTORS_JSON } from "@/components/explained/engine/publicVectors";

// Built once from the engine's copy of the five public conformance vectors.
export const dynamic = "force-static";

// The vectors change only with a new rule version; a day is fresh enough.
const CACHE_CONTROL = "public, max-age=86400";

/**
 * Five of P26's conformance vectors, restated in full for anyone testing an
 * implementation of TDH v1.4 (the Implementations page links here). The
 * text is served as written: some values are integers of 2^64 and more,
 * which a JSON reader must keep exact.
 */
export function GET() {
  return new Response(`${PUBLIC_VECTORS_JSON}\n`, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
