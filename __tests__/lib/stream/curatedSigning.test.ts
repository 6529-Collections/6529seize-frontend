import { hashTypedData, keccak256, toHex } from "viem";

import { acceptanceTypedData, moveTypedData } from "@/lib/stream/curatedSigning";

// r9's PackageRegistry (6529-works deployments/11155111/core-1795840548.json). The expected
// digests were read from its acceptanceDigest and moveDigest views on Sepolia for these inputs.
const REGISTRY = "0x192e6D3fDb17Da0E8B7e0b473d6A7DEBEe1f63e6";
const ROOT = keccak256(toHex("frontend digest check root"));
const ITEM = keccak256(toHex("frontend digest check item"));

describe("curated signing typed data", () => {
  it("matches PackageRegistry.acceptanceDigest", () => {
    const digest = hashTypedData(
      acceptanceTypedData(REGISTRY, ROOT, {
        account: "0x1e6078F7d688591823f77B0c1104D66aE1A442B5",
        profileId: keccak256(toHex("profile id")),
        profileDocHash: keccak256(toHex("profile doc")),
        deadline: 1_900_000_000n,
      })
    );
    expect(digest).toBe("0x09c849e8b239efe0dbe783881fb591aa188250b35e080e67bc4c5c247b83b537");
  });

  it("matches PackageRegistry.moveDigest", () => {
    const digest = hashTypedData(
      moveTypedData(REGISTRY, { packageRoot: ROOT, itemHash: ITEM, nonce: 7n, deadline: 1_900_000_000n })
    );
    expect(digest).toBe("0x57b0ac48b230deb4bf313a465a92cdcb58bd225270f0582c8eb60d51ab29c437");
  });
});
