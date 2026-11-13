/** @jest-environment node */
import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";

const WAVE_ID = "05b14183-e153-4e47-bc66-42a0f49102d4";

const getResponse = (pathAndQuery: string) => {
  const config = sharedConfig(
    {
      API_ENDPOINT: "https://api.6529.io",
      BASE_ENDPOINT: "https://6529.io",
      IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
    } as PublicEnv,
    ""
  );
  return unstable_getResponseFromNextConfig({
    url: `https://6529.io${pathAndQuery}`,
    nextConfig: {
      redirects: async () => (await config.redirects?.()) ?? [],
    },
  });
};

// Competitions are now called decisions. Links in posts, notifications and
// push payloads still carry the former route, so it must keep resolving.
describe("legacy competition route redirects", () => {
  it.each([
    [`/waves/${WAVE_ID}/competitions`, `/waves/${WAVE_ID}/decisions`],
    [`/waves/${WAVE_ID}/competitions/new`, `/waves/${WAVE_ID}/decisions/new`],
    [
      `/waves/${WAVE_ID}/competitions/competition-1`,
      `/waves/${WAVE_ID}/decisions/competition-1`,
    ],
  ])(
    "redirects %s permanently to %s with query parameters intact",
    async (oldPath, newPath) => {
      const response = await getResponse(
        `${oldPath}?entry=entry-1&tab=leaderboard&drop=drop-1`
      );
      expect(response.status).toBe(308);
      const destination = new URL(response.headers.get("location")!);
      expect(destination.pathname).toBe(newPath);
      expect(destination.searchParams.get("entry")).toBe("entry-1");
      expect(destination.searchParams.get("tab")).toBe("leaderboard");
      expect(destination.searchParams.get("drop")).toBe("drop-1");
    }
  );

  it.each([
    `/waves/${WAVE_ID}`,
    `/waves/${WAVE_ID}/decisions`,
    `/waves/${WAVE_ID}/decisions/competition-1`,
    "/waves/create",
  ])("leaves %s unredirected", async (pathname) => {
    const response = await getResponse(pathname);
    expect(response.headers.get("location")).toBeNull();
  });
});
