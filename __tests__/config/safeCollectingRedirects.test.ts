/** @jest-environment node */
import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";

describe("Safe Collecting legacy redirects", () => {
  it.each([
    ["/delegation/delegation-center", "/safe-collecting"],
    ["/delegation/wallet-architecture", "/safe-collecting/tap-guide"],
    ["/delegation/delegation-faq", "/safe-collecting/faq"],
    [
      "/delegation/delegation-faq/register-delegation",
      "/safe-collecting/faq/register-delegation",
    ],
    [
      "/delegation/consolidation-use-cases",
      "/safe-collecting/consolidation-use-cases",
    ],
    ["/delegation/wallet-checker", "/safe-collecting/wallet-checker"],
    ["/delegation/build-consolidation", "/safe-collecting/build-consolidation"],
    ["/delegation/register-delegation", "/safe-collecting/register-delegation"],
    [
      "/delegation/register-sub-delegation",
      "/safe-collecting/register-sub-delegation",
    ],
    [
      "/delegation/register-consolidation",
      "/safe-collecting/register-consolidation",
    ],
    [
      "/delegation/assign-primary-address",
      "/safe-collecting/assign-primary-address",
    ],
    ["/delegation/any-collection", "/safe-collecting/any-collection"],
    ["/delegation/the-memes", "/safe-collecting/the-memes"],
    ["/delegation/meme-lab", "/safe-collecting/meme-lab"],
    ["/delegation/6529-gradient", "/safe-collecting/6529-gradient"],
    ["/about/nft-delegation", "/safe-collecting"],
  ])(
    "redirects %s permanently with query parameters intact",
    async (oldPath, newPath) => {
      const config = sharedConfig(
        {
          API_ENDPOINT: "https://api.6529.io",
          BASE_ENDPOINT: "https://6529.io",
          IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
        } as PublicEnv,
        ""
      );
      const response = await unstable_getResponseFromNextConfig({
        url: `https://6529.io${oldPath}?address=name.eth&use_case=2`,
        nextConfig: {
          redirects: async () => (await config.redirects?.()) ?? [],
        },
      });
      expect(response.status).toBe(308);
      const destination = new URL(response.headers.get("location")!);
      expect(destination.pathname).toBe(newPath);
      expect(destination.searchParams.get("address")).toBe("name.eth");
      expect(destination.searchParams.get("use_case")).toBe("2");
    }
  );
});
