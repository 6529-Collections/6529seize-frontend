import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { E2eePrefillPerson } from "../e2eeComposePrefill";

const GROUP_STALE_TIME_MS = 60_000;
const MAX_PARTICIPANTS = 100;
const LOOKUP_CONCURRENCY = 8;

/**
 * The fields read from a DM wave, typed loosely: wave payloads reach headers
 * before every nested field is guaranteed (see MyStreamWaveTabsHeader).
 */
interface DmWaveLike {
  readonly chat?: {
    readonly scope?: {
      readonly group?: {
        readonly id?: string | undefined;
        readonly is_direct_message?: boolean | undefined;
      } | null;
    } | null;
  } | null;
  readonly contributors_overview?:
    | readonly { readonly contributor_identity: string }[]
    | null;
}

export const isPlaintextDmWave = (
  wave: DmWaveLike | null | undefined
): boolean => wave?.chat?.scope?.group?.is_direct_message === true;

const normalize = (values: readonly string[]): string[] => [
  ...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)),
];

/** Primary wallets of the DM's members, from the DM group (as the right pane shows). */
async function fetchDmGroupWallets(
  queryClient: QueryClient,
  groupId: string
): Promise<string[]> {
  const group = await queryClient.fetchQuery({
    queryKey: [QueryKey.GROUP, groupId],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(groupId)}`,
        signal,
      }),
    staleTime: GROUP_STALE_TIME_MS,
  });
  const identityGroupId = group.group.identity_group_id;
  if (!identityGroupId) {
    return [];
  }
  const wallets = await queryClient.fetchQuery({
    queryKey: [
      QueryKey.GROUP_WALLET_GROUP_WALLETS,
      { group_id: groupId, wallet_group_id: identityGroupId },
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<string[]>({
        endpoint: `groups/${encodeURIComponent(groupId)}/identity_groups/${encodeURIComponent(identityGroupId)}`,
        signal,
      }),
    staleTime: GROUP_STALE_TIME_MS,
  });
  return normalize(wallets);
}

async function lookupIdentities(
  queryClient: QueryClient,
  keys: readonly string[]
): Promise<ApiIdentity[]> {
  const identities: ApiIdentity[] = [];
  for (let offset = 0; offset < keys.length; offset += LOOKUP_CONCURRENCY) {
    const batch = keys.slice(offset, offset + LOOKUP_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((key) =>
        queryClient.fetchQuery(getIdentityQueryOptions({ handleOrWallet: key }))
      )
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        identities.push(result.value);
      }
    }
  }
  return identities;
}

/**
 * Resolves a plaintext DM's other participants to profiles, using the DM's
 * access group already shown in the client (no new endpoint). Falls back to
 * the wave's contributors when the group is unavailable.
 */
export async function resolveDmParticipants(
  queryClient: QueryClient,
  wave: DmWaveLike,
  selfProfileId: string | null
): Promise<E2eePrefillPerson[]> {
  const groupId = wave.chat?.scope?.group?.id ?? null;
  let keys: string[] = [];
  if (groupId) {
    try {
      keys = await fetchDmGroupWallets(queryClient, groupId);
    } catch {
      keys = [];
    }
  }
  if (keys.length === 0) {
    keys = normalize(
      (wave.contributors_overview ?? []).map(
        (contributor) => contributor.contributor_identity
      )
    );
  }
  const identities = await lookupIdentities(
    queryClient,
    keys.slice(0, MAX_PARTICIPANTS)
  );
  const people = new Map<string, E2eePrefillPerson>();
  for (const identity of identities) {
    if (!identity.id || identity.id === selfProfileId) {
      continue;
    }
    people.set(identity.id, {
      profileId: identity.id,
      handle: identity.handle,
      pfp: identity.pfp,
      wallet: identity.primary_wallet
        ? identity.primary_wallet.toLowerCase()
        : null,
    });
  }
  return [...people.values()];
}
