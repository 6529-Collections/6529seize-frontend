jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import {
  parseSolidityDeclarationSearchQuery,
  searchSolidityDeclarations,
} from "@/lib/public-review/solidityDeclarationSearch.server";
import type { SolidityReferenceManifest } from "@/lib/public-review/solidityReferenceTypes";

const MANIFEST = {
  declarationIndex: [
    {
      canonicalSignature: "mint(address,uint256)",
      definitionId: "src/StreamCore.sol:StreamCore",
      definitionKey: "stream-core",
      displaySignature: "mint(address to, uint256 tokenId)",
      id: "src/StreamCore.sol:StreamCore#function:0x40c10f19",
      key: "mint",
      kind: "function",
      name: "mint",
      scope: "protocol",
      selector: "0x40c10f19",
      sourcePath: "src/StreamCore.sol",
      syntheticGetter: false,
      topLevel: false,
      topic0: null,
    },
    {
      canonicalSignature: "Minted(address,uint256)",
      definitionId: "src/StreamCore.sol:StreamCore",
      definitionKey: "stream-core",
      displaySignature: "Minted(address to, uint256 tokenId)",
      id: "src/StreamCore.sol:StreamCore#event:minted",
      key: "minted",
      kind: "event",
      name: "Minted",
      scope: "protocol",
      selector: null,
      sourcePath: "src/StreamCore.sol",
      syntheticGetter: false,
      topLevel: false,
      topic0: `0x${"1".repeat(64)}`,
    },
    {
      canonicalSignature: "InvalidProof(bytes32)",
      definitionId: null,
      definitionKey: null,
      displaySignature: "InvalidProof(bytes32 proof)",
      id: "src/Proofs.sol#error:invalid-proof",
      key: "invalid-proof",
      kind: "error",
      name: "InvalidProof",
      scope: "support",
      selector: "0x09bde339",
      sourcePath: "src/Proofs.sol",
      syntheticGetter: false,
      topLevel: true,
      topic0: null,
    },
  ],
  definitionIndex: [
    {
      id: "src/StreamCore.sol:StreamCore",
      name: "StreamCore",
    },
  ],
  reviewId: "6529-stream",
  reviewVersion: "2026-07-26.1",
  source: {
    commit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
  },
} as unknown as SolidityReferenceManifest;

describe("Solidity declaration server search", () => {
  it("strictly parses bounded query and pagination parameters", () => {
    const parsed = parseSolidityDeclarationSearchQuery(
      new URLSearchParams({
        kind: "function",
        limit: "50",
        location: "definition",
        offset: "100",
        q: "  mint  ",
        scope: "protocol",
      })
    );

    expect(parsed).toEqual({
      kind: "function",
      limit: 50,
      location: "definition",
      offset: 100,
      query: "mint",
      scope: "protocol",
    });
    expect(() =>
      parseSolidityDeclarationSearchQuery(new URLSearchParams({ limit: "101" }))
    ).toThrow("out of range");
    expect(() =>
      parseSolidityDeclarationSearchQuery(
        new URLSearchParams({ offset: "1.5" })
      )
    ).toThrow("Invalid declaration pagination parameter");
    expect(() =>
      parseSolidityDeclarationSearchQuery(
        new URLSearchParams({ kind: "modifier" })
      )
    ).toThrow("Invalid declaration kind");
    expect(() =>
      parseSolidityDeclarationSearchQuery(
        new URLSearchParams({ q: "x".repeat(201) })
      )
    ).toThrow("too long");
  });

  it("filters the full manifest before applying a bounded page", () => {
    const page = searchSolidityDeclarations({
      hrefContext: {
        reviewSlug: "6529-stream",
        version: "2026-07-26.1",
      },
      manifest: MANIFEST,
      query: {
        kind: "",
        limit: 1,
        location: "definition",
        offset: 0,
        query: "streamcore",
        scope: "protocol",
      },
    });

    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(1);
    expect(page.nextOffset).toBe(1);
    expect(page.items[0]).toMatchObject({
      definitionName: "StreamCore",
      href: expect.stringContaining(
        "/versions/2026-07-26.1/reference/definitions/"
      ),
      signature: "mint(address,uint256)",
    });
    expect(page).toMatchObject({
      reviewId: "6529-stream",
      sourceCommit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
      version: "2026-07-26.1",
    });
  });

  it("finds file-scope declarations by selector", () => {
    const page = searchSolidityDeclarations({
      hrefContext: { reviewSlug: "6529-stream" },
      manifest: MANIFEST,
      query: {
        kind: "error",
        limit: 100,
        location: "file-scope",
        offset: 0,
        query: "09bde339",
        scope: "",
      },
    });

    expect(page.total).toBe(1);
    expect(page.nextOffset).toBeNull();
    expect(page.items[0]).toMatchObject({
      href: "/reviews/6529-stream/reference/declarations/invalid-proof",
      name: "InvalidProof",
      topLevel: true,
    });
  });
});
