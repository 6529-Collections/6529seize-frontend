import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { MemeLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import CommonCardSkeleton from "@/components/utils/animation/CommonCardSkeleton";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageStatsActivityWalletFilter from "../filter/UserPageStatsActivityWalletFilter";
import { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet";
import UserPageStatsActivityWalletTable from "./UserPageStatsActivityWalletTable";
export default function UserPageStatsActivityWalletTableWrapper({
  filter,
  profile,
  transactions,
  memes,
  nextgenCollections,
  totalPages,
  page,
  isFirstLoading,
  loading,
  setPage,
  onActiveFilter,
}: {
  readonly filter: UserPageStatsActivityWalletFilterType;
  readonly profile: ApiIdentity;
  readonly transactions: Transaction[];
  readonly memes: MemeLite[];
  readonly nextgenCollections: NextGenCollection[];
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
    <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-950 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
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
              nextgenCollections={nextgenCollections}
            />
            {totalPages > 1 && (
              <CommonTablePagination
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={totalPages}
                haveNextPage={page < totalPages}
                small={true}
                loading={loading}
              />
            )}
          </div>
        ) : (
          <div className="tw-py-4 tw-px-4 sm:tw-px-6 tw-text-sm sm:tw-text-base tw-italic tw-text-iron-500">
            {FILTER_TO_NO_DATA[filter]}
          </div>
        )}
      </div>
    </div>
  );
}
