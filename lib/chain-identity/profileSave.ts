import type { Hex } from "viem";
import type { Config } from "wagmi";
import { chainGateway, type ChainDraft, type ChainIdentity } from "./gateway";
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
 * The identity's current document. A gateway failure throws, so nothing is
 * saved over a document that couldn't be fetched; bytes that aren't the
 * named ProfileDoc read as unreadable, and saving then replaces them.
 */
export async function readCurrentProfile(
  identity: ChainIdentity,
  signal?: AbortSignal
): Promise<CurrentProfile> {
  const cid = identity.profile?.docCid;
  if (cid === undefined || cid === "0x") {
    return { doc: null, unreadable: false };
  }
  const bytes = await chainGateway.getDoc(cid, signal);
  const doc = matchesCid(bytes, cid) ? decodeProfileDoc(bytes) : null;
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
    if (value !== undefined) {
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
}

/**
 * Signs and stores the next document, then drafts and checks the
 * PROFILE_REPLACE that points at it. Returns the draft and its signer.
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
  const actor: ChainActor =
    sessionKey === null
      ? { kind: "wallet", address: wallet }
      : { kind: "session", keyId: sessionKey.keyId, grantId: sessionKey.grantId };
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
  return {
    draft,
    signer:
      sessionKey === null
        ? walletSigner(config, wallet)
        : sessionSigner(sessionKey),
  };
}
