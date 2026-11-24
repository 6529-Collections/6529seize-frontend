/**
 * @jest-environment node
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sha256 } from "viem";
import { cidFromText } from "@/lib/museum/onchain/cid";
import { ONCHAIN_MUSEUM_SOURCE } from "@/lib/museum/onchain/constants";
import { documentPath, familyOf } from "@/lib/museum/onchain/fields";
import {
  fixtureCidFetcher,
  fixtureRegistrySnapshot,
  type ProfileFixture,
} from "@/lib/museum/onchain/fixture";
import { createCidFetcher } from "@/lib/museum/onchain/ipfs";
import {
  buildOnchainMuseum,
  type OnchainMuseumSnapshot,
} from "@/lib/museum/onchain/museum";
import { readRegistrySnapshot } from "@/lib/museum/onchain/registry";

// Reads Sepolia and 6529 IPFS. Opt in with ONCHAIN_MUSEUM_LIVE=1 once the
// registry address is set; ordinary runs make no network requests.
const live = process.env["ONCHAIN_MUSEUM_LIVE"] === "1" ? it : it.skip;
// Reads a local copy of the whole release (`records.json` and `payloads/`)
// and 6529 IPFS for its texts and file index. Opt in with the directory in
// ONCHAIN_MUSEUM_RELEASE_DIR.
const releaseDir = process.env["ONCHAIN_MUSEUM_RELEASE_DIR"];
const withRelease = releaseDir === undefined ? it.skip : it;

function summary(museum: OnchainMuseumSnapshot) {
  const byFamily = new Map<string, number>();
  for (const record of museum.records) {
    if (record.state !== "verified") continue;
    const key = `${familyOf(record)}.${record.profile?.kind ?? ""}`;
    byFamily.set(key, (byFamily.get(key) ?? 0) + 1);
  }
  return {
    counts: museum.counts,
    declaration: museum.declaration,
    verifiedByKind: Object.fromEntries(byFamily),
    index: museum.media.index,
    manifests: museum.media.manifests,
    images: Object.keys(museum.media.images).length,
    unverified: museum.records
      .filter((record) => record.state !== "verified")
      .map((record) => [record.label, record.state, record.check]),
  };
}

async function expectWholeRelease(museum: OnchainMuseumSnapshot) {
  process.stdout.write(`${JSON.stringify(summary(museum))}\n`);
  expect(museum.declaration.state).toBe("verified");
  expect(museum.records).toHaveLength(ONCHAIN_MUSEUM_SOURCE.expected.records);
  expect(museum.counts.verified).toBe(ONCHAIN_MUSEUM_SOURCE.expected.records);
  expect(museum.expected.matches).toBe(true);
  const texts = museum.records.filter(
    (record) => familyOf(record) === "PRV_DOCUMENT"
  );
  expect(texts).toHaveLength(186);
  expect(texts.filter((record) => record.text?.state !== "verified")).toEqual(
    []
  );
  expect(texts.filter((record) => documentPath(record) === null)).toEqual([]);
  expect(museum.media.index).toMatchObject({
    state: "verified",
    fileCount: 702,
    cidMismatches: [],
  });
  expect(museum.media.manifests.map((m) => m.state)).toEqual([
    "verified",
    "verified",
    "verified",
  ]);

  // What the browser does for each image: fetch the derivative by CID and
  // compare its SHA-256 with the value anchored through the chain.
  const fetchCid = createCidFetcher();
  const derivatives = Object.values(museum.media.images).flatMap(
    (image) => image.derivatives
  );
  let matched = 0;
  for (const derivative of derivatives) {
    const cid = cidFromText(derivative.cid);
    const fetched =
      cid === null
        ? null
        : await fetchCid(
            cid,
            (bytes) => sha256(bytes).slice(2) === derivative.sha256
          );
    if (fetched?.accepted) matched += 1;
  }
  expect(matched).toBe(derivatives.length);
}

describe("on-chain Museum, whole release", () => {
  live(
    "verifies every live record and text by its on-chain digest",
    async () => {
      const startedAt = Date.now();
      const registry = await readRegistrySnapshot();
      expect(registry.checks).toMatchObject({
        codeHashMatches: true,
        supportsRegistryInterface: true,
        erc165Conforms: true,
        ownerMatches: true,
      });
      await expectWholeRelease(
        await buildOnchainMuseum(registry, createCidFetcher(), startedAt)
      );
    },
    300_000
  );

  withRelease(
    "verifies every payload of a local copy of the release",
    async () => {
      const root = releaseDir ?? "";
      const fixture = JSON.parse(
        await readFile(path.join(root, "records.json"), "utf8")
      ) as ProfileFixture;
      const payloads = new Map<string, Uint8Array>();
      for (const record of fixture.records) {
        payloads.set(
          record.rawCid.toLowerCase(),
          new Uint8Array(
            await readFile(
              path.join(root, "payloads", `${record.local_id}.json`)
            )
          )
        );
      }
      await expectWholeRelease(
        await buildOnchainMuseum(
          fixtureRegistrySnapshot(fixture),
          fixtureCidFetcher(payloads, createCidFetcher()),
          Date.now(),
          "fixture"
        )
      );
    },
    300_000
  );
});
