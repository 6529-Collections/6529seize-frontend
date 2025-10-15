"use server";

import { notFound } from "next/navigation";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CicStatement, ProfileActivityLog } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import { CountlessPage } from "@/helpers/Types";
import { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getProfileCicStatements } from "@/helpers/server.helpers";
import { commonApiFetch } from "@/services/api/common-api";

import UserPageHeaderClient from "./UserPageHeaderClient";
import { getRandomColor } from "@/helpers/Helpers";

async function fetchProfileEnabledLog(
  handleOrWallet: string,
  headers: Record<string, string>
) {
  return await commonApiFetch<CountlessPage<ProfileActivityLog>>({
    endpoint: "profile-logs",
    params: {
      profile: handleOrWallet,
      log_type: "PROFILE_CREATED",
      page_size: "1",
      sort: "created_at",
      sort_direction: SortDirection.ASC,
    },
    headers,
  });
}

async function fetchFollowersCount(
  profileId: string | number | null | undefined,
  headers: Record<string, string>
) {
  if (!profileId) {
    return null;
  }

  const response = await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
    endpoint: `identity-subscriptions/incoming/IDENTITY/${profileId}`,
    params: {
      page_size: "1",
    },
    headers,
  });

  return response.count ?? null;
}

function extractProfileEnabledAt(
  logPage: CountlessPage<ProfileActivityLog> | null
): string | null {
  if (!logPage?.data?.length) {
    return null;
  }
  const createdAt = logPage.data[0]?.created_at;
  if (!createdAt) {
    return null;
  }
  return new Date(createdAt).toISOString();
}

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly fallbackMainAddress: string;
  readonly initialStatements?: CicStatement[];
};

export default async function UserPageHeader({
  profile,
  handleOrWallet,
  fallbackMainAddress,
  initialStatements,
}: Readonly<Props>) {
  if (!handleOrWallet) {
    notFound();
  }

  const headers = await getAppCommonHeaders();
  const normalizedHandle = handleOrWallet.toLowerCase();

  const statementsPromise = initialStatements
    ? Promise.resolve(initialStatements)
    : getProfileCicStatements({
        handleOrWallet: normalizedHandle,
        headers,
      });

  const [statementsResult, profileLogResult, followersResult] =
    await Promise.allSettled([
      statementsPromise,
      fetchProfileEnabledLog(normalizedHandle, headers),
      fetchFollowersCount(profile.id, headers),
    ]);

  const statements: CicStatement[] =
    statementsResult.status === "fulfilled"
      ? statementsResult.value
      : initialStatements ?? [];

  const profileLog: CountlessPage<ProfileActivityLog> | null =
    profileLogResult.status === "fulfilled" ? profileLogResult.value : null;

  const defaultBanner1 = getRandomColor();
  const defaultBanner2 = getRandomColor();

  return (
    <UserPageHeaderClient
      profile={profile}
      handleOrWallet={normalizedHandle}
      fallbackMainAddress={fallbackMainAddress}
      defaultBanner1={defaultBanner1}
      defaultBanner2={defaultBanner2}
      initialStatements={statements}
      profileEnabledAt={extractProfileEnabledAt(profileLog)}
      followersCount={
        followersResult.status === "fulfilled" ? followersResult.value : null
      }
    />
  );
}
