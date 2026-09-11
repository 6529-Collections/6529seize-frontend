import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";

describe("public review standalone packaging", () => {
  it("keeps review inputs out of Next traces for every public host", () => {
    const config = sharedConfig(
      {
        API_ENDPOINT: "https://api.example.com",
        ALLOWLIST_API_ENDPOINT: "https://allowlist.example.com",
        BASE_ENDPOINT: "https://staging.6529.io",
        IPFS_API_ENDPOINT: "https://ipfs.example.com",
        IPFS_GATEWAY_ENDPOINT: "https://gateway.example.com",
      } as PublicEnv,
      ""
    );

    expect(config.outputFileTracingIncludes).toEqual({
      "/api/og-metadata/image": [
        "node_modules/@img/sharp-libvips-*/**/*",
        "node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/**/*",
      ],
    });
    expect(config.outputFileTracingExcludes).toEqual({
      "/*": ["content/public-reviews/**/*", "public/review-data/**/*"],
    });
  });
});
