import { IDistribution } from "../../../../../entities/IDistribution";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import CommonTablePagination from "../../../../utils/CommonTablePagination";
import CommonCardSkeleton from "../../../../utils/animation/CommonCardSkeleton";
import UserPageStatsActivityDistributionsTable from "./UserPageStatsActivityDistributionsTable";

export default function UserPageStatsActivityDistributionsTableWrapper({
  data,
  profile,
  isFirstLoading,
  loading,
  page,
  totalPages,
  setPage,
}: {
  readonly data: IDistribution[];
  readonly profile: IProfileAndConsolidations;
  readonly isFirstLoading: boolean;
  readonly loading: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly setPage: (page: number) => void;
}) {
  if (isFirstLoading) {
    return (
      <div className="tw-w-full tw-h-96">
        <CommonCardSkeleton />
      </div>
    );
  }

  return (
    <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl ">
      {data.length ? (
        <div className="tw-flow-root">
          <UserPageStatsActivityDistributionsTable
            items={data}
            profile={profile}
            loading={loading}
          />
          {totalPages > 1 && (
            <CommonTablePagination
              currentPage={page}
              setCurrentPage={setPage}
              totalPages={totalPages}
              small={false}
              loading={loading}
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
