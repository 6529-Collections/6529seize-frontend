/**
 * @jest-environment node
 */
import type { Hex } from "viem";

import type { TxLocation } from "@/lib/chain/gateway/transport";
import {
  checkTxAnswerJson,
  gatewayHeadJson,
  GatewayWireError,
  parseCheckTxAnswer,
  parseGatewayHead,
  parseTxLocation,
  txLocationJson,
} from "@/lib/chain/gateway/wire";

const HASH: Hex = `0x${"cd".repeat(32)}`;

/** What a gateway would put on the wire, after JSON encoding. */
const onWire = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe("gateway wire format v0", () => {
  it("round-trips every location, head and CheckTx answer", () => {
    const locations: TxLocation[] = [
      { status: "pending" },
      { status: "absent" },
      { status: "dropped", reason: "replaced" },
      {
        status: "included",
        height: 2n ** 63n,
        index: 4,
        code: 0x2603,
        detail: (6 << 16) | 2,
        evidence: { kind: "mock-chain/v0", payload: { txId: HASH } },
        decision: { decisionId: HASH, decisionTimeMs: 1_800_000_000_000n, evidence: null },
      },
    ];
    for (const location of locations) {
      expect(parseTxLocation(onWire(txLocationJson(location)))).toEqual(location);
    }
    expect(parseGatewayHead(onWire(gatewayHeadJson({ height: 7n, timeMs: 1_800_000_084_000n })))).toEqual({
      height: 7n,
      timeMs: 1_800_000_084_000n,
    });
    expect(parseCheckTxAnswer(onWire(checkTxAnswerJson({ code: 0x0301, detail: 0 })))).toEqual({
      code: 0x0301,
      detail: 0,
    });
  });

  it.each([
    ["no object", "included"],
    ["unknown version", { v: 1, status: "pending" }],
    ["unknown status", { v: 0, status: "maybe" }],
    ["bad drop reason", { v: 0, status: "dropped", reason: "lost" }],
    ["number height", { v: 0, status: "included", height: 5, index: 0, code: 0, detail: 0 }],
    ["uint64 overflow", { v: 0, status: "included", height: (2n ** 64n).toString(), index: 0, code: 0, detail: 0 }],
    ["leading zero", { v: 0, status: "included", height: "05", index: 0, code: 0, detail: 0 }],
    ["code above uint16", { v: 0, status: "included", height: "5", index: 0, code: 70_000, detail: 0 }],
    [
      "bad decision id",
      {
        v: 0,
        status: "included",
        height: "5",
        index: 0,
        code: 0,
        detail: 0,
        decision: { decisionId: "0x12", decisionTimeMs: "1" },
      },
    ],
    ["bad evidence", { v: 0, status: "included", height: "5", index: 0, code: 0, detail: 0, evidence: { kind: 3 } }],
  ])("refuses a location with %s", (_name, value) => {
    expect(() => parseTxLocation(value)).toThrow(GatewayWireError);
  });

  it("refuses malformed heads and answers", () => {
    expect(() => parseGatewayHead({ v: 0, height: "1", timeMs: -1 })).toThrow(GatewayWireError);
    expect(() => parseCheckTxAnswer({ v: 0, code: 1.5, detail: 0 })).toThrow(GatewayWireError);
    expect(() => parseCheckTxAnswer(null)).toThrow(GatewayWireError);
  });
});
