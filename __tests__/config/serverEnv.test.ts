/** @jest-environment node */

import { publicEnvSchema } from "@/config/env.schema";
import {
  getFarcasterWarpcastApiKey,
  getStagingApiKey,
} from "@/config/serverEnv";

const SERVER_ONLY_KEYS = ["STAGING_API_KEY", "FARCASTER_WARPCAST_API_KEY"];

const setEnv = (key: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

describe("server-only credentials", () => {
  afterEach(() => {
    for (const key of SERVER_ONLY_KEYS) {
      setEnv(key, undefined);
    }
  });

  it.each([
    ["STAGING_API_KEY", getStagingApiKey],
    ["FARCASTER_WARPCAST_API_KEY", getFarcasterWarpcastApiKey],
  ] as const)("reads %s at call time", (key, read) => {
    setEnv(key, undefined);
    expect(read()).toBeUndefined();

    setEnv(key, "  server-value  ");
    expect(read()).toBe("server-value");

    setEnv(key, "   ");
    expect(read()).toBeUndefined();
  });

  it("keeps them out of the public runtime configuration", () => {
    const parsed = publicEnvSchema.parse({
      ALLOWLIST_API_ENDPOINT: "https://allowlist.example.test",
      API_ENDPOINT: "https://api.example.test",
      BASE_ENDPOINT: "https://6529.io",
      IPFS_API_ENDPOINT: "https://ipfs-api.example.test",
      IPFS_GATEWAY_ENDPOINT: "https://ipfs.example.test",
      STAGING_API_KEY: "staging-fixture-value",
      FARCASTER_WARPCAST_API_KEY: "warpcast-fixture-value",
    });

    for (const key of SERVER_ONLY_KEYS) {
      expect(parsed).not.toHaveProperty(key);
    }
    expect(JSON.stringify(parsed)).not.toContain("fixture-value");
  });
});
