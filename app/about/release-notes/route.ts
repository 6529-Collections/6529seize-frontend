import { NextResponse } from "next/server";

// A path, not a URL: the browser resolves it on the host it is on (6529.io,
// a staging host, or the 6529 Desktop app's local server). Resolving it
// against the request URL would use the server's internal host behind a
// proxy, so the Location header stays relative.
const RELEASES_WAVE_PATH = "/waves/05b14183-e153-4e47-bc66-42a0f49102d4";

function redirectToReleasesWave(): NextResponse {
  return new NextResponse(null, {
    status: 301,
    headers: { Location: RELEASES_WAVE_PATH },
  });
}

export function GET(): NextResponse {
  return redirectToReleasesWave();
}

export function HEAD(): NextResponse {
  return redirectToReleasesWave();
}
