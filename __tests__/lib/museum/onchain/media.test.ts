/**
 * @jest-environment node
 */
import { keccak256, sha256, toBytes, type Hex } from "viem";
import vectors from "@/__tests__/fixtures/provenance-museum-vectors.json";
import {
  cidFromText,
  cidToText,
  rawCidFromSha256,
} from "@/lib/museum/onchain/cid";
import type { CidFetcher } from "@/lib/museum/onchain/ipfs";
import { canonicalizeJsonBytes } from "@/lib/museum/onchain/jcs";
import { loadOnchainMedia } from "@/lib/museum/onchain/media";
import type { RegistryRelease } from "@/lib/museum/onchain/registry";

const encoder = new TextEncoder();
const hex = (value: Hex) => value.slice(2);

function file(bytes: Uint8Array) {
  const digest = sha256(bytes);
  return { bytes, digest: hex(digest), cid: rawCidFromSha256(digest) };
}

const image640 = file(encoder.encode("webp-640"));
const image1280 = file(encoder.encode("webp-1280-bytes"));
const imagePath = (width: number) =>
  `media/accessions/6529NM.2026.003/6529NM-W-0029/abc/webp-v2-q82-m6-fixed-icc/${width}.webp`;
const manifestPath =
  "records/accessions/6529NM.2026.003/public/presentation-manifest.json";
const manifest = file(
  encoder.encode(
    JSON.stringify({
      record_type: "ACCESSION_MEDIA_PRESENTATION",
      delivery: { status: "approved_for_contextual_museum_display" },
      rights_boundary: {
        status: "CC BY-NC 4.0",
        no_general_reuse: "No permission is asserted beyond CC BY-NC 4.0.",
      },
      items: [
        {
          work_entity_id: "6529NM-W-0029",
          media_reference_entity_id: "6529NM-MED-0052",
          presentation: {
            alt_text: "A square generative composition.",
            derivatives: [
              {
                width: 1280,
                height: 1280,
                mime_type: "image/webp",
                sha256: `sha256:${image1280.digest}`,
                repository_path: imagePath(1280),
              },
              {
                width: 640,
                height: 640,
                mime_type: "image/webp",
                sha256: `sha256:${image640.digest}`,
                repository_path: imagePath(640),
              },
              {
                width: 2400,
                height: 2400,
                mime_type: "image/webp",
                sha256: `sha256:${"0".repeat(64)}`,
                repository_path: imagePath(2400),
              },
            ],
          },
        },
      ],
    })
  )
);

const CATALOG_ID = "6529NM-PUBCAT-test";
function indexOf(
  files: Record<string, { sha256: string; bytes: number; cid: string }>
) {
  const bytes = canonicalizeJsonBytes({
    kind: "6529-provenance file index v1",
    catalog: CATALOG_ID,
    files,
  });
  return file(bytes);
}

const goodIndex = indexOf({
  [manifestPath]: {
    sha256: manifest.digest,
    bytes: manifest.bytes.length,
    cid: cidToText(manifest.cid),
  },
  [imagePath(640)]: {
    sha256: image640.digest,
    bytes: image640.bytes.length,
    cid: cidToText(image640.cid),
  },
  [imagePath(1280)]: {
    sha256: image1280.digest,
    bytes: image1280.bytes.length,
    cid: cidToText(image1280.cid),
  },
});

function release(id: number, rootCid: Hex): RegistryRelease {
  return {
    releaseId: id,
    isSealed: true,
    openedAt: 1,
    sealedAt: 2,
    firstSequence: 1,
    recordCount: 0,
    openedBy: "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68",
    manifestCid: "0x",
    manifestHash: {
      algorithm: 1,
      digest: keccak256(toBytes("catalog")),
      canonicalizationId: keccak256(toBytes("RFC8785_JCS")),
    },
    rootCid,
    sourceCommit: "0x92966f2836ebf2af06edfe0fe2cff25041307c92",
    label: "",
  };
}

function fetcher(store: Record<string, Uint8Array>): CidFetcher {
  return async (cid, accept) => {
    const bytes = store[cid.toLowerCase()];
    if (bytes === undefined) return null;
    return { bytes, host: "media.6529.io", accepted: accept?.(bytes) ?? true };
  };
}

