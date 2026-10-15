import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import { formalManifestSchema } from "@/lib/tdh/formal/manifest";
import {
  VECTOR_COUNT,
  VECTOR_SET,
} from "@/app/network/tdh/implementations/vectors";
import explainer from "@/i18n/messages/networkTdhExplainer.en-US.json";
import formal from "@/i18n/messages/networkTdhFormal.en-US.json";
import how from "@/i18n/messages/networkTdhHow.en-US.json";
import impl from "@/i18n/messages/networkTdhImpl.en-US.json";
import spec from "@/i18n/messages/networkTdhSpec.en-US.json";
import verify from "@/i18n/messages/networkTdhVerify.en-US.json";

/**
 * Guards for the dated facts the TDH pages repeat in many places: the
 * conformance vector set the implementations page pins (P26 at 6529chain
 * 16d70d0: 61 vectors, 01 to 60 and 12b), the Lean model's proof manifest
 * (6529chain 7bf579a: 68 vectors), and the privacy of the daily feed.
 */
const MESSAGES: Record<string, string> = {
  ...explainer,
  ...formal,
  ...how,
  ...impl,
  ...spec,
  ...verify,
};

describe("TDH page facts", () => {
  it("counts P26's 61 conformance vectors everywhere", () => {
    expect(VECTOR_COUNT).toBe(61);
    expect(VECTOR_SET.specCommit).toBe("16d70d0");
    for (const [key, text] of Object.entries(MESSAGES)) {
      expect([key, text]).not.toEqual([
        key,
        expect.stringMatching(
          /\b(36|51) conformance (vectors|tests)\b|\ball 51\b|\b51 of 51\b|\b51 \/ 51\b/
        ),
      ]);
      expect([key, text]).not.toEqual([
        key,
        expect.stringMatching(/\b976 checks\b/),
      ]);
    }
  });

  it("takes the formal model's vector counts from its proof manifest", () => {
    const manifest = formalManifestSchema.parse(BUNDLED_FORMAL_MANIFEST);
    const p26 = manifest.vectors.find((run) => run.id === "p26");
    expect(p26).toMatchObject({ passed: 68, total: 68, checks: 1_190 });
    expect(manifest.facts.checks).toBe(21);
    for (const [key, text] of Object.entries(formal)) {
      expect([key, text]).not.toEqual([
        key,
        expect.stringMatching(
          /\b61 (conformance )?vectors\b|\b1,094\b|\b16 (numeric )?checks\b/
        ),
      ]);
    }
  });

  it("never promises per-holder detail or calls every difference explained", () => {
    for (const [key, text] of Object.entries(MESSAGES)) {
      expect([key, text]).not.toEqual([
        key,
        expect.stringMatching(
          /every difference is published|every difference explained|Holders appear only as labels/
        ),
      ]);
    }
  });

  it("does not overclaim the netting theorem", () => {
    for (const [key, text] of Object.entries(MESSAGES)) {
      expect([key, text]).not.toEqual([
        key,
        expect.stringMatching(
          /cannot change TDH|changes no value|and so no balance|stacks, balances and raw days only|order in which logs arrive/
        ),
      ]);
    }
  });
});
