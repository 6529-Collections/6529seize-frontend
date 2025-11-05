"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { Distribution } from "@/entities/IDistribution";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WALLET_DISTRIBUTION_PAGE_PARAM } from "../UserPageActivityWrapper";
import UserPageStatsActivityDistributionsTableWrapper from "./UserPageStatsActivityDistributionsTableWrapper";

export default function UserPageStatsActivityDistributions({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const PAGE_SIZE = 10;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = searchParams?.get(WALLET_DISTRIBUTION_PAGE_PARAM);

  const [pageFilter, setPageFilter] = useState(
    page && !isNaN(+page) ? +page : 1
  );

  useEffect(() => {
    setPageFilter(page && !isNaN(+page) ? +page : 1);
  }, [page]);

  const createQueryString = (
    config: {
      name: string;
      value: string;
    }[]
  ): string => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    for (const { name, value } of config) {
      params.set(name, value);
    }
    return params.toString();
  };

  const onPageFilter = (page: number) => {
    router.replace(
      `${pathname}?${createQueryString([
        { name: WALLET_DISTRIBUTION_PAGE_PARAM, value: `${page}` },
      ])}`,
      { scroll: false }
    );
  };

  const [totalPages, setTotalPages] = useState<number>(1);

  const getWalletsParam = () =>
    [
      activeAddress?.toLowerCase() ??
        profile.wallets?.map((w) => w.wallet.toLowerCase()),
    ].join(",");

  const [walletsParam, setWalletsParam] = useState<string>(getWalletsParam());
  useEffect(() => {
    setWalletsParam(getWalletsParam());
  }, [activeAddress, profile]);

  const {
    isFetching,
    isLoading: isFirstLoading,
    data,
  } = useQuery<Page<Distribution>>({
    queryKey: [
      QueryKey.PROFILE_DISTRIBUTIONS,
      {
        page_size: `${PAGE_SIZE}`,
        page: `${pageFilter}`,
        wallet: walletsParam,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<Distribution>>({
        endpoint: "distributions",
        params: {
          page_size: `${PAGE_SIZE}`,
          page: `${pageFilter}`,
          wallet: walletsParam,
        },
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isFetching) return;
    if (!data?.count) {
      onPageFilter(1);
      setTotalPages(1);
      return;
    }
    const totalPages = Math.ceil(data.count / PAGE_SIZE);
    if (totalPages < pageFilter) {
      onPageFilter(totalPages);
    }
    setTotalPages(totalPages);
  }, [data?.count, data?.page, isFetching]);

  return (
    <div className="tw-mt-4 md:tw-mt-5">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          Distributions
        </h3>
      </div>
      <UserPageStatsActivityDistributionsTableWrapper
        data={data?.data ?? []}
        profile={profile}
        isFirstLoading={isFirstLoading}
        loading={isFetching}
        page={pageFilter}
        totalPages={totalPages}
        setPage={onPageFilter}
      />
    </div>
  );
}
