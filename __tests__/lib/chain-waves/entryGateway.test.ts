import type { Hex } from "viem";
import { chainGatewayGet } from "@/lib/chain-identity/gateway";
import {
  entryGateway,
  isChainMadeDecision,
} from "@/lib/chain-waves/entryGateway";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGatewayGet: jest.fn(),
}));

const WAVE: Hex = `0x${"05".repeat(32)}`;
const gatewayGet = chainGatewayGet as jest.Mock;

/** `count` decisions whose ids follow `from` (ids ascend, as the route's). */
const page = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    decisionId: `0x${(from + index).toString(16).padStart(64, "0")}`,
    waveId: WAVE,
  }));
const afterOf = (call: unknown[]) =>
  (call[1] as { query: { after?: string } }).query.after;

beforeEach(() => {
  gatewayGet.mockReset();
});

describe("entryGateway.getWaveDecisions", () => {
  it("reads one short page", async () => {
    gatewayGet.mockResolvedValueOnce(page(1, 3));
    await expect(entryGateway.getWaveDecisions(WAVE)).resolves.toHaveLength(3);
    expect(gatewayGet).toHaveBeenCalledTimes(1);
    expect(gatewayGet).toHaveBeenCalledWith(`/v1/waves/${WAVE}/decisions`, {
      signal: undefined,
      query: { at: "head", limit: 500, after: undefined },
    });
  });

  it("follows full pages from their last decision", async () => {
    const first = page(1, 500);
    gatewayGet.mockResolvedValueOnce(first).mockResolvedValueOnce(page(501, 2));
    const decisions = await entryGateway.getWaveDecisions(WAVE);
    expect(decisions).toHaveLength(502);
    expect(gatewayGet).toHaveBeenCalledTimes(2);
    expect(afterOf(gatewayGet.mock.calls[1])).toBe(first.at(-1)?.decisionId);
  });

  it("ends the list at a page that doesn't move on", async () => {
    const full = page(1, 500);
    gatewayGet.mockResolvedValueOnce(full).mockResolvedValueOnce(full);
    await expect(entryGateway.getWaveDecisions(WAVE)).resolves.toHaveLength(
      1000
    );
    expect(gatewayGet).toHaveBeenCalledTimes(2);
  });

  it("refuses a wave with more decisions than it reads", async () => {
    let from = 1;
    gatewayGet.mockImplementation(async () => {
      const rows = page(from, 500);
      from += 500;
      return rows;
    });
    await expect(entryGateway.getWaveDecisions(WAVE)).rejects.toThrow(
      "Submit from the decision's own page."
    );
    expect(gatewayGet).toHaveBeenCalledTimes(10);
  });
});

describe("isChainMadeDecision", () => {
  const CHAIN_ID = `0x${"3c".repeat(32)}`;

  it("is true for a chain_id with legacy_origin false", () => {
    expect(
      isChainMadeDecision({ chain_id: CHAIN_ID, legacy_origin: false })
    ).toBe(true);
  });

  it.each([
    ["an imported decision", { chain_id: CHAIN_ID, legacy_origin: true }],
    ["no legacy_origin", { chain_id: CHAIN_ID }],
    ["no chain_id", { legacy_origin: false }],
    ["a chain_id that isn't one", { chain_id: "0x12", legacy_origin: false }],
    ["no record", null],
  ])("is false for %s", (_why, record) => {
    expect(isChainMadeDecision(record)).toBe(false);
  });
});
