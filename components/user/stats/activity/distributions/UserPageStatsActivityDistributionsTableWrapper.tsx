import type { Distribution } from "@/entities/IDistribution";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import CommonCardSkeleton from "@/components/utils/animation/CommonCardSkeleton";
import { UserPageStatsTableScroll } from "@/components/user/stats/UserPageStatsTableShared";
import { getDistributionsMessage } from "./distributions.messages";
import UserPageStatsActivityDistributionsTable from "./UserPageStatsActivityDistributionsTable";

export default function UserPageStatsActivityDistributionsTableWrapper({
  data,
  profile,
  isFirstLoading,
  loading,
  page,
  totalPages,
  setPage,
  locale = DEFAULT_LOCALE,
}: {
  readonly data: Distribution[];
  readonly profile: ApiIdentity;
  readonly isFirstLoading: boolean;
  readonly loading: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly setPage: (page: number) => void;
  readonly locale?: SupportedLocale | undefined;
}) {
  if (isFirstLoading) {
    return (
      <div className="tw-mt-2 tw-h-96 tw-w-full sm:tw-mt-4">
        <CommonCardSkeleton />
      </div>
    );
  }

  return (
    <div className="tw-mt-2 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.02] lg:tw-mt-4">
      {data.length ? (
        <div className="tw-flow-root">
          <UserPageStatsTableScroll
            label={getDistributionsMessage(
              "user.collected.stats.distributions.tableCaption",
              undefined,
              locale
            )}
          >
            <UserPageStatsActivityDistributionsTable
              items={data}
              profile={profile}
              loading={loading}
              locale={locale}
            />
          </UserPageStatsTableScroll>
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
        <output className="tw-p-4 tw-text-sm tw-italic tw-text-iron-500 sm:tw-px-6">
          {getDistributionsMessage(
            "user.collected.stats.distributions.empty",
            undefined,
            locale
          )}
        </output>
      )}
    </div>
  );
}
