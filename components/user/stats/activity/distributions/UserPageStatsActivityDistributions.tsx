"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { Distribution } from "@/entities/IDistribution";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  ACTIVITY_PAGE_SIZE,
  getActivityDetailsPageFilter,
  getActivityPaginationState,
  getActivityWalletsParam,
  WALLET_DISTRIBUTION_PAGE_PARAM,
} from "../activity.helpers";
import { getDistributionsMessage } from "./distributions.messages";
import UserPageStatsActivityDistributionsTableWrapper from "./UserPageStatsActivityDistributionsTableWrapper";

export default function UserPageStatsActivityDistributions({
  profile,
  activeAddress,
  locale = DEFAULT_LOCALE,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly locale?: SupportedLocale | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFilter = getActivityDetailsPageFilter({
    pageParam: WALLET_DISTRIBUTION_PAGE_PARAM,
    searchParams,
  });

  const createQueryString = useCallback(
    (
      config: {
        name: string;
        value: string;
      }[]
    ): string => {
      const params = new URLSearchParams(searchParams.toString());
      for (const { name, value } of config) {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const onPageFilter = useCallback(
    (nextPage: number) => {
      router.replace(
        `${pathname}?${createQueryString([
          { name: WALLET_DISTRIBUTION_PAGE_PARAM, value: `${nextPage}` },
        ])}`,
        { scroll: false }
      );
    },
    [createQueryString, pathname, router]
  );

  const walletsParam = useMemo(
    () =>
      getActivityWalletsParam({
        activeAddress,
        wallets: profile.wallets,
      }),
    [activeAddress, profile.wallets]
  );

  const {
    isFetching,
    isLoading: isFirstLoading,
    data,
  } = useQuery<Page<Distribution>>({
    queryKey: [
      QueryKey.PROFILE_DISTRIBUTIONS,
      {
        page_size: `${ACTIVITY_PAGE_SIZE}`,
        page: `${pageFilter}`,
        wallet: walletsParam,
      },
    ],
    queryFn: () =>
      commonApiFetch<Page<Distribution>>({
        endpoint: "distributions",
        params: {
          page_size: `${ACTIVITY_PAGE_SIZE}`,
          page: `${pageFilter}`,
          wallet: walletsParam,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const { currentPage, totalPages } = getActivityPaginationState({
    count: data?.count,
    page: data?.page,
    pageFilter,
    pageSize: ACTIVITY_PAGE_SIZE,
  });

  return (
    <div className="tw-mt-4 md:tw-mt-5">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {getDistributionsMessage(
            "user.collected.stats.distributions.title",
            undefined,
            locale
          )}
        </h3>
      </div>
      <UserPageStatsActivityDistributionsTableWrapper
        data={data?.data ?? []}
        profile={profile}
        isFirstLoading={isFirstLoading}
        loading={isFetching}
        page={currentPage}
        totalPages={totalPages}
        setPage={onPageFilter}
        locale={locale}
      />
    </div>
  );
}
