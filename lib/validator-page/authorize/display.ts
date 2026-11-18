// Small pure helpers of the phone page.

/** A key's code: the last 8 hex characters of its public key, as the validator shows it. */
export function keyCode(publicKey: string): string {
  return publicKey.slice(-8).toLowerCase();
}

/**
 * The whole public key in groups of 8 hex characters, so it can be read
 * against another screen group by group. The last group is the key code.
 */
export function groupedPublicKey(publicKey: string): string {
  const digits = publicKey.replace(/^0x/i, "").toLowerCase();
  return `0x ${digits.match(/.{1,8}/g)?.join(" ") ?? ""}`;
}

/**
 * The validator numbers each authorization one above the account's last,
 * and an account adds at most a few a day. A number past this one is far
 * beyond any account's history, and a later authorization would need a
 * still larger one.
 */
const MAX_PLAUSIBLE_AUTH_VERSION = 1_000_000n;

export function isImplausibleAuthVersion(authVersion: bigint): boolean {
  return authVersion > MAX_PLAUSIBLE_AUTH_VERSION;
}

/**
 * The keys the link doesn't mark as the validator's own, and the part of
 * the authorization (0 to 1) they hold together.
 */
export function unmarkedKeys(
  keys: readonly { readonly share: number; readonly mine: boolean }[]
): { readonly count: number; readonly fraction: number } {
  const total = keys.reduce((sum, key) => sum + key.share, 0);
  const others = keys.filter((key) => !key.mine);
  const held = others.reduce((sum, key) => sum + key.share, 0);
  return { count: others.length, fraction: total > 0 ? held / total : 0 };
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
