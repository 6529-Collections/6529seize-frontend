import type { Hex } from "viem";
import type { Config } from "wagmi";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ChainActor } from "@/lib/chain-identity/identityOps";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { freshDocNonce, storeDoc } from "./docs";
import {
  assertDecisionOpen,
  getCheckedDecision,
  isTakingEntries,
  resolveEntryDecision,
} from "./entryGateway";
import {
  buildEntryManifest,
  entryFieldsOf,
  entryManifestDocument,
  type EntryConsent,
  type EntryFields,
} from "./entryManifest";
import {
  createdEntryId,
  submissionCreate,
  submissionWithdraw,
} from "./entryOps";
import { resolveEntry } from "./ids";
import type { ChainOperationRequest } from "./ops";
import {
  identityOfWallet,
  runChainWrite,
  walletSigning,
  type ChainSigning,
} from "./signing";

/**
 * Entries and their withdrawal on the 6529 Network. The connected wallet
 * signs each (never a session key: the chain takes neither from one), and
 * each returns once its block is final, since a vote or a withdrawal
 * builds on it.
 */

export interface ChainEntryReceipt {
  readonly entryId: Hex;
  readonly txId: Hex;
  readonly decisionId: Hex;
  readonly manifestHash: Hex;
  readonly contentCid: Hex;
}

/**
 * Where a write stands: the wallet is asked to sign ("wallet"), or the
 * signed write is on its way and waits until final ("sending").
 */
export type ChainEntryStage = "wallet" | "sending";

/**
 * A write the 6529 Network took but that wasn't final when the wait ended.
 * It may still land, so sending it again can make a second one: the UI
 * says so and offers no retry. `receipt` names the entry a
 * SUBMISSION_CREATE makes.
 */
export class ChainEntryPendingError extends ChainOperationError {
  constructor(
    message: string,
    readonly receipt: ChainEntryReceipt | null
  ) {
    super("timeout", message);
    this.name = "ChainEntryPendingError";
  }
}

const ENTRY_PENDING =
  "Your entry was sent to the 6529 Network but isn't final yet. It may still land, so check in a few minutes before you send it again.";
const WITHDRAWAL_PENDING =
  "Your withdrawal was sent to the 6529 Network but isn't final yet. Check again in a few minutes.";

const lower = (value: string): string => value.toLowerCase();
const MAX_CAUSE_DEPTH = 5;

/**
 * The wallet's "declined" when a wrapper error carries it as a cause, so
 * every caller tells a declined prompt from a failure the same way.
 */
function declinedOr(error: unknown): unknown {
  let current: unknown = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current; depth += 1) {
    if (isUserRejectedSigningError(current)) {
      return current;
    }
    current =
      typeof current === "object"
        ? (current as { cause?: unknown }).cause
        : null;
  }
  return error;
}

/**
 * Signs and sends one wallet write, reporting its stage, and waits until
 * final. A wait that ends after the signature reads as pending, not as a
 * failure: the write is out.
 */
async function sendWalletWrite(
  build: (actor: ChainActor) => ChainOperationRequest,
  signing: ChainSigning,
  pending: (txId: Hex) => ChainEntryPendingError,
  onStage?: (stage: ChainEntryStage) => void,
  signal?: AbortSignal
) {
  // Set by the signer, so the catch below sees it.
  const signed: { txId: Hex | null } = { txId: null };
  const staged: ChainSigning = {
    actor: signing.actor,
    signer: {
      keyType: signing.signer.keyType,
      sign: async (draft) => {
        onStage?.("wallet");
        const signature = await signing.signer.sign(draft);
        signed.txId = draft.txId;
        onStage?.("sending");
        return signature;
      },
    },
  };
  try {
    return await runChainWrite(build, staged, "final", signal);
  } catch (error) {
    if (
      signed.txId !== null &&
      error instanceof ChainOperationError &&
      error.reason === "timeout"
    ) {
      throw pending(signed.txId);
    }
    throw declinedOr(error);
  }
}

