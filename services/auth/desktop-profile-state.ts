import type { DesktopProfileState } from "@/types/desktop-shell";

type DesktopProfile = DesktopProfileState["accounts"][number];

const ADDRESS = /^0x[0-9a-f]{40}$/i;
const MAX_DESKTOP_PROFILES = 5;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function nullableString(value: unknown, limit: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > limit) {
    throw new Error("Invalid saved Desktop profile field");
  }
  return value;
}

/** Copy only known fields; refresh credentials never enter the snapshot. */
function parseDesktopProfile(value: unknown): DesktopProfile {
  if (!isRecord(value)) {
    throw new Error("Invalid Desktop profile");
  }
  const account = value;
  const address = account["address"];
  if (typeof address !== "string" || !ADDRESS.test(address)) {
    throw new Error("Invalid Desktop profile address");
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
