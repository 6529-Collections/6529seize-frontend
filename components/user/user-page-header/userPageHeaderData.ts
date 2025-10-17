import { CountlessPage } from "@/helpers/Types";
import { SortDirection } from "@/entities/ISort";
import { ProfileActivityLog } from "@/entities/IProfile";
import { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { withServerTiming } from "@/helpers/performance.helpers";
import { commonApiFetch } from "@/services/api/common-api";

type Headers = Record<string, string>;

export async function fetchProfileEnabledLog({
  handleOrWallet,
  headers,
}: {
  readonly handleOrWallet: string;
  readonly headers: Headers;
}): Promise<CountlessPage<ProfileActivityLog>> {
  return await withServerTiming(
    `identity-profile-log:${handleOrWallet}`,
    async () =>
      await commonApiFetch<CountlessPage<ProfileActivityLog>>({
        endpoint: "profile-logs",
        params: {
          profile: handleOrWallet,
          log_type: "PROFILE_CREATED",
          page_size: "1",
          sort: "created_at",
          sort_direction: SortDirection.ASC,
        },
        headers,
      })
  );
}

export async function fetchFollowersCount({
  profileId,
  headers,
}: {
  readonly profileId: string | number | null | undefined;
  readonly headers: Headers;
}): Promise<number | null> {
  if (!profileId) {
    return null;
  }

  const response = await withServerTiming(
    `identity-followers:${profileId}`,
    async () =>
      await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `identity-subscriptions/incoming/IDENTITY/${profileId}`,
        params: {
          page_size: "1",
        },
        headers,
      })
  );

  return response.count ?? null;
}

export function extractProfileEnabledAt(
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
