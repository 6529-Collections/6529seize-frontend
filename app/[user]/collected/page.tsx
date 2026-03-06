import { getAppMetadata } from "@/components/providers/metadata";
import { TransferProvider } from "@/components/nft-transfer/TransferState";
import UserPageCollected from "@/components/user/collected/UserPageCollected";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import { EMPTY_USER_PAGE_STATS_INITIAL_DATA } from "@/components/user/stats/userPageStats.types";
import { getUserPageStatsInitialData } from "@/components/user/stats/userPageStats.server";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { getMetadataForUserPage } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;

const PROBE_USER_SUFFIXES = [
  ".html",
  ".htm",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
] as const;

const normalizeSearchParams = (
  params?: UserSearchParams | URLSearchParams
): UserSearchParams => {
  if (!params) {
    return {};
  }

  if (params instanceof URLSearchParams) {
    return Array.from(params.entries()).reduce((acc, [key, value]) => {
      const existing = acc[key];
      if (existing === undefined) {
        acc[key] = value;
      } else if (Array.isArray(existing)) {
        acc[key] = [...existing, value];
      } else {
        acc[key] = [existing, value];
      }
      return acc;
    }, {} as UserSearchParams);
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as UserSearchParams);
};

const isNotFoundError = (error: unknown): boolean => {
  if (
    error === null ||
    error === undefined ||
    (typeof error !== "object" && typeof error !== "string")
  ) {
    return false;
  }

  const status =
    typeof error === "object"
      ? ((error as { status?: number | undefined }).status ??
        (error as { statusCode?: number | undefined }).statusCode ??
        (error as { response?: { status?: number | undefined } | undefined })
          .response?.status)
      : undefined;

  if (status === 404) {
    return true;
  }

  let message: string | undefined;

  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return !!message && message.toLowerCase().includes("not found");
};

const isProbeLikeUserSlug = (user: string): boolean => {
  const normalized = user.trim().toLowerCase();
  return PROBE_USER_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
};

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.COLLECTED];

async function Page({
  params,
  searchParams,
}: {
  readonly params?: Promise<UserRouteParams> | undefined;
  readonly searchParams?: Promise<UserSearchParams> | undefined;
}) {
  const resolvedParams = params ? await params : undefined;
  if (!resolvedParams?.user) {
    return notFound();
  }

  const user = resolvedParams.user;
  if (isProbeLikeUserSlug(user)) {
    return notFound();
  }

  const normalizedUser = user.toLowerCase();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = normalizeSearchParams(resolvedSearchParams);
  const headers = await getAppCommonHeaders();
  const profile: ApiIdentity = await getUserProfile({
    user: normalizedUser,
    headers,
  }).catch((error: unknown) => {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  });

  const needsRedirect = userPageNeedsRedirect({
    profile,
    req: { query: { ...query, user } },
    subroute: TAB_CONFIG.route,
  });

  if (needsRedirect) {
    redirect(needsRedirect.redirect.destination);
  }

  const initialStatsData = await getUserPageStatsInitialData({
    profile,
    activeAddress: query["address"],
  }).catch((error: unknown) => {
    if (
      error instanceof Error &&
      error.message === "getStatsPath: no wallet available on profile"
    ) {
      return EMPTY_USER_PAGE_STATS_INITIAL_DATA;
    }

    throw error;
  });

  return (
    <TransferProvider>
      <UserPageLayout profile={profile} handleOrWallet={normalizedUser}>
        <UserPageCollected
          profile={profile}
          initialStatsData={initialStatsData}
        />
      </UserPageLayout>
    </TransferProvider>
  );
}

async function generateMetadata({
  params,
}: {
  readonly params?: Promise<UserRouteParams> | undefined;
}): Promise<Metadata> {
  const resolvedParams = params ? await params : undefined;
  if (!resolvedParams?.user) {
    return notFound();
  }

  if (isProbeLikeUserSlug(resolvedParams.user)) {
    return notFound();
  }

  const normalizedUser = resolvedParams.user.toLowerCase();
  const headers = await getAppCommonHeaders();
  const profile: ApiIdentity = await getUserProfile({
    user: normalizedUser,
    headers,
  }).catch((error: unknown) => {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  });

  return getAppMetadata(getMetadataForUserPage(profile, TAB_CONFIG.metaLabel));
}

export default Page;
export { generateMetadata };
