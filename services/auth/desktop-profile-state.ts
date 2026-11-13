import { jwtDecode } from "jwt-decode";
import { isAddress } from "viem";
import type { DesktopProfileState } from "@/types/desktop-shell";

type DesktopProfile = DesktopProfileState["accounts"][number];

const MAX_DESKTOP_PROFILES = 5;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function nullableString(value: unknown, limit: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > limit) {
    throw new TypeError("Invalid saved Desktop profile field");
  }
  return value;
}

/** Copy only known fields; refresh credentials never enter the snapshot. */
function parseDesktopProfile(value: unknown): DesktopProfile {
  if (!isRecord(value)) {
    throw new TypeError("Invalid Desktop profile");
  }
  const account = value;
  const address = account["address"];
  if (typeof address !== "string" || !isAddress(address, { strict: false })) {
    throw new TypeError("Invalid Desktop profile address");
  }
  return {
    address: address.toLowerCase(),
    role: nullableString(account["role"], 200),
    jwt: nullableString(account["jwt"], 32_768),
    profileId: nullableString(account["profileId"], 200),
    profileHandle: nullableString(account["profileHandle"], 200),
    authSessionVersion: account["authSessionVersion"] === "v2" ? "v2" : null,
    refreshToken: null,
  };
}

/**
 * Normalize the page's saved accounts into the snapshot the desktop shell
 * accepts: valid, unique, at most five, with the active account kept. A
 * malformed entry is skipped instead of blocking start-up.
 */
export function getDesktopProfileMigrationState(
  value: unknown
): DesktopProfileState {
  const state: Record<string, unknown> = isRecord(value) ? value : {};
  const accounts: DesktopProfile[] = [];
  const seen = new Set<string>();
  const accountsValue: unknown = state["accounts"];
  const rawAccounts: readonly unknown[] = Array.isArray(accountsValue)
    ? (accountsValue as readonly unknown[])
    : [];
  for (const candidate of rawAccounts) {
    try {
      const account = parseDesktopProfile(candidate);
      if (!seen.has(account.address)) {
        seen.add(account.address);
        accounts.push(account);
      }
    } catch {
      // Keep the remaining valid profiles.
    }
  }
  const active =
    typeof state["activeAddress"] === "string"
      ? state["activeAddress"].toLowerCase()
      : null;
  const selected = accounts.find((account) => account.address === active);
  const retained = accounts.slice(0, MAX_DESKTOP_PROFILES);
  if (selected && !retained.includes(selected)) {
    retained[retained.length - 1] = selected;
  }
  return {
    version: 1,
    accounts: retained,
    activeAddress: selected ? (active as string) : null,
  };
}

/** A JWT issued for this wallet: decodable, with `sub` equal to the address. */
function isTokenForAddress(jwt: string, address: string): boolean {
  try {
    const { sub } = jwtDecode<{ readonly sub?: unknown }>(jwt);
    return typeof sub === "string" && sub.toLowerCase() === address;
  } catch {
    return false;
  }
}

/**
 * Validate the profiles the desktop shell returns before anything reaches
 * page storage (the active profile's token becomes the auth cookie). Unlike
 * the lenient page-side normalization, any problem rejects the whole
 * snapshot: wrong shape, more than five profiles, an invalid or duplicate
 * address, an active profile that is not listed, or a token that was not
 * issued for its profile's address. Addresses are lower-cased.
 */
export function parseRestoredDesktopProfileState(
  value: unknown
): DesktopProfileState {
  if (!isRecord(value) || value["version"] !== 1) {
    throw new TypeError("Invalid restored Desktop profiles");
  }
  const rawAccounts: unknown = value["accounts"];
  if (
    !Array.isArray(rawAccounts) ||
    rawAccounts.length > MAX_DESKTOP_PROFILES
  ) {
    throw new TypeError("Invalid restored Desktop profiles");
  }
  const accounts = (rawAccounts as readonly unknown[]).map(parseDesktopProfile);
  const addresses = new Set(accounts.map((account) => account.address));
  if (addresses.size !== accounts.length) {
    throw new TypeError("Duplicate restored Desktop profile");
  }
  for (const account of accounts) {
    if (
      account.jwt !== null &&
      !isTokenForAddress(account.jwt, account.address)
    ) {
      throw new TypeError("Restored Desktop profile token does not match");
    }
  }
  const rawActive: unknown = value["activeAddress"];
  if (rawActive !== null && typeof rawActive !== "string") {
    throw new TypeError("Invalid restored active Desktop profile");
  }
  const activeAddress = rawActive === null ? null : rawActive.toLowerCase();
  if (activeAddress !== null && !addresses.has(activeAddress)) {
    throw new TypeError("Restored active Desktop profile is not listed");
  }
  return { version: 1, accounts, activeAddress };
}
