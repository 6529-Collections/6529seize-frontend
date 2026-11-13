import { NextResponse, type NextRequest } from "next/server";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getE2eeEmojiPack } from "@/lib/e2ee/emoji-pack.server";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";

export const dynamic = "force-dynamic";

const PACK_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
  "Content-Type": "application/json",
};

// A client loads the pack once and keeps it; this only bounds repeats.
const enforceRateLimit = createClientRateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
  errorMessage: "Too many emoji pack requests",
});

// The pack is built once per process and served as the same JSON text, so a
// request never re-serialises it.
let serialised: { readonly pack: unknown; readonly json: string } | null = null;

function serialisePack(pack: unknown): string {
  if (serialised !== null && serialised.pack === pack) {
    return serialised.json;
  }
  const json = JSON.stringify(pack);
  serialised = { pack, json };
  return json;
}

export async function GET(request: NextRequest) {
  if (!isE2eeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // The pack has one URL; any query string would only create another cache
  // entry for the same content.
  if (request.nextUrl.search !== "") {
    return NextResponse.json(
      { error: "Unexpected query parameters" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const json = serialisePack(await getE2eeEmojiPack());
    return new NextResponse(json, { headers: PACK_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Emoji pack unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
