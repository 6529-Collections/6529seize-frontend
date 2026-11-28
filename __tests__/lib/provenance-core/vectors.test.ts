/**
 * @jest-environment node
 */
// Runs the shared vectors of @6529-collections/provenance-core against the copy in
// lib/provenance-core/, the same files the package and the 6529-client Rust core check. The
// profile's own integer vectors (profile/vectors/integers.json) are not copied here; the package's
// tests run them.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  bytesToHex,
  hexToBytes,
  keccak256,
  sha256,
  type Address,
  type Hex,
} from "viem";
import {
  decodeAction,
  encodeAction,
  type RecordInput,
} from "@/lib/provenance-core/actions";
import {
  cidProblem,
  cidToString,
  decodeCidBytes,
  rawCidV1,
  unixfsFileCidV1,
} from "@/lib/provenance-core/cid";
import type { RegistryPin } from "@/lib/provenance-core/config/registries";
import {
  checkGovernanceSafeTx,
  safeTxTypedDataJson,
} from "@/lib/provenance-core/governance";
import { jcsBytes } from "@/lib/provenance-core/jcs";
import { maxRecordsWithin } from "@/lib/provenance-core/pack";
import { readSenderCapability } from "@/lib/provenance-core/publish";
import {
  encodeMultiSendTransactions,
  safeTxHash,
  type SafeTx,
} from "@/lib/provenance-core/safe";
import { normalizeLf, verifyBytes } from "@/lib/provenance-core/verify";

const load = (name: string) =>
  JSON.parse(
    readFileSync(
      join(process.cwd(), "lib", "provenance-core", "vectors", name),
      "utf8"
    )
  );
const enc = new TextEncoder();
const dec = new TextDecoder();

type TxJson = Record<string, string | number>;
const txOf = (t: TxJson): SafeTx => ({
  to: t["to"] as Address,
  value: BigInt(t["value"]!),
  data: t["data"] as Hex,
  operation: Number(t["operation"]) as 0 | 1,
  safeTxGas: BigInt(t["safeTxGas"]!),
  baseGas: BigInt(t["baseGas"]!),
  gasPrice: BigInt(t["gasPrice"]!),
  gasToken: t["gasToken"] as Address,
  refundReceiver: t["refundReceiver"] as Address,
  nonce: BigInt(t["nonce"]!),
});

describe("vectors/jcs.json", () => {
  for (const c of load("jcs.json").cases) {
    it(c.name, () => {
      const bytes = c.inputHex ? hexToBytes(c.inputHex) : enc.encode(c.input);
      if (c.error) expect(() => jcsBytes(bytes)).toThrow();
      else expect(dec.decode(jcsBytes(bytes))).toBe(c.output);
    });
  }
});

describe("vectors/hash.json", () => {
  const cases = load("hash.json").cases;
  it("matches the published SHA-256 and Keccak-256 test values", () => {
    const abc = cases.find((c: { name: string }) => c.name === "abc");
    expect(abc.sha256).toBe(
      "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    expect(abc.keccak256).toBe(
      "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"
    );
    expect(cases[0].keccak256).toBe(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    );
  });
  for (const c of cases) {
    it(c.name, () => {
      expect(keccak256(c.bytes)).toBe(c.keccak256);
      expect(sha256(c.bytes)).toBe(c.sha256);
    });
  }
});

describe("vectors/lf.json", () => {
  for (const c of load("lf.json").cases) {
    it(c.name, () =>
      expect(bytesToHex(normalizeLf(hexToBytes(c.input)))).toBe(c.output)
    );
  }
});

describe("vectors/cid.json", () => {
  const f = load("cid.json");
  for (const c of f.cases) {
    it(c.name, () => {
      expect(bytesToHex(rawCidV1(hexToBytes(c.bytes)))).toBe(c.cid);
      expect(cidToString(c.cid)).toBe(c.text);
    });
  }
  for (const c of f.decode) {
    it(`decodes ${c.name}`, () => {
      const d = decodeCidBytes(c.cid);
      expect([
        d.version,
        d.codec,
        d.hashCode,
        bytesToHex(d.digest),
        cidToString(c.cid),
      ]).toEqual([c.version, c.codec, c.hashCode, c.digest, c.text]);
    });
  }
  for (const c of f.unixfs.cases) {
    it(`UnixFS: ${c.name}`, () => {
      const bytes = Uint8Array.from({ length: c.length }, (_, k) => k % 251);
      const cid = unixfsFileCidV1(bytes);
      expect(bytesToHex(cid)).toBe(c.cid);
      expect(cidToString(cid)).toBe(c.text);
    });
  }
  for (const c of f.invalid)
    it(`rejects ${c.name}`, () =>
      expect(() => decodeCidBytes(c.cid)).toThrow());
  for (const c of f.registry)
    it(`registry rule: ${c.name}`, () =>
      expect(cidProblem(c.cid) === undefined).toBe(c.accepted));
});

