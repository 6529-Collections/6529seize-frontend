/** @jest-environment node */
import { tmpdir } from "node:os";
import loadConfig from "next/dist/server/config";
import { PHASE_PRODUCTION_SERVER } from "next/dist/shared/lib/constants";
import { hasLocalMatch } from "next/dist/shared/lib/match-local-pattern";
import type { PublicEnv } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";

const publicEnv = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
} as PublicEnv;

// The app leaves images.localPatterns unset and relies on the default Next
// applies when it loads the config: local sources are allowed only without a
// query string.
describe("image optimizer local sources (Next default)", () => {
  const loadLocalPatterns = async () => {
    const images = sharedConfig(publicEnv, "").images;
    expect(images?.localPatterns).toBeUndefined();
    const config = await loadConfig(PHASE_PRODUCTION_SERVER, tmpdir(), {
      customConfig: { images },
    });
    return config.images.localPatterns;
  };

  it("refuses a local source that carries a query string", async () => {
    const localPatterns = await loadLocalPatterns();

    for (const src of [
      "/api/og-metadata/image?url=https%3A%2F%2Fexample.com%2Fa.png",
      "/api/profile-cms/assets?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fimages%2Fa.webp",
      "/faq-profile.jpg?v=2",
    ]) {
      expect([src, hasLocalMatch(localPatterns, src)]).toEqual([src, false]);
    }
  });

  it("still allows public/ images without a query string", async () => {
    const localPatterns = await loadLocalPatterns();

    for (const src of [
      "/faq-waves-view.jpg",
      "/emojis/sgt_saluting_face.webp",
      "/profile-cms/templates/memes/1.webp",
    ]) {
      expect([src, hasLocalMatch(localPatterns, src)]).toEqual([src, true]);
    }
  });
});
