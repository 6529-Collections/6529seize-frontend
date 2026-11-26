import { objectId } from "@/lib/chain/codec/ids";
import { verifyDraft } from "@/lib/chain-identity/operation";
import {
  createdEntryId,
  submissionCreate,
  submissionWithdraw,
} from "@/lib/chain-waves/entryOps";
import {
  CONTENT_CID,
  MANIFEST_HASH,
  submissionCreateDraft,
  submissionWithdrawDraft,
} from "./entryDraftFixture";
import { DECISION, ENTRY, VOTER, WALLET } from "./wavesDraftFixture";

const wallet = { kind: "wallet", address: WALLET } as const;

describe("entry operations", () => {
  it("builds SUBMISSION_CREATE as the chain drafts it, and the pinned types give its txId", () => {
    const op = submissionCreate(VOTER, wallet, {
      decisionId: DECISION,
      expectedConfigVersion: 3,
      manifestHash: MANIFEST_HASH,
      contentCid: CONTENT_CID,
    });
    expect(op.primaryType).toBe("SubmissionCreate");
    expect(op.request).toEqual({
      opType: "SUBMISSION_CREATE",
      principal: VOTER,
      keyType: 1,
      signer: WALLET,
      body: {
        decisionId: DECISION,
        expectedConfigVersion: 3,
        manifestHash: MANIFEST_HASH,
        contentCid: CONTENT_CID,
      },
    });
    expect(() =>
      verifyDraft(submissionCreateDraft(), op.request, op.primaryType)
    ).not.toThrow();
  });

  it("refuses an entry draft against another config version", () => {
    const op = submissionCreate(VOTER, wallet, {
      decisionId: DECISION,
      expectedConfigVersion: 3,
      manifestHash: MANIFEST_HASH,
      contentCid: CONTENT_CID,
    });
    expect(() =>
      verifyDraft(
        submissionCreateDraft({ configVersion: 4 }),
        op.request,
        op.primaryType
      )
    ).toThrow("doesn't match");
  });

  it("lowercases the words and takes only a CID", () => {
    const op = submissionCreate(VOTER, wallet, {
      decisionId: DECISION.toUpperCase().replace("0X", "0x") as `0x${string}`,
      expectedConfigVersion: 1,
      manifestHash: MANIFEST_HASH,
      contentCid: CONTENT_CID,
    });
    expect(op.request.body["decisionId"]).toBe(DECISION);
    expect(() =>
      submissionCreate(VOTER, wallet, {
        decisionId: DECISION,
        expectedConfigVersion: 1,
        manifestHash: MANIFEST_HASH,
        contentCid: MANIFEST_HASH,
      })
    ).toThrow("not a CID");
    expect(() =>
      submissionCreate(VOTER, wallet, {
        decisionId: DECISION,
        expectedConfigVersion: 0,
        manifestHash: MANIFEST_HASH,
        contentCid: CONTENT_CID,
      })
    ).toThrow("out of range");
  });

  it("builds SUBMISSION_WITHDRAW as the chain drafts it", () => {
    const op = submissionWithdraw(VOTER, wallet, {
      entryId: ENTRY,
      expectedVersion: 2,
    });
    expect(op.primaryType).toBe("SubmissionWithdraw");
    expect(op.request).toEqual({
      opType: "SUBMISSION_WITHDRAW",
      principal: VOTER,
      keyType: 1,
      signer: WALLET,
      body: { entryId: ENTRY, expectedVersion: 2 },
    });
    expect(() =>
      verifyDraft(
        submissionWithdrawDraft({ version: 2 }),
        op.request,
        op.primaryType
      )
    ).not.toThrow();
    expect(() =>
      verifyDraft(
        submissionWithdrawDraft({ version: 1 }),
        op.request,
        op.primaryType
      )
    ).toThrow("doesn't match");
  });

  it("names the entry a SUBMISSION_CREATE makes by its txId", () => {
    const { txId } = submissionCreateDraft();
    expect(createdEntryId(txId)).toBe(objectId(txId, 0, 0x0603));
  });
});
