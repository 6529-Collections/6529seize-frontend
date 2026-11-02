#!/usr/bin/env node
// Refreshes lib/security/cloudFrontOriginFacingRanges.json from AWS's
// published ranges. The client rate limiter treats these addresses as the
// CloudFront hop in front of the frontend origin. Run it when AWS announces a
// CloudFront range change, then review and commit the diff.
//
//   node ops/scripts/sync-cloudfront-origin-facing.mjs          # write
//   node ops/scripts/sync-cloudfront-origin-facing.mjs --check  # exit 1 on drift

import { readFileSync, writeFileSync } from "node:fs";
import { isIP } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = "https://ip-ranges.amazonaws.com/ip-ranges.json";
const SERVICE = "CLOUDFRONT_ORIGIN_FACING";
const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../lib/security/cloudFrontOriginFacingRanges.json"
);

function validPrefix(prefix, family) {
  const [address, length, extra] = prefix.split("/");
  const bits = Number(length);
  const maxBits = family === 4 ? 32 : 128;
  return (
    extra === undefined &&
    isIP(address) === family &&
    Number.isInteger(bits) &&
    bits >= 8 &&
    bits <= maxBits
  );
}

function collect(entries, field, family) {
  const prefixes = [
    ...new Set(
      entries
        .filter((entry) => entry.service === SERVICE)
        .map((entry) => entry[field])
    ),
  ].sort();
  const invalid = prefixes.filter((prefix) => !validPrefix(prefix, family));
  if (invalid.length > 0) {
    throw new Error(`Unexpected ${SERVICE} prefixes: ${invalid.join(", ")}`);
  }
  return prefixes;
}

const response = await fetch(SOURCE, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) {
  throw new Error(`${SOURCE} answered ${response.status}`);
}
const published = await response.json();
const ipv4 = collect(published.prefixes ?? [], "ip_prefix", 4);
const ipv6 = collect(published.ipv6_prefixes ?? [], "ipv6_prefix", 6);
if (ipv4.length === 0) {
  throw new Error(`${SOURCE} lists no IPv4 ${SERVICE} prefixes`);
}

const next = `${JSON.stringify({ source: SOURCE, service: SERVICE, ipv4, ipv6 }, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = readFileSync(OUTPUT, "utf8");
  if (current !== next) {
    console.error(
      `${OUTPUT} is out of date; run ops/scripts/sync-cloudfront-origin-facing.mjs`
    );
    process.exit(1);
  }
  console.log(
    `CloudFront origin-facing ranges are current (${ipv4.length} IPv4, ${ipv6.length} IPv6).`
  );
} else {
  writeFileSync(OUTPUT, next);
  console.log(`Wrote ${ipv4.length} IPv4 and ${ipv6.length} IPv6 prefixes.`);
}
