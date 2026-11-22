/**
 * @jest-environment node
 */
import { hexToBytes, keccak256, sha256, toBytes, type Hex } from "viem";
import vectors from "@/__tests__/fixtures/provenance-museum-vectors.json";
import { rawCidFromSha256 } from "@/lib/museum/onchain/cid";
import { canonicalizeJsonBytes } from "@/lib/museum/onchain/jcs";
import type { CidFetcher } from "@/lib/museum/onchain/ipfs";
import { buildOnchainMuseum } from "@/lib/museum/onchain/museum";
import type {
  RegistrySnapshot,
  RegistrySubject,
  RegistryVersion,
} from "@/lib/museum/onchain/registry";

const JCS_ID = keccak256(toBytes("RFC8785_JCS"));
const LF_ID = keccak256(toBytes("LF_NORMALIZED"));
const ENTITY_TYPE = keccak256(toBytes("PUBLIC_ENTITY"));
const DOCUMENT_TYPE = keccak256(toBytes("PUBLIC_DOCUMENT"));
const SCHEMA = keccak256(toBytes("PUBLIC_ENTITY_V1"));
const PUBLISHER = "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";

const DOC_PATH = "docs/example.md";
const DOC_TEXT = "# Example\n\nA text.\n";
const DOC_BYTES = new TextEncoder().encode(DOC_TEXT);

const CATALOG_PAYLOAD = {
  catalog_id: "6529NM-PUBCAT-test",
  created_at: "2026-08-23T15:12:19.650Z",
  assembly_documents: [{ path: DOC_PATH, sha256: "sha256:unused" }],
};
const CATALOG_BYTES = canonicalizeJsonBytes(CATALOG_PAYLOAD);
const CATALOG_CID = rawCidFromSha256(sha256(CATALOG_BYTES));

function version(
  overrides: Partial<RegistryVersion> &
    Pick<RegistryVersion, "contentHash" | "cid">
): RegistryVersion {
  return {
    version: 1,
    sequence: 1,
    releaseId: 1,
    schemaId: SCHEMA,
    effectiveAt: 1785652200,
    publishedAt: 1795353444,
    publisher: PUBLISHER,
    deleted: false,
    deletionId: 0,
    arweaveId: `0x${"00".repeat(32)}`,
    label: "",
    ...overrides,
  };
}

function subject(
  subjectId: Hex,
  recordType: Hex,
  value: RegistryVersion
): RegistrySubject {
  return {
    subjectId,
    recordType,
    versionCount: 1,
    liveVersionCount: value.deleted ? 0 : 1,
    deleted: value.deleted,
    deletionId: value.deletionId,
    version: value,
  };
}

const [work, relation] = vectors.records;
const docSubject = keccak256(
  toBytes(`6529networkmuseum.subject.public_document.v1:${DOC_PATH}`)
);

function snapshot(subjects: RegistrySubject[]): RegistrySnapshot {
  return {
    registry: "0xee91c45A1893fbb45ce8EeA170eF05d8d85bb850",
    blockNumber: 1,
    blockTimestamp: 1,
    checks: {
      chainId: 11155111,
      codeHash: null,
      codeHashMatches: true,
      supportsRegistryInterface: true,
      erc165Conforms: true,
      owner: PUBLISHER,
      ownerMatches: true,
      frozen: false,
      successor: "0x0000000000000000000000000000000000000000",
    },
    releases: [
      {
        releaseId: 1,
        isSealed: true,
        openedAt: 1,
        sealedAt: 2,
        firstSequence: 1,
        recordCount: subjects.length,
        openedBy: PUBLISHER,
        manifestCid: CATALOG_CID,
        manifestHash: {
          algorithm: 1,
          digest: keccak256(CATALOG_BYTES),
          canonicalizationId: JCS_ID,
        },
        rootCid: "0x",
        sourceCommit: "0x92966f2836ebf2af06edfe0fe2cff25041307c92",
        label: "test",
      },
    ],
    recordTypes: {
      [ENTITY_TYPE]: "PUBLIC_ENTITY",
      [DOCUMENT_TYPE]: "PUBLIC_DOCUMENT",
    },
    canonicalizations: { [JCS_ID]: "RFC8785_JCS", [LF_ID]: "LF_NORMALIZED" },
    schemas: {},
    deletions: [],
    subjects,
    rpc: { httpRequests: 0, ethCalls: 0 },
  };
}