describe("cidFromText", () => {
  it.each(vectors.records)("reads the CID text of $path", (record) => {
    expect(cidFromText(record.cidText)).toBe(record.cid);
  });

  it("refuses text that is not multibase base32", () => {
    expect(cidFromText("Qm123")).toBeNull();
    expect(cidFromText("b0")).toBeNull();
  });
});

describe("loadOnchainMedia", () => {
  it("verifies the index against its CID and reads the manifest", async () => {
    const media = await loadOnchainMedia(
      [release(1, "0x"), release(3, goodIndex.cid)],
      fetcher({
        [goodIndex.cid.toLowerCase()]: goodIndex.bytes,
        [manifest.cid.toLowerCase()]: manifest.bytes,
      })
    );
    expect(media.index).toMatchObject({
      state: "verified",
      releaseId: 3,
      fileCount: 3,
      cidMismatches: [],
    });
    expect(media.manifests).toEqual([
      { path: manifestPath, state: "verified", items: 1 },
    ]);
    const image = media.images["6529NM-W-0029"];
    expect(image).toMatchObject({
      mediaEntityId: "6529NM-MED-0052",
      altText: "A square generative composition.",
      rightsStatus: "CC BY-NC 4.0",
      rightsTerms: ["No permission is asserted beyond CC BY-NC 4.0."],
    });
    // The 2400 px derivative is not in the index, so it is left out; the
    // others are sorted by width and carry the index's CID and hash.
    expect(image?.derivatives).toEqual([
      {
        width: 640,
        height: 640,
        cid: cidToText(image640.cid),
        sha256: image640.digest,
        byteSize: image640.bytes.length,
      },
      {
        width: 1280,
        height: 1280,
        cid: cidToText(image1280.cid),
        sha256: image1280.digest,
        byteSize: image1280.bytes.length,
      },
    ]);
  });

  it("refuses an index whose bytes do not match its CID", async () => {
    const media = await loadOnchainMedia(
      [release(3, goodIndex.cid)],
      fetcher({ [goodIndex.cid.toLowerCase()]: encoder.encode("{}") })
    );
    expect(media.index.state).toBe("mismatch");
    expect(media.images).toEqual({});
  });

  it("drops index entries whose raw CID names other bytes", async () => {
    const forged = indexOf({
      [manifestPath]: {
        sha256: manifest.digest,
        bytes: manifest.bytes.length,
        cid: cidToText(manifest.cid),
      },
      [imagePath(640)]: {
        sha256: "f".repeat(64),
        bytes: image640.bytes.length,
        cid: cidToText(rawCidFromSha256(`0x${"f".repeat(64)}`)),
      },
      [imagePath(1280)]: {
        sha256: image1280.digest,
        bytes: image1280.bytes.length,
        cid: cidToText(image640.cid),
      },
    });
    const media = await loadOnchainMedia(
      [release(3, forged.cid)],
      fetcher({
        [forged.cid.toLowerCase()]: forged.bytes,
        [manifest.cid.toLowerCase()]: manifest.bytes,
      })
    );
    expect(media.index.cidMismatches).toEqual([imagePath(1280)]);
    // The manifest still verifies, but no derivative survives: the 640 px
    // entry names a SHA-256 the manifest does not, the 1280 px one is dropped.
    expect(media.images).toEqual({});
  });

  it("refuses an index that is not in RFC 8785 form", async () => {
    const pretty = file(
      encoder.encode(
        JSON.stringify(
          JSON.parse(new TextDecoder().decode(goodIndex.bytes)),
          null,
          2
        )
      )
    );
    const media = await loadOnchainMedia(
      [release(3, pretty.cid)],
      fetcher({ [pretty.cid.toLowerCase()]: pretty.bytes })
    );
    expect(media.index.state).toBe("mismatch");
  });

  it("reports no index when no release names one", async () => {
    const media = await loadOnchainMedia([release(1, "0x")], fetcher({}));
    expect(media.index.state).toBe("absent");
  });
});
