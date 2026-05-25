import { NextResponse, type NextRequest } from "next/server";

import { fetchTweetPreview } from "@/lib/twitter";

export async function GET(request: NextRequest) {
  const href = request.nextUrl.searchParams.get("url");

  if (!href) {
    return NextResponse.json(
      { error: "Missing Twitter/X URL." },
      { status: 400 }
    );
  }

  try {
    const preview = await fetchTweetPreview(href);
    return NextResponse.json(preview);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch Twitter/X post.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
