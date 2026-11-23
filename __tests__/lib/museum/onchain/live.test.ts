/**
 * @jest-environment node
 */
import { sha256 } from "viem";
import { cidFromText } from "@/lib/museum/onchain/cid";
import { createCidFetcher } from "@/lib/museum/onchain/ipfs";
import { buildOnchainMuseum } from "@/lib/museum/onchain/museum";
import { readRegistrySnapshot } from "@/lib/museum/onchain/registry";

// Reads Sepolia and 6529 IPFS. Opt in with ONCHAIN_MUSEUM_LIVE=1; ordinary
// runs make no network requests.
const live = process.env["ONCHAIN_MUSEUM_LIVE"] === "1" ? it : it.skip;

describe("on-chain Museum against Sepolia", () => {
  live(
    "verifies every live record and text by its on-chain digest",
    async () => {
      const startedAt = Date.now();
      const registry = await readRegistrySnapshot();
      const chainMs = Date.now() - startedAt;
      const museum = await buildOnchainMuseum(
        registry,
        createCidFetcher(),
        startedAt
      );
      const byType = new Map<string, number>();
      for (const record of museum.records) {
        if (record.state !== "verified") continue;
        const key = record.recordType ?? "unknown";
        byType.set(key, (byType.get(key) ?? 0) + 1);
      }
      process.stdout.write(
        `${JSON.stringify({
          block: registry.blockNumber,
          rpc: registry.rpc,
          chainMs,
          totalMs: museum.loadMs,
          catalog: museum.catalog,
          counts: museum.counts,
          verifiedByType: Object.fromEntries(byType),
          servedBy: [...new Set(museum.records.map((r) => r.servedBy))],
          index: {
            ...museum.media.index,
            catalogMismatches: museum.media.index.catalogMismatches.length,
          },
          manifests: museum.media.manifests,
          images: Object.keys(museum.media.images).length,
        })}\n`
      );
      expect(registry.checks).toMatchObject({
        codeHashMatches: true,
        supportsRegistryInterface: true,
        erc165Conforms: true,
        ownerMatches: true,
      });
      expect(museum.catalog.state).toBe("verified");
      expect(museum.catalog.releaseIds).toEqual([1, 2, 3]);
      expect(museum.records).toHaveLength(588);
      expect(museum.counts.verified).toBe(588);
      expect(byType.get("PUBLIC_DOCUMENT")).toBe(186);
      expect(
        museum.records.filter(
          (r) => r.recordType === "PUBLIC_DOCUMENT" && r.documentPath === null
        )
      ).toHaveLength(0);
      expect(museum.media.index).toMatchObject({
        state: "verified",
        releaseId: 3,
        fileCount: 702,
        catalogMatches: 702,
        catalogMismatches: [],
        cidMismatches: [],
      });
      expect(museum.media.manifests.map((m) => m.state)).toEqual([
        "verified",
        "verified",
        "verified",
      ]);

      // What the browser does for each image: fetch the derivative by CID
      // and compare its SHA-256 with the value anchored through the chain.
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
      process.stdout.write(
        `${JSON.stringify({ derivatives: derivatives.length, matched })}
`
      );
      expect(matched).toBe(derivatives.length);
    },
    300_000
  );
});
