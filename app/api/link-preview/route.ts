import { getLinkPreview } from "link-preview-js";
import { NextRequest, NextResponse } from "next/server";
import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, any>({
  max: 10000,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  const cached = cache.get(url);
  if (cached) {
    return NextResponse.json(cached, { status: 200 });
  }

  try {
    const data = await getLinkPreview(url);
    cache.set(url, data);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch link preview" },
      { status: 500 }
    );
  }
}
