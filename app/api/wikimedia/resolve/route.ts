import { NextRequest, NextResponse } from "next/server";

import type { WikimediaPreview } from "@/types/wikimedia";

import {
  WikimediaUnsupportedError,
  getWikimediaPreview,
} from "./service";

const parseAcceptLanguage = (header: string | null): string | undefined => {
  if (!header) {
    return undefined;
  }

  const segments = header
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return undefined;
  }

  const primary = segments[0].split(";")[0]?.trim();
  if (!primary || primary === "*") {
    return undefined;
  }

  return primary;
};

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  try {
    const preview: WikimediaPreview = await getWikimediaPreview(targetUrl, {
      signal: request.signal,
      acceptLanguage: parseAcceptLanguage(request.headers.get("accept-language")),
    });

    return NextResponse.json(preview);
  } catch (error) {
    if (
      error instanceof WikimediaUnsupportedError ||
      (error instanceof Error && error.name === "WikimediaUnsupportedError")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to load Wikimedia preview.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";

export const revalidate = 0;
