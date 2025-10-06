import { Distribution } from "@/entities/IDistribution";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import CommonCardSkeleton from "@/components/utils/animation/CommonCardSkeleton";
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
  readonly data: Distribution[];
  readonly profile: ApiIdentity;
  readonly isFirstLoading: boolean;
  readonly loading: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly setPage: (page: number) => void;
}) {
  if (isFirstLoading) {
    return (
      <div className="tw-mt-2 sm:tw-mt-4 tw-w-full tw-h-96">
        <CommonCardSkeleton />
      </div>
    );
  }

  return (
    <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-950 tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-x-auto">
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
              haveNextPage={page < totalPages}
              small={true}
              loading={loading}
            />
          )}
        </div>
      ) : (
        <div className="tw-p-4 sm:tw-px-6 tw-text-sm tw-italic tw-text-iron-500">
          No distributions found
        </div>
      )}
    </div>
  );
}
