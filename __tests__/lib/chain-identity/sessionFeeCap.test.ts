import type { ChainDraft } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  sessionFeeCap,
  withinSessionFeeCap,
} from "@/lib/chain-identity/sessionFeeCap";
import { signWithSessionKey } from "@/lib/chain-identity/sessionKey";
import { OpType } from "@/lib/chain/codec/ops";
import {
  OP_POLL_BALLOT_SET,
  OP_VOTE_SET,
  sessionKeyGrant,
} from "@/lib/chain-identity/identityOps";
import { sessionOpsFor } from "@/lib/chain-identity/session";
import { sessionSigner } from "@/lib/chain-identity/signers";
import { ratingDraft } from "./chainDraftFixture";

jest.mock("@/lib/chain-identity/sessionKey", () => ({
  signWithSessionKey: jest.fn(async () => `0x${"5e".repeat(64)}`),
}));

/** The fixture's draft with its signed header and fee figures changed. */
function withFee(
  draft: ChainDraft,
  change: {
    readonly maxFee?: bigint | undefined;
    readonly maxWork?: bigint;
    readonly unsignedBytes?: number;
    readonly primaryType?: string;
  }
): ChainDraft {
  const header = draft.typedData.message["header"] as Record<string, unknown>;
  const nextHeader: Record<string, unknown> = { ...header };
  if ("maxFee" in change) {
    if (change.maxFee === undefined) {
      delete nextHeader["maxFee"];
    } else {
      nextHeader["maxFee"] = change.maxFee.toString();
    }
  }
  if (change.maxWork !== undefined) {
    nextHeader["maxWork"] = change.maxWork.toString();
  }
  return {
    ...draft,
    typedData: {
      ...draft.typedData,
      primaryType: change.primaryType ?? draft.typedData.primaryType,
      message: { ...draft.typedData.message, header: nextHeader },
    },
    unsigned:
      change.unsignedBytes === undefined
        ? draft.unsigned
        : `0x${"ab".repeat(change.unsignedBytes)}`,
    // verifyDraft holds the shown fee equal to the signed one.
    fee: {
      ...draft.fee,
      maxFee:
        change.maxFee === undefined
          ? draft.fee.maxFee
          : change.maxFee.toString(),
    },
  };
}

/**
 * The fixture at the floor, times 20: its 2 unsigned bytes and 128 for the
 * signature entry at 1.6e12, and 124,200 RU at 1.6e10.
 */
const FIXTURE_CAP = 43_904_000_000_000_000n;

describe("the session key's fee cap", () => {
  it("is 20 times the operation's fee at the floor base fees", () => {
    expect(sessionFeeCap(ratingDraft())).toBe(FIXTURE_CAP);
  });

  it("takes a fee up to the cap and nothing above it", () => {
    const draft = ratingDraft();
    expect(withinSessionFeeCap(draft)).toBe(true);
    expect(withinSessionFeeCap(withFee(draft, { maxFee: FIXTURE_CAP }))).toBe(
      true
    );
    expect(
      withinSessionFeeCap(withFee(draft, { maxFee: FIXTURE_CAP + 1n }))
    ).toBe(false);
  });

  it("counts the size and the work only up to its ceilings", () => {
    const inflated = withFee(ratingDraft(), {
      maxWork: 50_000_000n,
      unsignedBytes: 100_000,
    });
    // 20 x (2,048 bytes x 1.6e12 + 600,000 RU x 1.6e10), whatever the
    // gateway's figures.
    expect(sessionFeeCap(inflated)).toBe(257_536_000_000_000_000n);
    expect(
      withinSessionFeeCap(withFee(inflated, { maxFee: 10n ** 19n }))
    ).toBe(false);
    // A profile change counts its work up to 300,000 RU.
    const profile = withFee(inflated, { primaryType: "ProfileReplace" });
    expect(sessionFeeCap(profile)).toBe(161_536_000_000_000_000n);
    // A ballot up to 800,000 RU; a vote, which walks the voter's stored
    // votes, up to the 6,000,000 RU any transaction may carry.
    const ballot = withFee(inflated, { primaryType: "PollBallotSet" });
    expect(sessionFeeCap(ballot)).toBe(321_536_000_000_000_000n);
    const vote = withFee(inflated, { primaryType: "VoteSet" });
    expect(sessionFeeCap(vote)).toBe(1_985_536_000_000_000_000n);
  });

  it("leaves an operation it doesn't list to the wallet", () => {
    const transfer = withFee(ratingDraft(), {
      primaryType: "BalanceTransfer",
    });
    expect(sessionFeeCap(transfer)).toBe(0n);
    expect(withinSessionFeeCap(transfer)).toBe(false);
  });

  it("has a ceiling for every operation a browser key's grant lists", () => {
    // A grant made once the chain runs votes and ballots lists the most.
    const grant = sessionKeyGrant(`0x${"0a".repeat(32)}`, `0x${"0b".repeat(20)}`, {
      keyId: `0x${"0c".repeat(32)}`,
      publicKeyHex: `0x${"0d".repeat(32)}`,
      currencyAsset: `0x${"0e".repeat(32)}`,
      feeBudget: 1n,
      expiresAtMs: 1,
      ops: sessionOpsFor([OP_VOTE_SET, OP_POLL_BALLOT_SET]),
    });
    const ops = grant.request.body["ops"] as readonly number[];
    expect(ops).toHaveLength(4);
    // The codec's table predates POLL_BALLOT_SET.
    const codes = { ...OpType, POLL_BALLOT_SET: OP_POLL_BALLOT_SET };
    for (const op of ops) {
      const name = Object.entries(codes).find(([, code]) => code === op)?.[0];
      // PROFILE_REPLACE is ProfileReplace in the typed data.
      const typedName = (name ?? "")
        .toLowerCase()
        .replace(/(?:^|_)([a-z])/g, (_, letter: string) => letter.toUpperCase());
      const draft = withFee(ratingDraft(), { primaryType: typedName });
      expect([typedName, withinSessionFeeCap(draft)]).toEqual([typedName, true]);
    }
  });

  it("refuses a draft whose signed header has no fee", () => {
    expect(
      withinSessionFeeCap(withFee(ratingDraft(), { maxFee: undefined }))
    ).toBe(false);
  });
});

describe("sessionSigner", () => {
  const record = {
    keyPair: { privateKey: {} as CryptoKey },
  } as Parameters<typeof sessionSigner>[0];

  beforeEach(() => jest.clearAllMocks());

  it("signs a draft within the cap on its own", async () => {
    const draft = ratingDraft({ keyType: 2 });
    await expect(sessionSigner(record).sign(draft)).resolves.toBe(
      `0x${"5e".repeat(64)}`
    );
    expect(signWithSessionKey).toHaveBeenCalledWith(
      record.keyPair.privateKey,
      draft.txId
    );
  });

  it("signs nothing above the cap and says the fee", async () => {
    const draft = withFee(ratingDraft({ keyType: 2 }), {
      maxFee: FIXTURE_CAP + 1n,
    });
    const refused = sessionSigner(record)
      .sign(draft)
      .catch((error: unknown) => error);
    const error = await refused;
    expect(error).toBeInstanceOf(ChainOperationError);
    expect(error).toMatchObject({
      reason: "fee_above_cap",
      values: { maxFee: (FIXTURE_CAP + 1n).toString() },
    });
    expect(signWithSessionKey).not.toHaveBeenCalled();
  });
});
