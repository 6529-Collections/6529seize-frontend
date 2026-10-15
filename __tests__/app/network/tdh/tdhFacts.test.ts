import { LEAN_BUILD } from "@/app/network/tdh/formal/leanResults";
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
 * conformance vector set of P26 at 6529chain 16d70d0 (61 vectors, 01 to 60
 * and 12b), the Lean model at 83d0338, and the privacy of the daily feed.
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
    expect(LEAN_BUILD.vectorsTotal).toBe(VECTOR_COUNT);
    expect(LEAN_BUILD.vectorChecks).toBe(1_094);
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
        expect.stringMatching(/cannot change TDH|changes no value/),
      ]);
    }
  });
});
