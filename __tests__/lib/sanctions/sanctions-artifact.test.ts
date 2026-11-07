jest.mock("server-only", () => ({}), { virtual: true });

import canonicalVectors from "./vectors/canonical-json.json";
import cidVectors from "./vectors/cid.json";
import { canonicalJson } from "@/lib/sanctions/canonical-json";
import { rawBlockCid, sha256Hex } from "@/lib/sanctions/content-address.server";
import {
  loadSanctionsSnapshot,
  SANCTIONS_SNAPSHOT_CID,
  SANCTIONS_SNAPSHOT_SHA256,
} from "@/lib/sanctions/sanctions-snapshot.server";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The vectors are copied from the backend spec
 * (`specs/sanctions-list-v1/vectors`), so this port must produce the same
 * bytes as the reference builder.
 */
describe("canonicalJson (spec vectors)", () => {
  it.each(canonicalVectors.cases)(
    "serializes vector %#",
    ({ input, output }) => {
      expect(canonicalJson(input)).toBe(output);
    }
  );

  it.each(canonicalVectors.errors)("rejects $description", ({ input }) => {
    expect(() => canonicalJson(input)).toThrow(TypeError);
  });
});

describe("rawBlockCid (spec vectors)", () => {
  it.each(cidVectors.cases)("matches $description", (vector) => {
    const bytes = new TextEncoder().encode(vector.utf8);
    expect(sha256Hex(bytes)).toBe(vector.sha256);
    expect(rawBlockCid(bytes)).toBe(vector.cid);
  });
});

describe("loadSanctionsSnapshot", () => {
  it("re-serializes the snapshot to the exact committed bytes", () => {
    const committed = readFileSync(
      path.join(process.cwd(), "lib/sanctions/snapshot/sanctions-list.v1.json")
    );
    const loaded = loadSanctionsSnapshot();
    expect(Buffer.from(loaded.bytes).equals(committed)).toBe(true);
    expect(loaded.sha256).toBe(SANCTIONS_SNAPSHOT_SHA256);
    expect(loaded.cid).toBe(SANCTIONS_SNAPSHOT_CID);
    expect(loaded.preview).toBe(true);
  });

  it("contains official sources only", () => {
    const { list } = loadSanctionsSnapshot();
    expect(list.sources.map((source) => source.id).sort()).toEqual([
      "ca-sema",
      "ch-seco",
      "eu-fsf",
      "il-nbctf",
      "jp-mof",
      "kr-fsc",
      "uk-fcdo",
      "us-ofac-sdn",
    ]);
    for (const entry of list.addresses) {
      expect(entry.address).toMatch(/^0x[0-9a-f]{40}$/);
    }
  });
});