/**
 * Submits a create-drop request as an entry: finds its decision, asks for
 * the author's consent (`consent`: the wallet signs the terms first, when
 * the wave asks for it), keeps the manifest in the gateway's document
 * store, then sends SUBMISSION_CREATE against the decision read just
 * before the draft.
 */
export async function writeChainEntry(
  config: Config,
  wallet: Hex,
  input: {
    readonly request: ApiCreateDropRequest;
    readonly competitionId: string | null;
    /** The `chain_id` 6529.io's API gives the competition, when it does. */
    readonly competitionChainId?: Hex | null | undefined;
    readonly consent: (fields: EntryFields) => Promise<EntryConsent | null>;
    readonly onStage?: ((stage: ChainEntryStage) => void) | undefined;
  },
  signal?: AbortSignal
): Promise<ChainEntryReceipt> {
  if (input.request.poll) {
    throw new ChainOperationError(
      "rejected",
      "An entry can't carry a poll on the 6529 Network yet."
    );
  }
  const author = await identityOfWallet(wallet, signal);
  const decision = await resolveEntryDecision(
    {
      waveId: input.request.wave_id,
      competitionId: input.competitionId,
      competitionChainId: input.competitionChainId,
    },
    signal
  );
  assertDecisionOpen(decision);
  if (!isTakingEntries(decision, Date.now())) {
    throw new ChainOperationError(
      "rejected",
      "This decision isn't taking entries right now."
    );
  }
  const fields = entryFieldsOf(input.request);
  input.onStage?.("wallet");
  const consent = await input.consent(fields).catch((error: unknown) => {
    throw declinedOr(error);
  });
  const manifest = buildEntryManifest({
    nonceWord: freshDocNonce(),
    decisionId: decision.decisionId,
    waveId: decision.waveId,
    author: author.principalId,
    createdAt: Date.now(),
    fields,
    consent,
  });
  const document = entryManifestDocument(manifest);
  await storeDoc(document.bytes, signal);
  const current = await getCheckedDecision(decision.decisionId, signal);
  assertDecisionOpen(current);
  const receiptOf = (txId: Hex): ChainEntryReceipt => ({
    entryId: createdEntryId(txId),
    txId,
    decisionId: current.decisionId,
    manifestHash: document.manifestHash,
    contentCid: document.contentCid,
  });
  const draft = await sendWalletWrite(
    (actor) =>
      submissionCreate(author.principalId, actor, {
        decisionId: current.decisionId,
        expectedConfigVersion: current.configVersion,
        manifestHash: document.manifestHash,
        contentCid: document.contentCid,
      }),
    walletSigning(config, wallet),
    (txId) => new ChainEntryPendingError(ENTRY_PENDING, receiptOf(txId)),
    input.onStage,
    signal
  );
  return receiptOf(draft.txId);
}

/** Withdraws the author's own ACTIVE entry, the one a drop is. */
export async function writeChainWithdrawal(
  config: Config,
  wallet: Hex,
  input: {
    readonly dropId: string;
    readonly onStage?: ((stage: ChainEntryStage) => void) | undefined;
  },
  signal?: AbortSignal
): Promise<void> {
  const author = await identityOfWallet(wallet, signal);
  const entry = await resolveEntry(input.dropId, signal);
  if (lower(entry.author) !== lower(author.principalId)) {
    throw new ChainOperationError(
      "rejected",
      "Only the entry's author can withdraw it."
    );
  }
  if (entry.status !== "active") {
    throw new ChainOperationError(
      "rejected",
      "This entry is no longer in the running, so it can't be withdrawn."
    );
  }
  // The chain takes a withdrawal in any decision but one counting its
  // result (P61 1.16 4.7 check 5).
  if ((await getCheckedDecision(entry.decisionId, signal)).due) {
    throw new ChainOperationError(
      "rejected",
      "This decision is counting its result. Try again in a few minutes."
    );
  }
  await sendWalletWrite(
    (actor) =>
      submissionWithdraw(author.principalId, actor, {
        entryId: entry.entryId,
        expectedVersion: entry.version,
      }),
    walletSigning(config, wallet),
    () => new ChainEntryPendingError(WITHDRAWAL_PENDING, null),
    input.onStage,
    signal
  );
}
