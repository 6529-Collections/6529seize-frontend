import { BlockList, isIP } from "node:net";

import ranges from "./cloudFrontOriginFacingRanges.json";

// AWS publishes these as the addresses CloudFront uses to reach origins.
// Refresh with `node ops/scripts/sync-cloudfront-origin-facing.mjs`.
const originFacing = new BlockList();

for (const [prefixes, type] of [
  [ranges.ipv4, "ipv4"],
  [ranges.ipv6, "ipv6"],
] as const) {
  for (const prefix of prefixes) {
    const [network = "", length = ""] = prefix.split("/");
    originFacing.addSubnet(network, Number(length), type);
  }
}

/** True when the address is one CloudFront uses to connect to an origin. */
export function isCloudFrontOriginFacingAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) {
    return false;
  }
  return originFacing.check(address, family === 4 ? "ipv4" : "ipv6");
}
