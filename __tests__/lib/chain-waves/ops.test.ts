import { ChainOperationError } from "@/lib/chain-identity/operation";
import { repCategoryId } from "@/lib/chain/codec/ids";
import { verifyDraft } from "@/lib/chain-identity/operation";
import { pinnedTypes } from "@/lib/chain-identity/typedDataTypes";
import {
  pollBallotSet,
  pollSelection,
  voteSet,
  waveRatingSet,
} from "@/lib/chain-waves/ops";
import {
  ballotDraft,
  DECISION,
  ENTRY,
  POLL,
  VOTER,
  voteDraft,
  WALLET,
  WAVE,
  waveRatingDraft,
} from "./wavesDraftFixture";

const wallet = { kind: "wallet", address: WALLET } as const;
const KEY_ID = `0x${"aa".repeat(32)}` as const;
const GRANT_ID = `0x${"bb".repeat(32)}` as const;
const session = { kind: "session", keyId: KEY_ID, grantId: GRANT_ID } as const;

describe("rule version 7's operations", () => {
  it("builds VOTE_SET as the chain drafts it, and the pinned types give its txId", () => {
    const op = voteSet(VOTER, wallet, {
      decisionId: DECISION,
      expectedConfigVersion: 2,
      entryId: ENTRY,
      amount: 250n,
      priorVoteVersion: 0,
      budgetScope: 1,
    });
    expect(op.primaryType).toBe("VoteSet");
    expect(op.request).toEqual({
      opType: "VOTE_SET",
      principal: VOTER,
      keyType: 1,
      signer: WALLET,
      body: {
        decisionId: DECISION,
        expectedConfigVersion: 2,
        entryId: ENTRY,
        amount: "250",
        priorVoteVersion: "0",
        budgetScope: 1,
      },
    });
    expect(() =>
      verifyDraft(voteDraft(), op.request, op.primaryType)
    ).not.toThrow();
  });

  it("refuses a vote draft that says another amount", () => {
    const op = voteSet(VOTER, wallet, {
      decisionId: DECISION,
      expectedConfigVersion: 2,
      entryId: ENTRY,
      amount: 250n,
      priorVoteVersion: 0,
      budgetScope: 1,
    });
    expect(() =>
      verifyDraft(voteDraft({ amount: 251n }), op.request, op.primaryType)
    ).toThrow("doesn't match");
  });

  it("signs a vote with this browser's session key", () => {
    const op = voteSet(VOTER, session, {
      decisionId: DECISION,
      expectedConfigVersion: 2,
      entryId: ENTRY,
      amount: -40n,
      priorVoteVersion: 77,
      budgetScope: 1,
    });
    expect(op.request).toMatchObject({
      keyType: 2,
      keyId: KEY_ID,
      authRef: GRANT_ID,
    });
    expect(() =>
      verifyDraft(
        voteDraft({
          amount: -40n,
          prior: 77n,
          keyType: 2,
          keyId: KEY_ID,
          authRef: GRANT_ID,
        }),
        op.request,
        op.primaryType
      )
    ).not.toThrow();
  });

  it("refuses an amount outside int64", () => {
    expect(() =>
      voteSet(VOTER, wallet, {
        decisionId: DECISION,
        expectedConfigVersion: 2,
        entryId: ENTRY,
        amount: 1n << 63n,
        priorVoteVersion: 0,
        budgetScope: 1,
      })
    ).toThrow(ChainOperationError);
  });

  it("builds POLL_BALLOT_SET with one bit an option, option 1 first", () => {
    expect(pollSelection([1, 3])).toBe(0b101);
    expect(pollSelection([32])).toBe(2 ** 31);
    expect(() => pollSelection([])).toThrow(ChainOperationError);
    expect(() => pollSelection([0])).toThrow(ChainOperationError);
    expect(() => pollSelection([33])).toThrow(ChainOperationError);

    const op = pollBallotSet(VOTER, wallet, {
      pollId: POLL,
      selection: 0b101,
      priorVersion: 1,
      wallet: WALLET,
    });
    expect(op.primaryType).toBe("PollBallotSet");
    expect(() =>
      verifyDraft(ballotDraft(), op.request, op.primaryType)
    ).not.toThrow();
  });

  it("builds wave REP as RATING_SET with a WAVE target", () => {
    const op = waveRatingSet(VOTER, wallet, {
      waveId: WAVE,
      category: "Quality",
      value: 30n,
      priorVersion: 7,
    });
    expect(op.request.body).toEqual({
      matter: 1,
      targetKind: 2,
      target: WAVE,
      category: repCategoryId("Quality"),
      categoryName: "Quality",
      value: "30",
      priorVersion: "7",
    });
    expect(() =>
      verifyDraft(
        waveRatingDraft({
          category: repCategoryId("Quality"),
          categoryName: "Quality",
        }),
        op.request,
        op.primaryType
      )
    ).not.toThrow();
  });

  it("gives uncategorised wave REP category zero and no name", () => {
    const op = waveRatingSet(VOTER, wallet, {
      waveId: WAVE,
      category: "  ",
      value: 30n,
      priorVersion: 7,
    });
    expect(op.request.body).toMatchObject({
      category: `0x${"00".repeat(32)}`,
      categoryName: "",
    });
    expect(() =>
      waveRatingSet(VOTER, wallet, {
        waveId: WAVE,
        category: "two  spaces",
        value: 1n,
        priorVersion: 0,
      })
    ).toThrow(ChainOperationError);
  });

  it.each([
    "GroupCreate",
    "GroupReplace",
    "RoleGrant",
    "RoleRevoke",
    "WaveCreate",
    "WavePolicyReplace",
    "WaveClose",
    "ModerationDecide",
    "WavePauseSet",
    "WavePauseRemove",
    "DecisionOpen",
    "SubmissionCreate",
    "SubmissionWithdraw",
    "VoteSet",
    "PollCreate",
    "PollBallotSet",
    "DecisionCreate",
    "DecisionArchive",
  ])("pins %s with every struct it names", (primaryType) => {
    const types = pinnedTypes(primaryType);
    expect(types).not.toBeNull();
    const declared = new Set(Object.keys(types ?? {}));
    for (const fields of Object.values(types ?? {})) {
      for (const { type } of fields) {
        const base = type.replace("[]", "");
        if (/^[A-Z]/.test(base)) {
          expect(declared).toContain(base);
        }
      }
    }
  });
});
