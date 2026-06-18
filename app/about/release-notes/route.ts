import { type NextRequest, NextResponse } from "next/server";

const RELEASES_WAVE_PATH = "/waves/05b14183-e153-4e47-bc66-42a0f49102d4";

function redirectToReleasesWave(request: NextRequest): NextResponse {
  const targetUrl = new URL(RELEASES_WAVE_PATH, request.url);

  return NextResponse.redirect(targetUrl, 301);
}

export function GET(request: NextRequest): NextResponse {
  return redirectToReleasesWave(request);
}

export function HEAD(request: NextRequest): NextResponse {
  return redirectToReleasesWave(request);
}
