/**
 * @jest-environment node
 */
import { GET, HEAD } from "@/app/about/release-notes/route";

const RELEASES_WAVE_PATH = "/waves/05b14183-e153-4e47-bc66-42a0f49102d4";

describe("/about/release-notes redirect route", () => {
  it("permanently redirects GET requests to the Releases wave on the same host", () => {
    const response = GET();

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(RELEASES_WAVE_PATH);
  });

  it("permanently redirects HEAD requests to the Releases wave on the same host", () => {
    const response = HEAD();

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(RELEASES_WAVE_PATH);
  });
});
