import type { Hex } from "viem";
import { ObjectKind, objectId } from "@/lib/chain/codec/ids";
import type { ChainActor } from "@/lib/chain-identity/identityOps";
import { chainOperation, type ChainOperationRequest } from "./ops";

/**
 * Entries on the 6529 Network: SUBMISSION_CREATE (0x0604) and
 * SUBMISSION_WITHDRAW (0x0605), rule version 7. Both are wallet-only: the
 * chain refuses them from a session key. Field names follow chain-tx
 * `schema.rs`.
 */

const word = (value: Hex): Hex => value.toLowerCase() as Hex;

const CID_BYTES = /^0x01[0-9a-f]{70,72}$/i;

const version = (value: number, field: string): number => {
  if (!Number.isInteger(value) || value < 1 || value > 0xffffffff) {
    throw new RangeError(`${field} is out of range`);
  }
  return value;
};

/** SUBMISSION_CREATE: a new entry in a decision, by the principal. */
export function submissionCreate(
  principal: Hex,
  actor: ChainActor,
  input: {
    readonly decisionId: Hex;
    readonly expectedConfigVersion: number;
    readonly manifestHash: Hex;
    readonly contentCid: Hex;
  }
): ChainOperationRequest {
  if (!CID_BYTES.test(input.contentCid)) {
    throw new RangeError("contentCid is not a CID");
  }
  return chainOperation(
    "SUBMISSION_CREATE",
    "SubmissionCreate",
    principal,
    actor,
    {
      decisionId: word(input.decisionId),
      expectedConfigVersion: version(
        input.expectedConfigVersion,
        "expectedConfigVersion"
      ),
      manifestHash: word(input.manifestHash),
      contentCid: word(input.contentCid),
    }
  );
}

/** SUBMISSION_WITHDRAW: the author takes an ACTIVE entry out. */
export const submissionWithdraw = (
  principal: Hex,
  actor: ChainActor,
  input: { readonly entryId: Hex; readonly expectedVersion: number }
): ChainOperationRequest =>
  chainOperation(
    "SUBMISSION_WITHDRAW",
    "SubmissionWithdraw",
    principal,
    actor,
    {
      entryId: word(input.entryId),
      expectedVersion: version(input.expectedVersion, "expectedVersion"),
    }
  );

/** The entry a SUBMISSION_CREATE makes: `ObjectId(txId, 0, 0x0603)`. */
export const createdEntryId = (txId: Hex): Hex =>
  objectId(txId, 0, ObjectKind.ENTRY);
