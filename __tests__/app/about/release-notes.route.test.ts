import { GET, HEAD } from "@/app/about/release-notes/route";
import type { NextRequest } from "next/server";

const redirectMock = jest.fn((url: URL, status: number) => ({
  status,
  headers: {
    get: (name: string) =>
      name.toLowerCase() === "location" ? url.toString() : null,
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL, status: number) => redirectMock(url, status),
  },
}));

const RELEASES_WAVE_URL =
  "https://6529.io/waves/05b14183-e153-4e47-bc66-42a0f49102d4";

function createRequest(url: string): NextRequest {
  return {
    url,
    nextUrl: new URL(url),
  } as NextRequest;
}

describe("/about/release-notes redirect route", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("permanently redirects GET requests to the Releases wave", () => {
    const request = createRequest(
      "https://6529.io/about/release-notes?utm_source=sitemap"
    );

    const response = GET(request);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(RELEASES_WAVE_URL);
  });

  it("permanently redirects HEAD requests to the Releases wave", () => {
    const request = createRequest("https://6529.io/about/release-notes");

    const response = HEAD(request);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(RELEASES_WAVE_URL);
  });
});
