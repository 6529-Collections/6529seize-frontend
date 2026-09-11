/** An operator-facing recovery diagnostic containing no transport or credential data. */
export class CmsRecoveryError extends Error {
  override readonly name = "CmsRecoveryError";
}

export function formatCmsRecoveryError(error: unknown): string {
  return error instanceof CmsRecoveryError
    ? error.message
    : "CMS recovery failed. Check the manifest, expected signer, content hash, output directory and RPC configuration.";
}
