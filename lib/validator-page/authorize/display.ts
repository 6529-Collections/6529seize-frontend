// Small pure helpers of the phone page.

/** A key's code: the last 8 hex characters of its public key, as the validator shows it. */
export function keyCode(publicKey: string): string {
  return publicKey.slice(-8).toLowerCase();
}

/** 0x1234…abcd */
export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Each share as a percent of their sum, such as "50%" or "33.33%". */
export function sharePercents(shares: readonly number[]): string[] {
  const total = shares.reduce((sum, share) => sum + share, 0);
  return shares.map((share) => {
    const percent = total > 0 ? (share / total) * 100 : 0;
    return `${Number(percent.toFixed(2))}%`;
  });
}

const SIGNATURE = /^0x[0-9a-fA-F]{130}$/;

/**
 * The validator takes only a recovery byte of 27 or 28. Some wallets give
 * 0 or 1; add 27 to those and leave every other signature as it is.
 */
export function withLegacyRecoveryByte(signature: string): string {
  if (!SIGNATURE.test(signature)) {
    return signature;
  }
  const v = Number.parseInt(signature.slice(130), 16);
  if (v !== 0 && v !== 1) {
    return signature;
  }
  return `${signature.slice(0, 130)}${(v + 27).toString(16)}`;
}
