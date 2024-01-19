import { useEffect, useState } from "react";
import { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet";
import { IProfileAndConsolidations } from "../../../../../../entities/IProfile";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { Page } from "../../../../../../helpers/Types";
import { Transaction } from "../../../../../../entities/ITransaction";
import { commonApiFetch } from "../../../../../../services/api/common-api";
import { MEMES_CONTRACT } from "../../../../../../constants";
import UserPageStatsActivityWalletTable from "./UserPageStatsActivityWalletTable";
import CommonTablePagination from "../../../../../utils/CommonTablePagination";
import { MemeLite } from "../../../../settings/UserSettingsImgSelectMeme";

export default function UserPageStatsActivityWalletTableWrapper({
  filter,
  profile,
  activeAddress,
}: {
  readonly filter: UserPageStatsActivityWalletFilterType;
  readonly profile: IProfileAndConsolidations;
  readonly activeAddress: string | null;
}) {
  const FILTER_TO_PARAM: Record<UserPageStatsActivityWalletFilterType, string> =
    {
      [UserPageStatsActivityWalletFilterType.ALL]: "",
      [UserPageStatsActivityWalletFilterType.AIRDROPS]: "airdrops",
      [UserPageStatsActivityWalletFilterType.MINTS]: "mints",
      [UserPageStatsActivityWalletFilterType.SALES]: "sales",
      [UserPageStatsActivityWalletFilterType.PURCHASES]: "purchases",
      [UserPageStatsActivityWalletFilterType.TRANSFERS]: "transfers",
      [UserPageStatsActivityWalletFilterType.BURNS]: "burns",
    };

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

  useEffect(() => setPage(1), [filter]);

  const { isLoading, data } = useQuery<Page<Transaction>>({
    queryKey: [
      QueryKey.PROFILE_TRANSACTIONS,
      {
        contract: MEMES_CONTRACT,
        page_size: `${PAGE_SIZE}`,
        page,
        wallet: walletsParam,
        filter,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        contract: MEMES_CONTRACT,
        wallet: walletsParam,
        page_size: `${PAGE_SIZE}`,
        page: `${page}`,
      };

      if (filter) {
        params.filter = FILTER_TO_PARAM[filter];
      }

      return await commonApiFetch<Page<Transaction>>({
        endpoint: "transactions",
        params,
      });
    },
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

  const { data: memes } = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () => {
      const memesResponse = await commonApiFetch<{
        count: number;
        data: MemeLite[];
        next: string | null;
        page: number;
      }>({
        endpoint: "memes_lite",
      });
      return memesResponse.data;
    },
  });

  return (
    <div>
      {data?.data.length && memes?.length ? (
        <div className="tw-flow-root">
          <UserPageStatsActivityWalletTable
            transactions={data.data}
            profile={profile}
            memes={memes}
          />
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
        <div>No transactions</div>
      )}
    </div>
  );
}