describe("vectors/verify.json", () => {
  for (const c of load("verify.json").cases) {
    it(c.name, () => {
      const r = verifyBytes(
        hexToBytes(c.fetched),
        { ...c.expected, canonicalizationLiteral: c.expected.canonicalization },
        c.options ?? {}
      );
      expect(r.verdict).toBe(c.result.verdict);
      expect(r.verified).toBe(c.result.verified);
      expect(r.form).toBe(c.result.form);
      expect(r.digestMatch).toBe(c.result.digestMatch);
      expect(r.canonicalDigestMatch).toBe(c.result.canonicalDigestMatch);
      expect(r.scope).toBe(c.result.scope);
      expect(Boolean(r.error)).toBe(c.result.error);
      expect(r.computedDigest).toBe(c.result.computedDigest);
      expect(r.canonicalDigest).toBe(c.result.canonicalDigest);
      if (!c.result.error) {
        expect(r.canonical.pointer ?? null).toBe(c.result.pointer);
        expect(r.canonical.alreadyCanonical).toBe(c.result.alreadyCanonical);
      }
      expect(r.cid.status).toBe(c.result.cid);
      expect(r.canonicalCid?.status ?? null).toBe(c.result.canonicalCid);
    });
  }
});

describe("vectors/calldata.json", () => {
  for (const c of load("calldata.json").cases) {
    it(c.name, () => {
      const decoded = decodeAction(c.calldata);
      expect(decoded.kind).toBe(c.name);
      expect(encodeAction(decoded)).toBe(c.calldata);
    });
  }
});

describe("vectors/safe.json", () => {
  const f = load("safe.json");
  for (const c of f.safeTxHash) {
    it(`SafeTx hash: ${c.name}`, () => {
      expect(safeTxHash(c.chainId, c.safe, txOf(c.tx))).toBe(c.hash);
      if (c.typedData)
        expect(
          JSON.parse(safeTxTypedDataJson(c.chainId, c.safe, txOf(c.tx)))
        ).toEqual(c.typedData);
    });
  }
  for (const c of f.multiSend) {
    it(`MultiSend: ${c.name}`, () => {
      const calls = c.calls.map((x: TxJson) => ({
        to: x["to"] as Address,
        value: BigInt(x["value"]!),
        data: x["data"] as Hex,
      }));
      expect(`0x8d80ff0a${c.data.slice(10)}`).toBe(c.data);
      expect(c.data.toLowerCase()).toContain(
        encodeMultiSendTransactions(calls).slice(2).toLowerCase()
      );
    });
  }
});

describe("vectors/governance.json", () => {
  const f = load("governance.json");
  it("records the Desktop limits", () => {
    expect(f.maxTypedDataChars).toBe(16384);
  });
  for (const c of f.cases) {
    it(`${c.valid ? "accepts" : "refuses"}: ${c.name}`, () => {
      expect(
        safeTxTypedDataJson(f.pin.chainId, f.pin.safe, txOf(c.tx)).length
      ).toBe(c.typedDataChars);
      expect(
        checkGovernanceSafeTx(f.pin as RegistryPin, txOf(c.tx)).length === 0
      ).toBe(c.valid);
    });
  }
});

describe("vectors/publish-limits.json", () => {
  const f = load("publish-limits.json");
  const base = f.baseRecord;
  const records: RecordInput[] = f.records.map(
    (r: { subjectId: Hex; label: string }) => ({
      ...base,
      contentHash: base.contentHash,
      effectiveAt: BigInt(base.effectiveAt),
      subjectId: r.subjectId,
      label: r.label,
    })
  );
  for (const c of f.cases)
    it(c.name, () =>
      expect(maxRecordsWithin(f.releaseId, records, 0, c.limits)).toBe(
        c.maxRecords
      )
    );
  it("small records: 10 KiB binds before the 20-record limit", () => {
    const small = records.map((r) => ({ ...r, label: "" }));
    expect(maxRecordsWithin(f.releaseId, small, 0, f.smallRecords.limits)).toBe(
      f.smallRecords.maxRecords
    );
  });
  for (const c of f.capabilities.cases) {
    it(`capability from ${JSON.stringify(c.answer)}`, async () => {
      const cap = await readSenderCapability(
        { request: async () => c.answer },
        11155111
      );
      expect([
        cap.maxCalldataBytes,
        cap.maxRecordsPerCall,
        cap.setsGas,
      ]).toEqual([c.maxCalldataBytes, c.maxRecordsPerCall, c.setsGas]);
    });
  }
});
