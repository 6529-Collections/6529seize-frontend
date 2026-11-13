import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { Query, QueryClient } from "@tanstack/react-query";
import { getHandlesFromProfile } from "../profileQueryHandles";
import { QueryKey } from "../query-keys";

function getProfileIdentities(profile: ApiIdentity | null): string[] {
  if (!profile) return [];
  return [
    profile.id,
    profile.query,
    profile.display,
    profile.primary_wallet,
    ...getHandlesFromProfile(profile),
  ].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
}

function matchesIdentity(
  query: Query,
  identities: ReadonlySet<string>
): boolean {
  const params = query.queryKey[1];
  return (
    typeof params === "object" &&
    params !== null &&
    "identity" in params &&
    typeof params.identity === "string" &&
    identities.has(params.identity.toLowerCase())
  );
}

export async function refreshProfileRatingLists(
  queryClient: QueryClient,
  matter: "REP" | "NIC",
  {
    targetProfiles,
    connectedProfile,
    profileProxy,
    rater,
  }: {
    readonly targetProfiles: readonly ApiIdentity[];
    readonly connectedProfile: ApiIdentity | null;
    readonly profileProxy: ApiProfileProxy | null;
    readonly rater?: string | null;
  }
): Promise<void> {
  // Every recipient-keyed allowance includes the same rater-global budget.
  const repRefreshes =
    matter === "REP"
      ? [
          queryClient.invalidateQueries({
            queryKey: [QueryKey.PROFILE_REP_RATINGS],
          }),
          queryClient.invalidateQueries({
            queryKey: [QueryKey.PROFILE_REP_CATEGORY_CONTRIBUTORS],
          }),
          queryClient.invalidateQueries({ queryKey: ["REP_CONTRIBUTORS"] }),
        ]
      : [];
  const actor = profileProxy?.created_by;
  const givenAliases = actor
    ? [actor.id, actor.handle, actor.primary_address]
    : getProfileIdentities(connectedProfile);
  const given = new Set(
    [...givenAliases, rater]
      .filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0
      )
      .map((value) => value.toLowerCase())
  );
  const received = new Set(
    targetProfiles
      .flatMap(getProfileIdentities)
      .map((value) => value.toLowerCase())
  );
  // A save can move recipients between offset pages in either sort order.
  // Return to page one rather than replaying all loaded pages.
  await Promise.all([
    ...repRefreshes,
    queryClient.resetQueries({
      queryKey: [QueryKey.PROFILE_RATING_LIST, { matter, direction: "given" }],
      predicate: (query) => matchesIdentity(query, given),
    }),
    queryClient.invalidateQueries({
      queryKey: [
        QueryKey.PROFILE_RATING_LIST,
        { matter, direction: "received" },
      ],
      predicate: (query) => matchesIdentity(query, received),
    }),
  ]);
}
