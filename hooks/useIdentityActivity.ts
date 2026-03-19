import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { UserPageBrainActivityResponse } from "@/components/user/brain/userPageBrainActivity.helpers";
import { Time } from "@/helpers/time";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

interface UseIdentityActivityOptions {
  readonly identity: string | null | undefined;
  readonly enabled?: boolean | undefined;
}

export function useIdentityActivity({
  identity,
  enabled = true,
}: Readonly<UseIdentityActivityOptions>) {
  const normalizedIdentity = identity?.trim() ?? "";
  const canonicalIdentity = normalizedIdentity.toLowerCase();

  return useQuery<UserPageBrainActivityResponse, Error>({
    queryKey: [QueryKey.IDENTITY_ACTIVITY, canonicalIdentity],
    queryFn: async () => {
      if (!canonicalIdentity) {
        throw new Error("Identity is required to fetch brain activity");
      }

      return await commonApiFetch<UserPageBrainActivityResponse>({
        endpoint: `identities/${encodeURIComponent(canonicalIdentity)}/activity`,
      });
    },
    enabled: enabled && canonicalIdentity.length > 0,
    staleTime: Time.minutes(15).toMillis(),
    gcTime: Time.hours(1).toMillis(),
    refetchOnWindowFocus: false,
    ...getDefaultQueryRetry(),
  });
}
