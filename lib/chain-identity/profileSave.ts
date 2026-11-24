import type { Hex } from "viem";
import type { Config } from "wagmi";
import {
  chainGateway,
  ChainGatewayError,
  type ChainDraft,
  type ChainIdentity,
} from "./gateway";
import { profileReplace, type ChainActor } from "./identityOps";
import { chainNetworkId } from "./network";
import {
  ChainOperationError,
  draftOperation,
  type ChainSigner,
} from "./operation";
import {
  decodeProfileDoc,
  matchesCid,
  prepareProfileDoc,
  profileDocumentTypedData,
  signedProfileDoc,
  type ProfileDoc,
} from "./profileDoc";
import { sessionFeeAboveCap, withinSessionFeeCap } from "./sessionFeeCap";
import type { StoredSessionKey } from "./sessionKey";
import { sessionSigner, signProfileDocument, walletSigner } from "./signers";

/**
 * Saving a profile on the 6529 Network (P37 4.2, INTERFACES 5.4): the next
 * version of the profile document keeps every field the person didn't edit
 * exactly as it was, is signed by a key that can replace the profile, is
 * stored with the gateway, and PROFILE_REPLACE points the identity at it.
 */

interface CurrentProfile {
  readonly doc: ProfileDoc | null;
  /** The identity names a document whose bytes aren't a ProfileDoc.v1 of that CID. */
  readonly unreadable: boolean;
}

/**
 * The identity's current document. A failed fetch, or bytes whose hash
 * isn't the CID, throws: nothing is saved over a document this browser
 * couldn't get. A document the store doesn't have (404) reads as unreadable
 * only once the import has completed and only when it isn't the imported
 * version 1 (written at or below the import's doneHeight): replacing an
 * imported document that hasn't reached the store would lose fields only
 * the import sets (cms.archive). Bytes of the CID that aren't a
 * ProfileDoc.v1 read as unreadable. The page warns, and saving replaces it.
 */
export async function readCurrentProfile(
  identity: ChainIdentity,
  signal?: AbortSignal
): Promise<CurrentProfile> {
  const cid = identity.profile?.docCid;
  if (cid === undefined || cid === "0x") {
    return { doc: null, unreadable: false };
  }
  let bytes: Uint8Array;
  try {
    bytes = await chainGateway.getDoc(cid, signal);
  } catch (error) {
    if (!(error instanceof ChainGatewayError) || error.status !== 404) {
      throw error;
    }
    const imported = (await chainGateway.getMembership(signal))?.import;
    if (imported?.completed !== true) {
      throw new ChainGatewayError(
        503,
        "import_running",
        "The 6529 Network is still importing identities. Try again once that is done, usually within an hour."
      );
    }
    // The imported document itself (version 1, written by the import) is
    // never replaced on a 404: it holds fields only the import sets. A
    // missing height counts as the import's, the safe side.
    const doneHeight = imported.doneHeight;
    const updatedHeight: unknown = identity.profile?.updatedHeight;
    const writtenAfterImport =
      typeof doneHeight === "number" &&
      typeof updatedHeight === "number" &&
      updatedHeight > doneHeight;
    if (identity.profile?.version === 1 && !writtenAfterImport) {
      throw new ChainGatewayError(
        503,
        "imported_doc_missing",
        "Your imported profile isn't in 6529's document store yet, so it can't be changed. Try again later."
      );
    }
    return { doc: null, unreadable: true };
  }
  if (!matchesCid(bytes, cid)) {
    throw new ChainGatewayError(
      502,
      "cid_mismatch",
      "The gateway sent bytes that aren't this profile document."
    );
  }
  const doc = decodeProfileDoc(bytes);
  return { doc, unreadable: doc === null };
}

/**
 * The next version's fields: every current field exactly as it is, with the
 * edited ones over them, trimmed. An edit to an empty value removes the key.
 */
export function nextProfileFields(
  current: ProfileDoc | null,
  edits: Readonly<Record<string, string | undefined>>
): Map<string, string> {
  const fields = new Map(current?.fields ?? []);
  for (const [key, value] of Object.entries(edits)) {
    // An edit typed back to the current value leaves that value untouched.
    if (value !== undefined && value !== fields.get(key)) {
      fields.set(key, value.trim());
    }
  }
  return fields;
}

interface ProfileSaveSigning {
  readonly config: Config;
  readonly wallet: Hex;
  readonly sessionKey: StoredSessionKey | null;
  /** Called just before the wallet is asked to sign the document. */
  readonly onWalletPrompt?: () => void;
  /** Called once the document is signed, while the change is drafted. */
  readonly onDocumentSigned?: () => void;
  /**
   * Called when the change's fee is above what the session key signs on its
   * own (`sessionFeeCap`), before the change is drafted again for the wallet
   * to sign. Without it, such a change is refused, and none is sent.
   */
  readonly onWalletFallback?: () => void;
}

/**
 * Signs and stores the next document, then drafts and checks the
 * PROFILE_REPLACE that points at it. Returns the draft and its signer.
 * Above the session key's fee cap the wallet signs the change when the page
 * takes that (`onWalletFallback`); otherwise it is refused.
 */
export async function prepareProfileReplace(
  identity: ChainIdentity,
  fields: ReadonlyMap<string, string>,
  signing: ProfileSaveSigning,
  signal?: AbortSignal
): Promise<{ readonly draft: ChainDraft; readonly signer: ChainSigner }> {
  const { config, wallet, sessionKey } = signing;
  // The chain's version decides: the new document is the next one, and its
  // prev is the CID the identity points at now.
  const currentVersion = identity.profile?.version ?? 0;
  const version = currentVersion + 1;
  const networkId = await chainNetworkId(signal);
  const { unsigned, docHash } = prepareProfileDoc({
    principal: identity.principalId,
    version,
    prev: identity.profile?.docCid ?? "0x",
    fields,
  });
  if (sessionKey === null) {
    signing.onWalletPrompt?.();
  }
  const signature = await signProfileDocument(
    config,
    sessionKey === null
      ? { kind: "wallet", address: wallet }
      : { kind: "session", record: sessionKey },
    profileDocumentTypedData(networkId, identity.principalId, version, docHash)
  );
  signing.onDocumentSigned?.();
  const { bytes, cid } = signedProfileDoc(unsigned, signature);
  await chainGateway.uploadDoc(bytes, cid, signal);
  const draftFor = async (actor: ChainActor): Promise<ChainDraft> => {
    const operation = profileReplace(
      identity.principalId,
      actor,
      currentVersion,
      cid
    );
    const draft = await draftOperation(
      operation.request,
      operation.primaryType,
      signal
    );
    // The document and the transaction must name the same network.
    if (draft.typedData.domain.salt.toLowerCase() !== networkId) {
      throw new ChainOperationError(
        "draft_mismatch",
        "The gateway's draft is for another network. Nothing was changed."
      );
    }
    return draft;
  };
  const byWallet = async () => ({
    draft: await draftFor({ kind: "wallet", address: wallet }),
    signer: walletSigner(config, wallet),
  });
  if (sessionKey === null) {
    return byWallet();
  }
  const draft = await draftFor({
    kind: "session",
    keyId: sessionKey.keyId,
    grantId: sessionKey.grantId,
  });
  if (withinSessionFeeCap(draft)) {
    return { draft, signer: sessionSigner(sessionKey) };
  }
  if (signing.onWalletFallback === undefined) {
    throw sessionFeeAboveCap(draft);
  }
  // The key's document stands (a key that can sign PROFILE_REPLACE signs
  // it, and no node checks it); only the change goes to the wallet.
  signing.onWalletFallback();
  return byWallet();
}
