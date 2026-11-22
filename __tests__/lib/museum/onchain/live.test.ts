/**
 * @jest-environment node
 */
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
        })}\n`
      );
      expect(registry.checks).toMatchObject({
        codeHashMatches: true,
        supportsRegistryInterface: true,
        erc165Conforms: true,
        ownerMatches: true,
      });
      expect(museum.catalog.state).toBe("verified");
      expect(museum.catalog.releaseIds).toEqual([1, 2]);
      expect(museum.records).toHaveLength(588);
      expect(museum.counts.verified).toBe(588);
      expect(byType.get("PUBLIC_DOCUMENT")).toBe(186);
      expect(
        museum.records.filter(
          (r) => r.recordType === "PUBLIC_DOCUMENT" && r.documentPath === null
        )
      ).toHaveLength(0);
    },
    180_000
  );
});
