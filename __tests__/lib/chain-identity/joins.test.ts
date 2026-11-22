import type { Hex } from "viem";
import { chainGateway } from "@/lib/chain-identity/gateway";
import {
  draftJoin,
  heldJoinDraft,
  JOIN_VALID_MS,
  joinReadiness,
} from "@/lib/chain-identity/joins";
import {
  heldJoin,
  IDENTITY_WALLET,
  JOIN_PRINCIPAL,
  joinDraft,
  JOINING_WALLET,
} from "./joinFixture";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { draft: jest.fn() },
}));

const gateway = chainGateway as unknown as { draft: jest.Mock };
const OTHER: Hex = "0x00000000000000000000000000000000000000cc";

beforeEach(() => jest.clearAllMocks());

describe("the identity's wallet starts a join", () => {
  it("asks for a day-long draft with the join's own nonceLane", async () => {
    gateway.draft.mockResolvedValue(joinDraft());
    const draft = await draftJoin(
      JOIN_PRINCIPAL,
      IDENTITY_WALLET,
      JOINING_WALLET
    );
    expect(draft.txId).toBe(joinDraft().txId);
    expect(gateway.draft.mock.calls[0][0]).toMatchObject({
      opType: "IDENTITY_JOIN",
      principal: JOIN_PRINCIPAL,
      signer: IDENTITY_WALLET,
      body: { wallet: JOINING_WALLET },
      validForMs: JOIN_VALID_MS,
      nonceLane: 1,
    });
  });

  it("keeps the join's window within the chain's one day, with the gateway's minute of lead", () => {
    const DAY = 86_400_000;
    const GATEWAY_LEAD_MS = 60_000;
    expect(JOIN_VALID_MS + GATEWAY_LEAD_MS).toBeLessThanOrEqual(DAY);
  });

  it("refuses a draft for another wallet or another nonceLane", async () => {
    gateway.draft.mockResolvedValue(joinDraft({ joining: OTHER }));
    await expect(
      draftJoin(JOIN_PRINCIPAL, IDENTITY_WALLET, JOINING_WALLET)
    ).rejects.toMatchObject({ reason: "draft_mismatch" });
    gateway.draft.mockResolvedValue(joinDraft({ nonceLane: 0 }));
    await expect(
      draftJoin(JOIN_PRINCIPAL, IDENTITY_WALLET, JOINING_WALLET)
    ).rejects.toMatchObject({ reason: "draft_mismatch" });
  });
});

describe("the joining wallet checks a held join", () => {
  it("takes the join the relay holds for this wallet", () => {
    const draft = heldJoinDraft(heldJoin(), JOINING_WALLET);
    expect(draft.txId).toBe(joinDraft().txId);
    expect(draft.fee.maxFee).toBe("3000000000000000");
  });

  it("refuses a join for another wallet, a changed body or another operation", () => {
    expect(() => heldJoinDraft(heldJoin(), OTHER)).toThrow(
      "doesn't match a wallet join"
    );
    const tampered = heldJoin();
    const changed = {
      ...tampered,
      typed_data: {
        ...tampered.typed_data,
        message: { ...tampered.typed_data.message, body: { wallet: OTHER } },
      },
    };
    expect(() => heldJoinDraft(changed, JOINING_WALLET)).toThrow();
    expect(() =>
      heldJoinDraft(
        { ...heldJoin(), op_type: "IDENTITY_REMOVE" },
        JOINING_WALLET
      )
    ).toThrow("doesn't match a wallet join");
    // A txId that isn't the digest of what the wallet would sign.
    expect(() =>
      heldJoinDraft(
        { ...heldJoin(), tx_id: `0x${"99".repeat(32)}` },
        JOINING_WALLET
      )
    ).toThrow("doesn't match this change");
  });
});

describe("whether a wallet can join", () => {
  const DAY = 86_400_000;
  const ELSEWHERE: Hex = `0x${"0c".repeat(32)}`;
  it("follows the chain: bound, waiting after it left another identity, or free", () => {
    expect(
      joinReadiness(
        { wallet: OTHER, principalId: JOIN_PRINCIPAL },
        DAY,
        0,
        ELSEWHERE
      )
    ).toEqual({ kind: "bound", principalId: JOIN_PRINCIPAL });
    const left = {
      wallet: OTHER,
      principalId: null,
      leftAt: { leftMs: 1_000, from: JOIN_PRINCIPAL },
    };
    expect(joinReadiness(left, DAY, 2_000, ELSEWHERE)).toEqual({
      kind: "waiting",
      leftMs: 1_000,
      untilMs: 1_000 + DAY,
    });
    expect(joinReadiness(left, DAY, 1_000 + DAY, ELSEWHERE)).toEqual({
      kind: "free",
    });
    // Without the chain's wait the page claims none; the chain still checks.
    expect(joinReadiness(left, null, 2_000, ELSEWHERE)).toEqual({
      kind: "free",
    });
    expect(
      joinReadiness(
        { wallet: OTHER, principalId: null, leftAt: null },
        DAY,
        0,
        ELSEWHERE
      )
    ).toEqual({ kind: "free" });
  });

  it("lets a wallet rejoin the identity it left at once, but not create one", () => {
    const left = {
      wallet: OTHER,
      principalId: null,
      leftAt: { leftMs: 1_000, from: JOIN_PRINCIPAL },
    };
    // IDENTITY_JOIN waives the wait for the identity the wallet left.
    expect(joinReadiness(left, DAY, 2_000, JOIN_PRINCIPAL)).toEqual({
      kind: "free",
    });
    // IDENTITY_CREATE never does.
    expect(joinReadiness(left, DAY, 2_000, null)).toMatchObject({
      kind: "waiting",
    });
  });
});
