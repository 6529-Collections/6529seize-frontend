/**
 * @jest-environment node
 */
import { hexToBytes, keccak256, sha256, toBytes, type Hex } from "viem";
import vectors from "@/__tests__/fixtures/provenance-museum-vectors.json";
import {
  cidToText,
  rawCidFromSha256,
  sha256FromRawCid,
} from "@/lib/museum/onchain/cid";
import {
  LF_NORMALIZED_LITERAL,
  RFC8785_JCS_LITERAL,
} from "@/lib/museum/onchain/constants";
import { canonicalizeJson, JcsError } from "@/lib/museum/onchain/jcs";
import {
  checkRawCid,
  normalizeLineEndings,
  verifyOnchainContent,
} from "@/lib/museum/onchain/verify";

const JCS_ID = vectors.canonicalization.id as Hex;
const decoder = new TextDecoder();

describe("RFC 8785 canonicalization", () => {
  it("sorts members by UTF-16 code units and drops whitespace", () => {
    // U+FB33 sorts after U+1F600 by UTF-16 code units, though not by code point.
    expect(
      canonicalizeJson({
        דּ: 3,
        b: [1, { z: null, a: true }],
        a: "x",
        "\u{1f600}": 2,
        "€": 1,
      })
    ).toBe('{"a":"x","b":[1,{"a":true,"z":null}],"€":1,"\u{1f600}":2,"דּ":3}');
  });

  it("serializes numbers with the ECMAScript algorithm", () => {
    expect(
      canonicalizeJson([-0, 1e21, 1e-7, 0.1, 333333333.3333333, 100])
    ).toBe("[0,1e+21,1e-7,0.1,333333333.3333333,100]");
  });

  it("escapes strings as RFC 8785 requires", () => {
    expect(canonicalizeJson('\u0000\b\t\n\f\r"\\/\u001fé')).toBe(
      '"\\u0000\\b\\t\\n\\f\\r\\"\\\\/\\u001fé"'
    );
  });

  it("rejects values outside I-JSON", () => {
    expect(() => canonicalizeJson(Number.NaN)).toThrow(JcsError);
    expect(() => canonicalizeJson("\ud800")).toThrow(JcsError);
    expect(() => canonicalizeJson({ value: undefined })).toThrow(JcsError);
  });

  it.each(vectors.records)(
    "reproduces the canonical bytes of $path",
    (record) => {
      const bytes = hexToBytes(record.payloadJcs as Hex);
      const text = decoder.decode(bytes);
      expect(canonicalizeJson(JSON.parse(text))).toBe(text);
      expect(keccak256(bytes)).toBe(record.keccak256);
      expect(sha256(bytes)).toBe(record.sha256);
      expect(keccak256(toBytes(record.subjectPreimage))).toBe(record.subjectId);
    }
  );
});

describe("raw CIDs", () => {
  it.each(vectors.records)("builds and prints the CID of $path", (record) => {
    expect(rawCidFromSha256(record.sha256 as Hex)).toBe(record.cid);
    expect(sha256FromRawCid(record.cid as Hex)).toBe(record.sha256);
    expect(cidToText(record.cid as Hex)).toBe(record.cidText);
  });

  it("does not read a digest from another CID form", () => {
    expect(
      sha256FromRawCid(("0x01701220" + "00".repeat(32)) as Hex)
    ).toBeNull();
    expect(checkRawCid("0x", new Uint8Array())).toBeNull();
  });
});

