import { cache } from "react";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CicStatement, ProfileActivityLog } from "@/entities/IProfile";
import type { CountlessPage } from "@/helpers/Types";
import { getProfileCicStatements } from "@/helpers/server.helpers";
import { withServerTiming } from "@/helpers/performance.helpers";
import {
  extractProfileEnabledAt,
  fetchFollowersCount,
  fetchProfileEnabledLog,
} from "./userPageHeaderData";

const fetchHeaderStatements = cache(
  async (
    normalizedHandleOrWallet: string,
    headers: Record<string, string>
  ): Promise<CicStatement[]> =>
    await withServerTiming(
      `identity-statements:${normalizedHandleOrWallet}`,
      async () =>
        await getProfileCicStatements({
          handleOrWallet: normalizedHandleOrWallet,
          headers,
        })
    )
);

const fetchHeaderProfileLog = cache(
  async (
    normalizedHandleOrWallet: string,
    headers: Record<string, string>
  ): Promise<CountlessPage<ProfileActivityLog> | null> =>
    await fetchProfileEnabledLog({
      handleOrWallet: normalizedHandleOrWallet,
      headers,
    })
);

const fetchHeaderFollowersCount = cache(
  async (
    profileId: ApiIdentity["id"],
    headers: Record<string, string>
  ): Promise<number | null> => {
    if (!profileId) {
      return null;
    }
    return await fetchFollowersCount({
      profileId,
      headers,
    });
  }
);

export type UserPageHeaderPrefetchResult = Readonly<{
  statements: CicStatement[];
  profileEnabledAt: string | null;
  followersCount: number | null;
}>;

export async function prefetchUserPageHeaderData({
  profile,
  headers,
  handleOrWallet,
}: {
  readonly profile: ApiIdentity;
  readonly headers: Record<string, string>;
  readonly handleOrWallet: string;
}): Promise<UserPageHeaderPrefetchResult> {
  if (!handleOrWallet) {
    return {
      statements: [],
      profileEnabledAt: null,
      followersCount: null,
    };
  }

  const normalizedHandleOrWallet = handleOrWallet.toLowerCase();

  const [statementsResult, profileLogResult, followersResult] =
    await Promise.allSettled([
      fetchHeaderStatements(normalizedHandleOrWallet, headers),
      fetchHeaderProfileLog(normalizedHandleOrWallet, headers),
      fetchHeaderFollowersCount(profile.id, headers),
    ]);

  const statements =
    statementsResult.status === "fulfilled" ? statementsResult.value : [];

  const profileLog =
    profileLogResult.status === "fulfilled" ? profileLogResult.value : null;

  const profileEnabledAt = extractProfileEnabledAt(profileLog);

  const followersCount =
    followersResult.status === "fulfilled" ? followersResult.value : null;

  return {
    statements,
    profileEnabledAt,
    followersCount,
  };
}

export {
  fetchHeaderStatements,
  fetchHeaderProfileLog,
  fetchHeaderFollowersCount,
};
