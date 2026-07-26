import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";

describe("public review standalone packaging", () => {
  it("traces all review Markdown and manifests into server output", () => {
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
      "/*": [
        "./content/public-reviews/**/*.md",
        "./content/public-reviews/**/manifest.json",
      ],
    });
  });
});
