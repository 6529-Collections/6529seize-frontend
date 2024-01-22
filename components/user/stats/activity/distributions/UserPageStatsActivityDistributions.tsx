import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { Page } from "../../../../../helpers/Types";
import { IDistribution } from "../../../../../entities/IDistribution";
import { commonApiFetch } from "../../../../../services/api/common-api";
import UserPageStatsActivityDistributionsTable from "./UserPageStatsActivityDistributionsTable";
import CommonTablePagination from "../../../../utils/CommonTablePagination";

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

  const { isLoading, data } = useQuery<Page<IDistribution>>({
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
    if (isLoading) return;
    if (!data?.count) {
      setPage(1);
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(data.count / PAGE_SIZE));
  }, [data?.count, data?.page, isLoading]);

  return (
    <div className="tw-mt-4">
      {data?.data.length ? (
        <div className="tw-flow-root">
          <UserPageStatsActivityDistributionsTable items={data.data} />
          {totalPages > 1 && (
            <CommonTablePagination
              currentPage={page}
              setCurrentPage={setPage}
              totalPages={totalPages}
              small={false}
            />
          )}
        </div>
      ) : (
        <div className="tw-text-sm tw-italic tw-text-iron-500">
          No distributions
        </div>
      )}
    </div>
  );
}
