"use client";
import type { ProfileActivityLog } from "@/entities/IProfile";
import type { CountlessPage } from "@/helpers/Types";
import ProfileActivityLogsList from "./list/ProfileActivityLogsList";
import ProfileActivityLogsSkeleton from "./ProfileActivityLogsSkeleton";
import CommonTablePagination from "../utils/table/paginator/CommonTablePagination";
import { PROFILE_ACTIVITY_META } from "./profileActivityTypography";

export default function ProfileActivityLogsResults({
  logs,
  user,
  currentPage,
  setCurrentPage,
  loading = false,
}: {
  readonly logs: CountlessPage<ProfileActivityLog> | undefined;
  readonly user: string | null;
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly loading?: boolean;
}) {
  return logs ? (
    <div>
      {logs.data.length ? (
        <div className="tw-flow-root tw-scroll-py-3 tw-overflow-x-auto tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <ProfileActivityLogsList logs={logs.data} user={user} />
          <CommonTablePagination
            loading={loading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={null}
            haveNextPage={logs.next}
            small={!!user}
            showTopBorder={false}
            className="tw-pt-6"
          />
        </div>
      ) : (
        <div className="tw-py-4">
          <span
            className={`${
              user ? "tw-px-2 sm:tw-px-3" : ""
            } tw-text-sm tw-font-normal tw-italic tw-text-iron-500 ${PROFILE_ACTIVITY_META}`}
          >
            No Activity Log
          </span>
        </div>
      )}
    </div>
  ) : (
    <ProfileActivityLogsSkeleton />
  );
}
