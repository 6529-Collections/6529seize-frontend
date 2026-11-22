import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiSignedRecordsOwners } from "@/generated/models/ApiSignedRecordsOwners";
import { commonApiFetch } from "@/services/api/common-api";

/**
 * Record keys name other profiles by their owner: the principal id their
 * primary wallet is bound to, or the lowercase wallet while it is bound to
 * none. GET /signed-records/owners maps wallets to owners; a profile is
 * looked up by its primary wallet. Never name a bound wallet.
 */

const OWNERS_PER_REQUEST = 50;
const CACHE_MS = 60_000;
const WALLET = /^0x[0-9a-f]{40}$/;
const OWNER = /^0x(?:[0-9a-f]{64}|[0-9a-f]{40})$/;

interface Cached {
  readonly value: string;
  readonly at: number;
}

const ownerByWallet = new Map<string, Cached>();
const walletByIdentity = new Map<string, Cached>();

function fresh(cache: Map<string, Cached>, key: string): string | null {
  const hit = cache.get(key);
  const age = hit ? Date.now() - hit.at : -1;
  return hit && age >= 0 && age < CACHE_MS ? hit.value : null;
}

async function requestOwners(wallets: readonly string[]): Promise<void> {
  const response = await commonApiFetch<ApiSignedRecordsOwners>({
    endpoint: "signed-records/owners",
    params: { wallets: wallets.join(",") },
    includeWalletAuth: false,
    cache: "no-store",
    errorMode: "structured",
  });
  const at = Date.now();
  const owners = Array.isArray(response.owners) ? response.owners : [];
  // Only well-formed owners are kept (the pattern also turns away a missing
  // one); a wallet left without one fails the lookup.
  for (const { wallet, owner } of owners) {
    if (OWNER.test(owner)) {
      ownerByWallet.set(String(wallet).toLowerCase(), { value: owner, at });
    }
  }
}

/** The owner of each wallet, in order. Throws when one has no answer. */
async function ownersOfWallets(wallets: readonly string[]): Promise<string[]> {
  const normalized = wallets.map((wallet) => wallet.toLowerCase());
  if (normalized.some((wallet) => !WALLET.test(wallet))) {
    throw new Error("A profile's wallet is not an address");
  }
  const missing = [
    ...new Set(normalized.filter((wallet) => !fresh(ownerByWallet, wallet))),
  ];
  for (let i = 0; i < missing.length; i += OWNERS_PER_REQUEST) {
    await requestOwners(missing.slice(i, i + OWNERS_PER_REQUEST));
  }
  return normalized.map((wallet) => {
    const owner = ownerByWallet.get(wallet)?.value;
    if (!owner) {
      throw new Error("The API did not name an owner for a profile");
    }
    return owner;
  });
}

/** A profile's primary wallet, by handle, wallet or profile id. */
async function primaryWalletOf(identityKey: string): Promise<string> {
  const key = identityKey.trim().toLowerCase();
  const hit = fresh(walletByIdentity, key);
  if (hit) {
    return hit;
  }
  const identity = await commonApiFetch<ApiIdentity>({
    endpoint: `identities/${encodeURIComponent(key)}`,
    errorMode: "structured",
  });
  const wallet = String(identity.primary_wallet).toLowerCase();
  if (!WALLET.test(wallet)) {
    throw new Error("That profile has no wallet");
  }
  walletByIdentity.set(key, { value: wallet, at: Date.now() });
  return wallet;
}

/**
 * The owner of each profile (handle, wallet or profile id), in order.
 * @api
 */
export async function ownersOfProfiles(
  identityKeys: readonly string[]
): Promise<string[]> {
  const wallets = await Promise.all(identityKeys.map(primaryWalletOf));
  return await ownersOfWallets(wallets);
}

/**
 * The owner a wallet's own records use: the principal it is bound to, or the
 * wallet itself while it is bound to none.
 * @api
 */
export async function ownerOfWallet(wallet: string): Promise<string> {
  const [owner] = await ownersOfWallets([wallet]);
  if (!owner) {
    throw new Error("The API did not name an owner for the wallet");
  }
  return owner;
}

/**
 * The owner of one profile (handle, wallet or profile id).
 * @api
 */
export async function ownerOfProfile(identityKey: string): Promise<string> {
  const [owner] = await ownersOfProfiles([identityKey]);
  if (!owner) {
    throw new Error("The API did not name an owner for the profile");
  }
  return owner;
}
