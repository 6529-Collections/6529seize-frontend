/** @jest-environment node */
import { isIP } from "node:net";

import { isCloudFrontOriginFacingAddress } from "@/lib/security/cloudFrontOriginFacing";
import ranges from "@/lib/security/cloudFrontOriginFacingRanges.json";

describe("isCloudFrontOriginFacingAddress", () => {
  it("ships well-formed published prefixes for both address families", () => {
    expect(ranges.service).toBe("CLOUDFRONT_ORIGIN_FACING");
    expect(ranges.ipv4.length).toBeGreaterThan(0);
    for (const [prefixes, family, maxBits] of [
      [ranges.ipv4, 4, 32],
      [ranges.ipv6, 6, 128],
    ] as const) {
      for (const prefix of prefixes) {
        const [network = "", length = ""] = prefix.split("/");
        expect(isIP(network)).toBe(family);
        expect(Number(length)).toBeGreaterThanOrEqual(8);
        expect(Number(length)).toBeLessThanOrEqual(maxBits);
      }
    }
  });

  it("matches every address inside a published network", () => {
    for (const prefix of ranges.ipv4) {
      const [network = ""] = prefix.split("/");
      expect(isCloudFrontOriginFacingAddress(network)).toBe(true);
    }
    const [ipv6Network = ""] = (ranges.ipv6[0] ?? "").split("/");
    expect(isCloudFrontOriginFacingAddress(ipv6Network)).toBe(true);
  });

  it("rejects public addresses outside CloudFront and non-addresses", () => {
    expect(isCloudFrontOriginFacingAddress("8.8.8.8")).toBe(false);
    expect(isCloudFrontOriginFacingAddress("2a00:1450::1")).toBe(false);
    expect(isCloudFrontOriginFacingAddress("10.0.0.1")).toBe(false);
    expect(isCloudFrontOriginFacingAddress("not-an-address")).toBe(false);
    expect(isCloudFrontOriginFacingAddress("")).toBe(false);
  });
});