describe("verifyOnchainContent", () => {
  it.each(vectors.records)("verifies the JSON record $path", (record) => {
    const expectation = {
      contentHash: {
        algorithm: 1,
        digest: record.keccak256 as Hex,
        canonicalizationId: JCS_ID,
      },
      canonicalizationLiteral: RFC8785_JCS_LITERAL,
      cid: record.cid as Hex,
    };
    const bytes = hexToBytes(record.payloadJcs as Hex);
    expect(verifyOnchainContent(expectation, { kind: "bytes", bytes })).toEqual(
      {
        status: "verified",
        computedDigest: record.keccak256,
        cidMatches: true,
      }
    );
    const value: unknown = JSON.parse(decoder.decode(bytes));
    expect(
      verifyOnchainContent(expectation, { kind: "json", value }).status
    ).toBe("verified");
  });

  it("refuses bytes that are not canonical, even when they parse", () => {
    const [record] = vectors.records;
    const value: unknown = JSON.parse(
      decoder.decode(hexToBytes(record!.payloadJcs as Hex))
    );
    const pretty = new TextEncoder().encode(JSON.stringify(value, null, 2));
    expect(
      verifyOnchainContent(
        {
          contentHash: {
            algorithm: 1,
            digest: record!.keccak256 as Hex,
            canonicalizationId: JCS_ID,
          },
          canonicalizationLiteral: RFC8785_JCS_LITERAL,
          cid: record!.cid as Hex,
        },
        { kind: "bytes", bytes: pretty }
      ).status
    ).toBe("not_canonical");
  });

  it("reports a digest mismatch for altered content", () => {
    const [record] = vectors.records;
    const value = JSON.parse(
      decoder.decode(hexToBytes(record!.payloadJcs as Hex))
    ) as Record<string, unknown>;
    const result = verifyOnchainContent(
      {
        contentHash: {
          algorithm: 1,
          digest: record!.keccak256 as Hex,
          canonicalizationId: JCS_ID,
        },
        canonicalizationLiteral: RFC8785_JCS_LITERAL,
        cid: record!.cid as Hex,
      },
      { kind: "json", value: { ...value, preferred_label: "altered" } }
    );
    expect(result.status).toBe("digest_mismatch");
  });

  it("reports a CID that names other bytes", () => {
    const [first, second] = vectors.records;
    const result = verifyOnchainContent(
      {
        contentHash: {
          algorithm: 1,
          digest: first!.keccak256 as Hex,
          canonicalizationId: JCS_ID,
        },
        canonicalizationLiteral: RFC8785_JCS_LITERAL,
        cid: second!.cid as Hex,
      },
      { kind: "bytes", bytes: hexToBytes(first!.payloadJcs as Hex) }
    );
    expect(result.status).toBe("cid_mismatch");
  });

  it("leaves unknown algorithms and canonicalizations unverified", () => {
    const [record] = vectors.records;
    const bytes = hexToBytes(record!.payloadJcs as Hex);
    const base = {
      contentHash: {
        algorithm: 9,
        digest: record!.keccak256 as Hex,
        canonicalizationId: JCS_ID,
      },
      canonicalizationLiteral: RFC8785_JCS_LITERAL,
      cid: record!.cid as Hex,
    };
    expect(verifyOnchainContent(base, { kind: "bytes", bytes }).status).toBe(
      "unsupported"
    );
    expect(
      verifyOnchainContent(
        { ...base, canonicalizationLiteral: "SOMETHING_ELSE" },
        { kind: "bytes", bytes }
      ).status
    ).toBe("unsupported");
  });

  // Live values read from the Sepolia registry for release 2, subject
  // keccak256("6529networkmuseum.subject.public_document.v1:" + path).
  const ALT_TEXT_PATH = "records/accessions/6529NM.2026.003/public/alt-text.md";
  const ALT_TEXT =
    "# Alt text\n\nA square generative composition in dark cobalt blue and warm white. Large blue fields occupy the upper right and lower left. White T forms descend through the lower-left field, with a small white F at the left edge. The lower-right area combines a thin horizontal rule, vertical lines, an offset blue block, and a dense rectangular pattern.\n";
  const ALT_TEXT_VERSION = {
    subjectId:
      "0x5fb51657d569d5232b7910e267c657a471df3c0096e09d5e0af11a440ccd2413",
    digest:
      "0xc9d0efeb488dacda5cf329a29572eb431c42c783b5a8deaceb6cace27dc971a7",
    canonicalizationId:
      "0x78d3fc0ef77973a73f8c0b628207c25e6973a7df9569e451e10338a4ce25602e",
    cid: "0x01551220c9d0efeb488dacda5cf329a29572eb431c42c783b5a8deaceb6cace27dc971a7",
  } as const;

  it("verifies a live release 2 text by SHA-256 of its LF bytes", () => {
    expect(
      keccak256(
        toBytes(`6529networkmuseum.subject.public_document.v1:${ALT_TEXT_PATH}`)
      )
    ).toBe(ALT_TEXT_VERSION.subjectId);
    expect(keccak256(toBytes(LF_NORMALIZED_LITERAL))).toBe(
      ALT_TEXT_VERSION.canonicalizationId
    );
    const expectation = {
      contentHash: {
        algorithm: 2,
        digest: ALT_TEXT_VERSION.digest,
        canonicalizationId: ALT_TEXT_VERSION.canonicalizationId,
      },
      canonicalizationLiteral: LF_NORMALIZED_LITERAL,
      cid: ALT_TEXT_VERSION.cid,
    };
    expect(
      verifyOnchainContent(expectation, {
        kind: "bytes",
        bytes: new TextEncoder().encode(ALT_TEXT),
      })
    ).toEqual({
      status: "verified",
      computedDigest: ALT_TEXT_VERSION.digest,
      cidMatches: true,
    });
    // Text input is normalized; served bytes with CR are not the record.
    const crlf = ALT_TEXT.replaceAll("\n", "\r\n");
    expect(
      verifyOnchainContent(expectation, { kind: "text", text: crlf }).status
    ).toBe("verified");
    expect(
      verifyOnchainContent(expectation, {
        kind: "bytes",
        bytes: new TextEncoder().encode(crlf),
      }).status
    ).toBe("not_canonical");
  });

  it("normalizes CRLF and lone CR to LF", () => {
    expect(normalizeLineEndings("a\r\nb\rc\n")).toBe("a\nb\nc\n");
  });

  it("checks the live JCS canonicalization ID", () => {
    expect(keccak256(toBytes(RFC8785_JCS_LITERAL))).toBe(JCS_ID);
  });
});
