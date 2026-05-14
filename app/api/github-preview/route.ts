import { NextResponse, type NextRequest } from "next/server";

import { resolveGithubPreview } from "./service";

export async function GET(request: NextRequest) {
  try {
    const preview = await resolveGithubPreview(
      request.nextUrl.searchParams.get("url"),
      { bypassCache: request.nextUrl.searchParams.get("refresh") === "1" }
    );
    return NextResponse.json(preview);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch GitHub preview metadata.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
