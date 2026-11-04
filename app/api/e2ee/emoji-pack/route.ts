import { NextResponse } from "next/server";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getE2eeEmojiPack } from "@/lib/e2ee/emoji-pack.server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isE2eeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    return NextResponse.json(await getE2eeEmojiPack(), {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
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
