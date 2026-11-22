import {
  getProfileDocWriter,
  ProfileDocWriteError,
  type ProfileDocSigner,
  type ProfileDocWriter,
} from "./profile-doc-writer";
import {
  withProfileSitePointer,
  type ProfileSitePointer,
} from "./profile-doc-cms";

type ProfileSiteMoveFailureCode =
  | "chain_unavailable"
  | "signature_rejected"
  | "chain_failed";

export type ProfileSiteMoveResult =
  | {
      readonly ok: true;
      readonly txId: string;
      readonly signer: ProfileDocSigner;
      /** True once 6529.io's index shows the new primary. */
      readonly confirmed: boolean;
    }
  | {
      readonly ok: false;
      readonly code: ProfileSiteMoveFailureCode;
      readonly message: string;
    };

const SIGNER_ORDER: readonly ProfileDocSigner[] = ["session-key", "wallet"];

/**
 * Moves the profile site pointer with one PROFILE_REPLACE: the next
 * ProfileDoc version names `pointer` in `cms.primary.publication` and
 * `cms.primary.package` (null removes both, which unpublishes).
 * Signs with the session key when this browser has one, and with the wallet
 * when it has none or the chain refuses the session key.
 */
export async function moveProfileSitePointer(params: {
  readonly pointer: ProfileSitePointer | null;
  readonly writer?: ProfileDocWriter | null | undefined;
  readonly confirm?: (() => Promise<boolean>) | undefined;
}): Promise<ProfileSiteMoveResult> {
  const writer =
    params.writer === undefined ? getProfileDocWriter() : params.writer;
  if (!writer) {
    return unavailable();
  }
  const available = await writer.availableSigners();
  const signers = SIGNER_ORDER.filter((signer) => available.includes(signer));
  if (signers.length === 0) {
    return unavailable();
  }
  for (const signer of signers) {
    try {
      const { txId } = await writer.replaceProfileDoc(
        (current) => withProfileSitePointer(current, params.pointer),
        signer
      );
      const confirmed = params.confirm ? await params.confirm() : false;
      return { ok: true, txId, signer, confirmed };
    } catch (error) {
      if (
        error instanceof ProfileDocWriteError &&
        error.code === "session_key_unusable"
      ) {
        continue;
      }
      if (
        error instanceof ProfileDocWriteError &&
        error.code === "signature_rejected"
      ) {
        return {
          ok: false,
          code: "signature_rejected",
          message: "The signature request was canceled in your wallet.",
        };
      }
      return {
        ok: false,
        code: "chain_failed",
        message:
          error instanceof Error && error.message
            ? error.message
            : "The profile change did not go through.",
      };
    }
  }
  return unavailable();
}

/**
 * Polls until 6529.io's index serves `expectedPackageHash` as the handle's
 * primary site (null: no site), or the time runs out.
 */
export async function waitForProfileSitePrimary(params: {
  readonly expectedPackageHash: string | null;
  readonly fetchPrimaryPackageHash: () => Promise<string | null>;
  readonly timeoutMs?: number | undefined;
  readonly intervalMs?: number | undefined;
  readonly sleep?: ((ms: number) => Promise<void>) | undefined;
  readonly now?: (() => number) | undefined;
}): Promise<boolean> {
  const timeoutMs = params.timeoutMs ?? 120_000;
  const intervalMs = params.intervalMs ?? 4_000;
  const sleep =
    params.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = params.now ?? Date.now;
  const deadline = now() + timeoutMs;
  for (;;) {
    try {
      if (
        (await params.fetchPrimaryPackageHash()) === params.expectedPackageHash
      ) {
        return true;
      }
    } catch {
      // The index may lag or the request may fail; keep polling.
    }
    if (now() + intervalMs > deadline) {
      return false;
    }
    await sleep(intervalMs);
  }
}

function unavailable(): ProfileSiteMoveResult {
  return {
    ok: false,
    code: "chain_unavailable",
    message: "This browser can't sign profile changes on the 6529 Network yet.",
  };
}