function fetcherFor(store: Record<string, Uint8Array>): CidFetcher {
  return async (cid, accept) => {
    const bytes = store[cid.toLowerCase()];
    if (bytes === undefined) return null;
    return { bytes, host: "media.6529.io", accepted: accept?.(bytes) ?? true };
  };
}

describe("buildOnchainMuseum", () => {
  const workBytes = hexToBytes(work!.payloadJcs as Hex);
  const workVersion = version({
    contentHash: {
      algorithm: 1,
      digest: work!.keccak256 as Hex,
      canonicalizationId: JCS_ID,
    },
    cid: work!.cid as Hex,
  });
  const docVersion = version({
    releaseId: 2,
    contentHash: {
      algorithm: 2,
      digest: sha256(DOC_BYTES),
      canonicalizationId: LF_ID,
    },
    cid: rawCidFromSha256(sha256(DOC_BYTES)),
    label: "Example",
  });
  const relationVersion = version({
    contentHash: {
      algorithm: 1,
      digest: relation!.keccak256 as Hex,
      canonicalizationId: JCS_ID,
    },
    cid: relation!.cid as Hex,
  });

  it("attaches content only to records whose bytes match the chain", async () => {
    const tampered = new TextEncoder().encode(
      new TextDecoder()
        .decode(hexToBytes(relation!.payloadJcs as Hex))
        .replace("asserted", "rejected!")
    );
    const museum = await buildOnchainMuseum(
      snapshot([
        subject(work!.subjectId as Hex, ENTITY_TYPE, workVersion),
        subject(docSubject, DOCUMENT_TYPE, docVersion),
        subject(relation!.subjectId as Hex, ENTITY_TYPE, relationVersion),
        subject(
          keccak256(toBytes("missing")),
          ENTITY_TYPE,
          version({
            contentHash: {
              algorithm: 1,
              digest: keccak256(toBytes("x")),
              canonicalizationId: JCS_ID,
            },
            cid: rawCidFromSha256(sha256(toBytes("x"))),
          })
        ),
        subject(
          keccak256(toBytes("deleted")),
          ENTITY_TYPE,
          version({
            deleted: true,
            deletionId: 1,
            contentHash: {
              algorithm: 1,
              digest: keccak256(toBytes("y")),
              canonicalizationId: JCS_ID,
            },
            cid: "0x",
          })
        ),
      ]),
      fetcherFor({
        [CATALOG_CID.toLowerCase()]: CATALOG_BYTES,
        [(work!.cid as string).toLowerCase()]: workBytes,
        [docVersion.cid.toLowerCase()]: DOC_BYTES,
        [(relation!.cid as string).toLowerCase()]: tampered,
      })
    );

    expect(museum.catalog).toMatchObject({
      state: "verified",
      catalogId: "6529NM-PUBCAT-test",
      releaseIds: [1],
    });
    expect(museum.counts).toEqual({
      verified: 2,
      mismatch: 1,
      unavailable: 1,
      unsupported: 0,
      deleted: 1,
    });
    const [entity, document, mismatch, missing, deleted] = museum.records;
    expect(entity).toMatchObject({
      state: "verified",
      recordType: "PUBLIC_ENTITY",
      label: "Vera Molnár and Martin Grasser, Themes and Variations #210",
      cidText: work!.cidText,
      servedBy: "media.6529.io",
    });
    expect(entity!.content?.kind).toBe("json");
    expect(document).toMatchObject({
      state: "verified",
      documentPath: DOC_PATH,
      content: { kind: "markdown", text: DOC_TEXT },
      label: "Example",
    });
    expect(mismatch).toMatchObject({ state: "mismatch", content: null });
    expect(missing).toMatchObject({ state: "unavailable", content: null });
    expect(deleted).toMatchObject({ state: "deleted", content: null });
  });

  it("does not trust a catalog whose bytes miss the manifest hash", async () => {
    const museum = await buildOnchainMuseum(
      snapshot([subject(docSubject, DOCUMENT_TYPE, docVersion)]),
      fetcherFor({
        [CATALOG_CID.toLowerCase()]: canonicalizeJsonBytes({
          catalog_id: "forged",
        }),
        [docVersion.cid.toLowerCase()]: DOC_BYTES,
      })
    );
    expect(museum.catalog).toMatchObject({
      state: "mismatch",
      catalogId: null,
    });
    expect(museum.records[0]).toMatchObject({
      state: "verified",
      documentPath: null,
    });
  });
});
