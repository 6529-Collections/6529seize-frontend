import { useCallback, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { Page } from "../../../../../helpers/Types";
import { IDistribution } from "../../../../../entities/IDistribution";
import { commonApiFetch } from "../../../../../services/api/common-api";
import UserPageStatsActivityDistributionsTable from "./UserPageStatsActivityDistributionsTable";
import CommonTablePagination from "../../../../utils/CommonTablePagination";
import CommonCardSkeleton from "../../../../utils/animation/CommonCardSkeleton";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";
import UserPageStatsActivityDistributionsTableWrapper from "./UserPageStatsActivityDistributionsTableWrapper";

export default function UserPageStatsActivityDistributions({
  profile,
  activeAddress,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly activeAddress: string | null;
}) {
  const PAGE_SIZE = 10;

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const getWalletsParam = () =>
    [
      activeAddress?.toLowerCase() ??
        profile.consolidation.wallets.map((w) =>
          w.wallet.address.toLowerCase()
        ),
    ].join(",");

  const [walletsParam, setWalletsParam] = useState<string>(getWalletsParam());
  useEffect(() => {
    setWalletsParam(getWalletsParam());
    setPage(1);
  }, [activeAddress, profile]);

  const {
    isFetching,
    isLoading: isFirstLoading,
    data,
  } = useQuery<Page<IDistribution>>({
    queryKey: [
      QueryKey.PROFILE_DISTRIBUTIONS,
      {
        page_size: `${PAGE_SIZE}`,
        page,
        wallet: walletsParam,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<IDistribution>>({
        endpoint: "distributions",
        params: {
          page_size: `${PAGE_SIZE}`,
          page: `${page}`,
          wallet: walletsParam,
        },
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isFetching) return;
    if (!data?.count) {
      setPage(1);
      setTotalPages(1);
      return;
    }
    const totalPages = Math.ceil(data.count / PAGE_SIZE);
    if (totalPages < page) {
      setPage(1);
    }
    setTotalPages(totalPages);
  }, [data?.count, data?.page, isFetching]);

  return (
    <div className="tw-mt-4">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          Distributions
        </h3>
      </div>
      <UserPageStatsActivityDistributionsTableWrapper
        data={data?.data ?? []}
        profile={profile}
        isFirstLoading={isFirstLoading}
        loading={isFetching}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  );
}
