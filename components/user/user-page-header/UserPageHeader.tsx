"use server";

import { notFound } from "next/navigation";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CicStatement } from "@/entities/IProfile";
import { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";

import UserPageHeaderClient from "./UserPageHeaderClient";
import { getRandomColor } from "@/helpers/Helpers";

async function fetchStatements(
  handleOrWallet: string,
  headers: Record<string, string>
) {
  return await commonApiFetch<CicStatement[]>({
    endpoint: `profiles/${handleOrWallet}/cic/statements`,
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

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly fallbackMainAddress: string;
};

export default async function UserPageHeader({
  profile,
  handleOrWallet,
  fallbackMainAddress,
}: Readonly<Props>) {
  if (!handleOrWallet) {
    notFound();
  }

  const headers = await getAppCommonHeaders();
  const normalizedHandle = handleOrWallet.toLowerCase();

  const shouldLogHeaderFetch = process.env.NODE_ENV !== "production";
  const headerFetchStart = shouldLogHeaderFetch ? Date.now() : 0;

  const [statementsResult, followersResult] = await Promise.allSettled([
    fetchStatements(normalizedHandle, headers),
    fetchFollowersCount(profile.id, headers),
  ]);

  if (shouldLogHeaderFetch) {
    const duration = Date.now() - headerFetchStart;
    console.log(
      `[SSR][UserPageHeader] data fetch ${normalizedHandle} (statements:${statementsResult.status}, followers:${followersResult.status}) in ${duration}ms`
    );
  }

  const statements: CicStatement[] =
    statementsResult.status === "fulfilled" ? statementsResult.value : [];

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
      initialProfileEnabledAt={null}
      followersCount={
        followersResult.status === "fulfilled" ? followersResult.value : null
      }
    />
  );
}
