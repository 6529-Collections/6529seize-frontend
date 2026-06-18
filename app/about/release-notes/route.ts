import { type NextRequest, NextResponse } from "next/server";

const RELEASES_WAVE_URL =
  "https://6529.io/waves/05b14183-e153-4e47-bc66-42a0f49102d4";

function redirectToReleasesWave(_request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(RELEASES_WAVE_URL), 301);
}

export function GET(request: NextRequest): NextResponse {
  return redirectToReleasesWave(request);
}

export function HEAD(request: NextRequest): NextResponse {
  return redirectToReleasesWave(request);
}
