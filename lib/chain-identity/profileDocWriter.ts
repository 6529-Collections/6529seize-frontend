import type { Hex } from "viem";
import type { Config } from "wagmi";
import { getAccount } from "wagmi/actions";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import {
  ProfileDocWriteError,
  type ProfileDocSigner,
  type ProfileDocWriter,
} from "@/lib/profile-cms/chain/profile-doc-writer";
import { chainGateway, ChainGatewayError, type ChainIdentity } from "./gateway";
import { ChainOperationError, submitAndAwait } from "./operation";
import { prepareProfileReplace, readCurrentProfile } from "./profileSave";
import { usableSessionKey } from "./session";
import type { StoredSessionKey } from "./sessionKey";
import { readGrant } from "./state";

/**
 * The profile site builder's way to change the profile document: the same
 * save as the profile editor, with the builder's edit applied to the
 * current fields. It may change only the site's own fields.
 */

const SITE_FIELD_PREFIX = "cms.primary.";
/** Tries in all, the first included, when someone else replaced the profile meanwhile. */
const ATTEMPTS = 3;
/** Chain refusals that mean this browser's key can't sign the change now. */
const SESSION_KEY_REFUSALS: ReadonlySet<string> = new Set([
  "KEY_NOT_BOUND",
  "KEY_REVOKED",
  "GRANT_INACTIVE",
  "OP_NOT_GRANTED",
  "OVER_GRANT_BUDGET",
  "EXPIRED_AT_EXECUTION",
  "KEY_NOT_ACTIVE",
  "GRANT_NOT_LIVE",
]);
const INADMISSIBLE_NAME = /^0x[0-9a-f]{4} ([A-Z_]+)/i;

const connectedWallet = (config: Config): Hex | null =>
  getAccount(config).address ?? null;

/** The chain's name for why it refused a change, if it gave one. */
function refusalName(error: unknown): string | null {
  if (error instanceof ChainOperationError) {
    return error.resultName;
  }
  if (error instanceof ChainGatewayError && error.code === "inadmissible") {
    return INADMISSIBLE_NAME.exec(error.message)?.[1]?.toUpperCase() ?? null;
  }
  return null;
}

const keyUnusable = () =>
  new ProfileDocWriteError(
    "session_key_unusable",
    "This browser's key for the 6529 Network can't sign this change."
  );

async function identityOf(config: Config): Promise<{
  readonly wallet: Hex;
  readonly identity: ChainIdentity;
}> {
  const wallet = connectedWallet(config);
  if (wallet === null) {
    throw new ProfileDocWriteError(
      "submit_failed",
      "Connect your wallet to change your profile on the 6529 Network."
    );
  }
  const identity = await chainGateway.getIdentityByWallet(wallet);
  if (!identity) {
    throw new ProfileDocWriteError(
      "submit_failed",
      "This wallet has no identity on the 6529 Network yet."
    );
  }
  return { wallet, identity };
}

/** This browser's key, checked against its grant on the chain; null for the wallet. */
async function keyFor(
  principalId: Hex,
  signer: ProfileDocSigner
): Promise<StoredSessionKey | null> {
  if (signer === "wallet") {
    return null;
  }
  const key = await usableSessionKey(principalId);
  if (key === null) {
    throw keyUnusable();
  }
  const grant = await readGrant(key.grantId, Date.now());
  if (grant?.active !== true) {
    throw keyUnusable();
  }
  return key;
}

/** Throws unless `next` differs from `current` only in the site's fields. */
function assertSiteFieldsOnly(
  current: ReadonlyMap<string, string> | null,
  next: ReadonlyMap<string, string>
): void {
  const keys = new Set([...(current?.keys() ?? []), ...next.keys()]);
  for (const key of keys) {
    if (!key.startsWith(SITE_FIELD_PREFIX) && current?.get(key) !== next.get(key)) {
      throw new ProfileDocWriteError(
        "submit_failed",
        `The site builder can't change "${key}" in your profile. Nothing was changed.`
      );
    }
  }
}

async function replaceOnce(
  config: Config,
  edit: (current: ReadonlyMap<string, string> | null) => Map<string, string>,
  signer: ProfileDocSigner
): Promise<{ readonly txId: string }> {
  const { wallet, identity } = await identityOf(config);
  const sessionKey = await keyFor(identity.principalId, signer);
  const current = await readCurrentProfile(identity);
  if (current.unreadable) {
    // The profile editor can replace such a document after a warning; the
    // site builder never writes over one unseen.
    throw new ProfileDocWriteError(
      "submit_failed",
      "Your current profile on the 6529 Network can't be read, so it wasn't changed. Save your profile once on your 6529 Network identity page, then try again."
    );
  }
  const before = current.doc?.fields ?? null;
  const fields = edit(before === null ? null : new Map(before));
  assertSiteFieldsOnly(before, fields);
  const prepared = await prepareProfileReplace(identity, fields, {
    config,
    wallet,
    sessionKey,
  });
  const sig = await prepared.signer.sign(prepared.draft);
  await submitAndAwait(prepared.draft, [
    { role: 0, keyType: prepared.signer.keyType, sig },
  ]);
  return { txId: prepared.draft.txId };
}

/** The publish lane's error for whatever stopped the change. */
function writeErrorOf(
  error: unknown,
  signer: ProfileDocSigner
): ProfileDocWriteError {
  if (error instanceof ProfileDocWriteError) {
    return error;
  }
  if (isUserRejectedSigningError(error)) {
    return new ProfileDocWriteError(
      "signature_rejected",
      "The signature request was canceled in your wallet."
    );
  }
  const name = refusalName(error);
  if (signer === "session-key" && name !== null && SESSION_KEY_REFUSALS.has(name)) {
    return keyUnusable();
  }
  return new ProfileDocWriteError(
    "submit_failed",
    error instanceof Error && error.message !== ""
      ? error.message
      : "The profile change did not go through."
  );
}

/**
 * The ProfileDocWriter the profile site builder uses (publish lane,
 * `registerProfileDocWriter`). Each change reads the current document,
 * applies the builder's edit, signs and stores the next version, and
 * submits PROFILE_REPLACE, waiting until it is final. When someone else
 * replaced the profile meanwhile (STALE_VERSION), it reads the newer
 * document and applies the edit again.
 */
export function chainProfileDocWriter(config: Config): ProfileDocWriter {
  return {
    availableSigners: async () => {
      try {
        const { identity } = await identityOf(config);
        return (await usableSessionKey(identity.principalId)) === null
          ? ["wallet"]
          : ["session-key", "wallet"];
      } catch {
        return [];
      }
    },
    replaceProfileDoc: async (edit, signer) => {
      for (let attempt = 1; ; attempt += 1) {
        try {
          return await replaceOnce(config, edit, signer);
        } catch (error) {
          if (refusalName(error) !== "STALE_VERSION" || attempt >= ATTEMPTS) {
            throw writeErrorOf(error, signer);
          }
        }
      }
    },
  };
}
