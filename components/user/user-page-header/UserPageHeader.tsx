"use server";

import { notFound } from "next/navigation";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CicStatement, ProfileActivityLog } from "@/entities/IProfile";
import { CountlessPage } from "@/helpers/Types";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";

import UserPageHeaderClient from "./UserPageHeaderClient";
import { getRandomColor } from "@/helpers/Helpers";
import {
  extractProfileEnabledAt,
} from "./userPageHeaderData";
import {
  fetchHeaderFollowersCount,
  fetchHeaderProfileLog,
  fetchHeaderStatements,
} from "./userPageHeaderPrefetch";

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly fallbackMainAddress: string;
  readonly initialStatements?: CicStatement[];
  readonly profileEnabledAt?: string | null;
  readonly followersCount?: number | null;
};

export default async function UserPageHeader({
  profile,
  handleOrWallet,
  fallbackMainAddress,
  initialStatements,
  profileEnabledAt,
  followersCount,
}: Readonly<Props>) {
  if (!handleOrWallet) {
    notFound();
  }

  const normalizedHandle = handleOrWallet.toLowerCase();

  let cachedHeaders: Record<string, string> | null = null;
  const ensureHeaders = async () => {
    if (cachedHeaders === null) {
      cachedHeaders = await getAppCommonHeaders();
    }
    return cachedHeaders;
  };

  const statementsPromise: Promise<CicStatement[]> =
    initialStatements === undefined
      ? fetchHeaderStatements(normalizedHandle, await ensureHeaders())
      : Promise.resolve(initialStatements ?? []);

  const profileLogPromise: Promise<CountlessPage<ProfileActivityLog> | null> =
    profileEnabledAt === undefined
      ? fetchHeaderProfileLog(normalizedHandle, await ensureHeaders())
      : Promise.resolve(null);

  const followersPromise: Promise<number | null> =
    followersCount === undefined
      ? fetchHeaderFollowersCount(profile.id, await ensureHeaders())
      : Promise.resolve(followersCount ?? null);

  const [statementsResult, profileLogResult, resolvedFollowersResult] =
    await Promise.allSettled([
      statementsPromise,
      profileLogPromise,
      followersPromise,
    ]);

  const statements: CicStatement[] =
    statementsResult.status === "fulfilled"
      ? statementsResult.value
      : initialStatements ?? [];

  const fetchedProfileLog: CountlessPage<ProfileActivityLog> | null =
    profileLogResult.status === "fulfilled" ? profileLogResult.value : null;

  const resolvedProfileEnabledAt =
    profileEnabledAt !== undefined
      ? profileEnabledAt
      : extractProfileEnabledAt(fetchedProfileLog);

  const resolvedFollowersCount =
    resolvedFollowersResult.status === "fulfilled"
      ? resolvedFollowersResult.value
      : followersCount ?? null;

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
      profileEnabledAt={resolvedProfileEnabledAt}
      followersCount={resolvedFollowersCount}
    />
  );
}
