import { notFound } from "next/navigation";
import { cache } from "react";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ProfileActivityLog } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import type { CountlessPage } from "@/helpers/Types";
import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { loadProfileStatements } from "@/helpers/user-page.server";
import { commonApiFetch } from "@/services/api/common-api";

import UserPageHeaderClient from "./UserPageHeaderClient";
import { getRandomColor } from "@/helpers/Helpers";
import { getProfileCmsPrimarySite } from "@/lib/profile-cms/runtime/fetcher";
import { getCmsPublicPath } from "@/lib/profile-cms/runtime/routes";

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

async function fetchFollowers(
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

  return response;
}

function extractProfileEnabledAt(
  logPage: CountlessPage<ProfileActivityLog> | null
): string | null {
  if (!logPage?.data.length) {
    return null;
  }
  const createdAt = logPage.data[0]?.created_at;
  if (!createdAt) {
    return null;
  }
  return new Date(createdAt).toISOString();
}

// Layout and page share these request-local reads. Pages continue refreshing the
// data on navigation even though the header's DOM now belongs to the layout.
export const getUserPageHeaderState = cache(
  async (
    normalizedHandle: string,
    profileId: string | null,
    cmsHandle: string | null
  ) => {
    const queryClient = new QueryClient();
    const headers = await getAppCommonHeaders();
    const updatedAt = Date.now();
    await Promise.allSettled([
      // Shared with generateMetadata's public bio lookup in the same request.
      loadProfileStatements(normalizedHandle).then((data) => {
        return queryClient.setQueryData(
          [QueryKey.PROFILE_CIC_STATEMENTS, normalizedHandle],
          data,
          { updatedAt }
        );
      }),
      fetchProfileEnabledLog(normalizedHandle, headers).then((data) => {
        return queryClient.setQueryData(
          [QueryKey.PROFILE_HEADER, normalizedHandle, "enabledAt"],
          extractProfileEnabledAt(data),
          { updatedAt }
        );
      }),
      fetchFollowers(profileId, headers).then((data) => {
        if (data !== null) {
          return queryClient.setQueryData(
            [
              QueryKey.IDENTITY_FOLLOWERS,
              { profile_id: profileId, page_size: 1 },
            ],
            data,
            { updatedAt }
          );
        }
        return null;
      }),
      (cmsHandle
        ? getProfileCmsPrimarySite({ handle: cmsHandle, headers })
        : Promise.resolve(null)
      ).then((site) => {
        return queryClient.setQueryData(
          [QueryKey.PROFILE_HEADER, normalizedHandle, "cmsWebsiteHref"],
          site
            ? getCmsPublicPath(site.cmsPackage, site.cmsPackage.site.base_path)
            : null,
          { updatedAt }
        );
      }),
    ]);
    return dehydrate(queryClient);
  }
);

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

  const normalizedHandle = handleOrWallet.toLowerCase();
  const cmsHandle = profile.handle?.toLowerCase() ?? null;
  const state = await getUserPageHeaderState(
    normalizedHandle,
    profile.id,
    cmsHandle
  );
  const defaultBanner1 = getRandomColor();
  const defaultBanner2 = getRandomColor();

  return (
    <HydrationBoundary state={state}>
      <UserPageHeaderClient
        profile={profile}
        handleOrWallet={normalizedHandle}
        fallbackMainAddress={fallbackMainAddress}
        defaultBanner1={defaultBanner1}
        defaultBanner2={defaultBanner2}
        initialStatements={[]}
        profileEnabledAt={null}
        followersCount={null}
        cmsWebsiteHref={null}
      />
    </HydrationBoundary>
  );
}
