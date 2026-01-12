import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import type { SortDirection } from "@/entities/ISort";
import type {
  ProfileRatersParamsOrderBy,
  ProfileRatersTableType,
} from "@/types/enums";
import ProfileRatersTableBody from "./ProfileRatersTableBody";
import ProfileRatersTableHeader from "./ProfileRatersTableHeader";

export default function ProfileRatersTable({
  ratings,
  type,
  order,
  orderBy,
  loading,
  totalPages,
  currentPage,
  setCurrentPage,
  onSortTypeClick,
  noRatingsMessage,
}: {
  readonly ratings: RatingWithProfileInfoAndLevel[];
  readonly type: ProfileRatersTableType;
  readonly order: SortDirection;
  readonly orderBy: ProfileRatersParamsOrderBy;
  readonly loading: boolean;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly onSortTypeClick: (type: ProfileRatersParamsOrderBy) => void;
  readonly noRatingsMessage: string;
}) {
  return (
    <>
      {ratings.length ? (
        <div className="tw-flow-root">
          <div className="tw-inline-block tw-min-w-full tw-pb-2 tw-align-middle">
            <table className="tw-min-w-full">
              <ProfileRatersTableHeader
                type={type}
                sortDirection={order}
                sortOrderBy={orderBy}
                isLoading={loading}
                onSortTypeClick={onSortTypeClick}
              />
              <ProfileRatersTableBody ratings={ratings} type={type} />
            </table>
          </div>

          {totalPages > 1 && (
            <CommonTablePagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              haveNextPage={currentPage < totalPages}
              small={true}
            />
          )}
        </div>
      ) : (
        <div className="tw-py-4">
          <span className="tw-px-4 tw-text-sm tw-italic tw-text-iron-500 sm:tw-px-6 sm:tw-text-md">
            {noRatingsMessage}
          </span>
        </div>
      )}
    </>
  );
}
