import { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet";
import { IProfileAndConsolidations } from "../../../../../../entities/IProfile";
import { Transaction } from "../../../../../../entities/ITransaction";
import UserPageStatsActivityWalletTable from "./UserPageStatsActivityWalletTable";
import CommonTablePagination from "../../../../../utils/CommonTablePagination";
import { MemeLite } from "../../../../settings/UserSettingsImgSelectMeme";
import UserPageStatsActivityWalletFilter from "../filter/UserPageStatsActivityWalletFilter";
import CommonCardSkeleton from "../../../../../utils/animation/CommonCardSkeleton";
import CircleLoader from "../../../../../distribution-plan-tool/common/CircleLoader";

export default function UserPageStatsActivityWalletTableWrapper({
  filter,
  profile,
  transactions,
  memes,
  totalPages,
  page,
  isFirstLoading,
  loading,
  setPage,
  onActiveFilter,
}: {
  readonly filter: UserPageStatsActivityWalletFilterType;
  readonly profile: IProfileAndConsolidations;
  readonly transactions: Transaction[];
  readonly memes: MemeLite[];
  readonly totalPages: number;
  readonly page: number;
  readonly isFirstLoading: boolean;
  readonly loading: boolean;
  readonly setPage: (page: number) => void;
  readonly onActiveFilter: (
    filter: UserPageStatsActivityWalletFilterType
  ) => void;
}) {
  const FILTER_TO_NO_DATA: Record<
    UserPageStatsActivityWalletFilterType,
    string
  > = {
    [UserPageStatsActivityWalletFilterType.ALL]: "No transactions",
    [UserPageStatsActivityWalletFilterType.AIRDROPS]: "No airdrops",
    [UserPageStatsActivityWalletFilterType.MINTS]: "No mints",
    [UserPageStatsActivityWalletFilterType.SALES]: "No sales",
    [UserPageStatsActivityWalletFilterType.PURCHASES]: "No purchases",
    [UserPageStatsActivityWalletFilterType.TRANSFERS]: "No transfers",
    [UserPageStatsActivityWalletFilterType.BURNS]: "No burns",
  };

  if (isFirstLoading) {
    return (
      <div className="tw-mt-2 sm:tw-mt-4 tw-w-full tw-h-96">
        <CommonCardSkeleton />
      </div>
    );
  }

  return (
    <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
      <div className="tw-w-full tw-inline-flex tw-justify-between tw-space-x-4 tw-items-center tw-px-4 sm:tw-px-6 tw-mt-6">
        <UserPageStatsActivityWalletFilter
          activeFilter={filter}
          setActiveFilter={onActiveFilter}
        />
        {loading && <CircleLoader />}
      </div>
      <div>
        {transactions.length && memes?.length ? (
          <div className="tw-flow-root tw-scroll-py-3 tw-overflow-auto">
            <UserPageStatsActivityWalletTable
              transactions={transactions}
              profile={profile}
              memes={memes}
            />
            {totalPages > 1 && (
              <CommonTablePagination
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={totalPages}
                small={true}
                loading={loading}
              />
            )}
          </div>
        ) : (
          <div className="tw-py-4 tw-px-4 sm:tw-px-6 tw-text-sm tw-italic tw-text-iron-500">
            {FILTER_TO_NO_DATA[filter]}
          </div>
        )}
      </div>
    </div>
  );
}
