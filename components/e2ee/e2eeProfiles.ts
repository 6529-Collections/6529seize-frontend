import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";

interface E2eeResolvedProfile {
  readonly handle: string | null;
  readonly pfp: string | null;
  readonly wallets: string[];
}

const PROFILE_STALE_TIME_MS = 5 * 60_000;
const RESOLVE_CONCURRENCY = 8;

const UNKNOWN_PROFILE: E2eeResolvedProfile = {
  handle: null,
  pfp: null,
  wallets: [],
};

const getE2eeProfileQueryKey = (profileId: string) =>
  [QueryKey.PROFILE, "e2ee-profile-id", profileId] as const;

export const toResolvedProfile = (
  profileId: string,
  identity: ApiIdentity
): E2eeResolvedProfile => {
  // `identities/{key}` also matches handles and wallets; only accept the
  // record that is exactly the requested profile.
  if (identity.id !== profileId) {
    return UNKNOWN_PROFILE;
  }
  const wallets = new Set<string>();
  for (const wallet of identity.wallets ?? []) {
    if (typeof wallet.wallet === "string" && wallet.wallet.length > 0) {
      wallets.add(wallet.wallet.toLowerCase());
    }
  }
  if (identity.primary_wallet) {
    wallets.add(identity.primary_wallet.toLowerCase());
  }
  return {
    handle: identity.handle,
    pfp: identity.pfp,
    wallets: [...wallets],
  };
};

/** Shared by the engine's resolver and UI lookups, so both hit one cache. */
export const getE2eeProfileQueryOptions = (profileId: string) => ({
  queryKey: getE2eeProfileQueryKey(profileId),
  queryFn: ({ signal }: { readonly signal: AbortSignal }) =>
    commonApiFetch<ApiIdentity>({
      endpoint: `identities/${encodeURIComponent(profileId)}`,
      signal,
    }),
  staleTime: PROFILE_STALE_TIME_MS,
});

const fetchProfile = (queryClient: QueryClient, profileId: string) =>
  queryClient.fetchQuery(getE2eeProfileQueryOptions(profileId));

/**
 * Resolves profile ids to display data and wallets for the engine. There is
 * no batch identity-by-id endpoint today, so this fans out per id (bounded)
 * through React Query, which caches and de-duplicates the lookups.
 */
export async function resolveE2eeProfiles(
  queryClient: QueryClient,
  profileIds: readonly string[]
): Promise<Record<string, E2eeResolvedProfile>> {
  const unique = [...new Set(profileIds.filter((id) => id.length > 0))];
  const resolved: Record<string, E2eeResolvedProfile> = {};
  for (let offset = 0; offset < unique.length; offset += RESOLVE_CONCURRENCY) {
    const batch = unique.slice(offset, offset + RESOLVE_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((profileId) => fetchProfile(queryClient, profileId))
    );
    results.forEach((result, index) => {
      const profileId = batch[index];
      if (profileId === undefined) {
        return;
      }
      resolved[profileId] =
        result.status === "fulfilled"
          ? toResolvedProfile(profileId, result.value)
          : UNKNOWN_PROFILE;
    });
  }
  return resolved;
}
