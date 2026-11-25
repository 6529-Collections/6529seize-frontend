import type { Hex } from "viem";
import type { OperationSchema } from "@/lib/chain/codec/ops";
import { bytes32, cidBytes, struct, u32 } from "@/lib/chain/codec/schema";
import type { ChainDraft } from "@/lib/chain-identity/gateway";
import { DECISION, ENTRY, draftOf, type Signing } from "./wavesDraftFixture";

/**
 * SUBMISSION_CREATE and SUBMISSION_WITHDRAW drafts as the gateway answers
 * them, their txIds from the chain codec under chain-tx `schema.rs`'s
 * field names (lib/chain/codec still names the decision `competitionId`).
 */

export const MANIFEST_HASH: Hex = `0x${"4d".repeat(32)}`;
export const CONTENT_CID: Hex = `0x01551220${"c1".repeat(32)}`;

const SUBMISSION_CREATE: OperationSchema = {
  opType: 0x0604,
  opVersion: 1,
  name: "SUBMISSION_CREATE",
  primaryType: "SubmissionCreate",
  body: struct("SubmissionCreateBody", [
    ["decisionId", bytes32],
    ["expectedConfigVersion", u32],
    ["manifestHash", bytes32],
    ["contentCid", cidBytes],
  ]),
};

const SUBMISSION_WITHDRAW: OperationSchema = {
  opType: 0x0605,
  opVersion: 1,
  // Not in lib/chain/codec's list; the digest reads opType and the types.
  name: "SUBMISSION_WITHDRAW" as OperationSchema["name"],
  primaryType: "SubmissionWithdraw",
  body: struct("SubmissionWithdrawBody", [
    ["entryId", bytes32],
    ["expectedVersion", u32],
  ]),
};

export const submissionCreateDraft = (
  input: { readonly configVersion?: number } & Signing = {}
): ChainDraft => {
  const body = {
    decisionId: DECISION,
    expectedConfigVersion: input.configVersion ?? 3,
    manifestHash: MANIFEST_HASH,
    contentCid: CONTENT_CID,
  };
  return draftOf(SUBMISSION_CREATE, input, body, body);
};

export const submissionWithdrawDraft = (
  input: { readonly version?: number } & Signing = {}
): ChainDraft => {
  const body = { entryId: ENTRY, expectedVersion: input.version ?? 1 };
  return draftOf(SUBMISSION_WITHDRAW, input, body, body);
};
