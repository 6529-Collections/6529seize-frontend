/**
 * Writes the next version of the person's ProfileDoc and signs the
 * PROFILE_REPLACE that names it. The chain identity profile tools own the
 * implementation (reading the current document and version, the new nonce,
 * the upload to the gateway's document store, the session key or wallet
 * signature, the submit and the retry on a version conflict); the site
 * builder only edits the `cms.primary.*` fields.
 */
export type ProfileDocSigner = "session-key" | "wallet";

type ProfileDocWriteErrorCode =
  | "session_key_unusable"
  | "signature_rejected"
  | "submit_failed";

export class ProfileDocWriteError extends Error {
  constructor(
    readonly code: ProfileDocWriteErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ProfileDocWriteError";
  }
}

export interface ProfileDocWriter {
  /** Signers this browser can use now, in order of preference. */
  availableSigners(): Promise<readonly ProfileDocSigner[]>;
  /**
   * Applies `edit` to the current document's fields (key to value, as the
   * chain identity tools' `ProfileDoc.fields`; null when there is no document),
   * writes and uploads the next version with the fields it returns, signs
   * PROFILE_REPLACE with `signer` and submits it. Calls `edit` again on the
   * newer document after a version conflict.
   */
  replaceProfileDoc(
    edit: (current: ReadonlyMap<string, string> | null) => Map<string, string>,
    signer: ProfileDocSigner
  ): Promise<{ readonly txId: string }>;
}

let registeredWriter: ProfileDocWriter | null = null;

/**
 * @api The chain identity profile tools register their writer here when
 * they load.
 */
export function registerProfileDocWriter(
  writer: ProfileDocWriter | null
): void {
  registeredWriter = writer;
}

export function getProfileDocWriter(): ProfileDocWriter | null {
  return registeredWriter;
}
