"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";

const STALE_TIME = 5 * 60 * 1000;

export default function TopRaterAvatars({
  handleOrWallet,
  category,
  count = 5,
  size = "sm",
}: {
  readonly handleOrWallet: string;
  readonly category?: string;
  readonly count?: number;
  readonly size?: "sm" | "md";
}) {
  const params: Record<string, string> = {
    page: "1",
    page_size: `${count}`,
    order: "desc",
    order_by: "rating",
    given: "false",
  };
  if (category) {
    params["category"] = category;
  }

  const { data: ratersPage } = useQuery<Page<RatingWithProfileInfoAndLevel>>({
    queryKey: [
      QueryKey.PROFILE_RATERS,
      { handleOrWallet: handleOrWallet.toLowerCase(), category, count },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
        endpoint: `profiles/${handleOrWallet}/rep/ratings/by-rater`,
        params,
      }),
    enabled: !!handleOrWallet,
    staleTime: STALE_TIME,
  });

  const raterHandles = ratersPage?.data.map((r) => r.handle) ?? [];

  const identityQueries = useQueries({
    queries: raterHandles.map((handle) => ({
      queryKey: [QueryKey.PROFILE, handle.toLowerCase()],
      queryFn: async () =>
        await commonApiFetch<ApiIdentity>({
          endpoint: `identities/${handle.toLowerCase()}`,
        }),
      enabled: !!handle,
      staleTime: STALE_TIME,
    })),
  });

  const items = identityQueries
    .filter((q) => q.data)
    .map((q) => {
      const identity = q.data!;
      return {
        key: identity.handle ?? identity.primary_wallet ?? "",
        pfpUrl: identity.pfp ?? null,
        href: `/${identity.handle ?? identity.primary_wallet}`,
        ariaLabel: identity.handle ?? identity.primary_wallet ?? "Profile",
        fallback: identity.handle
          ? identity.handle.charAt(0).toUpperCase()
          : "?",
        title: identity.handle ?? identity.primary_wallet ?? undefined,
      };
    });

  if (items.length === 0) {
    return null;
  }

  return <OverlappingAvatars items={items} size={size} maxCount={count} />;
}
