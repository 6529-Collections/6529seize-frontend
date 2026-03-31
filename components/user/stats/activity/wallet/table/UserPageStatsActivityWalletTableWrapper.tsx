import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import CommonCardSkeleton from "@/components/utils/animation/CommonCardSkeleton";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import type { NextGenCollection } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageStatsActivityWalletFilter from "../filter/UserPageStatsActivityWalletFilter";
import { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet.types";
import UserPageStatsActivityWalletTable from "./UserPageStatsActivityWalletTable";
export default function UserPageStatsActivityWalletTableWrapper({
  filter,
  profile,
  transactions,
  memes,
  memeLab,
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
  readonly memes: NFTLite[];
  readonly memeLab: NFTLite[];
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
      <div className="tw-mt-2 tw-h-96 tw-w-full sm:tw-mt-4">
        <CommonCardSkeleton />
      </div>
    );
  }

  return (
    <div className="tw-mt-2 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 lg:tw-mt-4">
      <div className="tw-mt-6 tw-inline-flex tw-w-full tw-items-center tw-justify-between tw-space-x-4 tw-px-4 sm:tw-px-6">
        <UserPageStatsActivityWalletFilter
          activeFilter={filter}
          setActiveFilter={onActiveFilter}
        />
        {loading && <CircleLoader />}
      </div>
      <div>
        {transactions.length ? (
          <div className="tw-flow-root tw-scroll-py-3 tw-overflow-auto">
            <UserPageStatsActivityWalletTable
              transactions={transactions}
              profile={profile}
              memes={memes}
              memeLab={memeLab}
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
          <div className="tw-px-4 tw-py-4 tw-text-sm tw-italic tw-text-iron-500 sm:tw-px-6 sm:tw-text-base">
            {FILTER_TO_NO_DATA[filter]}
          </div>
        )}
      </div>
    </div>
  );
}
