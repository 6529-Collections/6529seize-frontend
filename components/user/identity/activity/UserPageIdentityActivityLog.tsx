import { useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfileActivityLogType,
} from "../../../../entities/IProfile";
import UserPageIdentityActivityLogHeader from "./UserPageIdentityActivityLogHeader";
import UserPageIdentityActivityLogFilter from "./filter/UserPageIdentityActivityLogFilter";
import { Page } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import UserPageIdentityActivityLogList from "./list/UserPageIdentityActivityLogList";
import UserPageIdentityPagination from "../utils/UserPageIdentityPagination";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";

const PAGE_SIZE = 10;

export default function UserPageIdentityActivityLog({
  profile,
  profileActivityLogs: initialPageActivityLogs,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly profileActivityLogs: Page<ProfileActivityLog>;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const [selectedFilters, setSelectedFilters] = useState<
    ProfileActivityLogType[]
  >([]);

  const onFilter = (filter: ProfileActivityLogType) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const [logTypeParams, setLogTypeParams] = useState<string>("");
  useEffect(() => {
    if (!selectedFilters.length) {
      setLogTypeParams("");
      return;
    }
    setLogTypeParams(selectedFilters.map((f) => f.toLowerCase()).join(","));
  }, [selectedFilters]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const {
    isLoading,
    data: logs,
  } = useQuery<Page<ProfileActivityLog>>({
    queryKey: [
      QueryKey.PROFILE_LOGS,
      {
        profile: user.toLowerCase(),
        page: currentPage,
        page_size: PAGE_SIZE,
        log_type: logTypeParams,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<ProfileActivityLog>>({
        endpoint: `profile-logs`,
        params: {
          profile: user.toLowerCase(),
          page: `${currentPage}`,
          page_size: `${PAGE_SIZE}`,
          log_type: logTypeParams,
        },
      }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    initialData: () =>
      currentPage === 1 && !logTypeParams.length
        ? initialPageActivityLogs
        : undefined,
  });

  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isLoading) return;
    if (!logs?.count) {
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(logs.count / PAGE_SIZE));
  }, [logs?.count, logs?.page, isLoading]);

  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <UserPageIdentityActivityLogHeader profile={profile} />
      <div className="tw-min-h-[28rem] tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-auto">
        {!!(logs?.data.length ?? selectedFilters.length) && (
          <UserPageIdentityActivityLogFilter
            selected={selectedFilters}
            setSelected={onFilter}
          />
        )}
        {logs?.data.length ? (
          <div className="tw-flow-root">
            <div className="tw-overflow-x-auto">
              <UserPageIdentityActivityLogList
                logs={logs.data}
                profile={profile}
              />
              {totalPages > 1 && (
                <UserPageIdentityPagination
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={totalPages}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="tw-mt-4">
            <span className="tw-px-6 md:tw-px-8 tw-text-sm tw-italic tw-text-iron-500">
              No Activity Log
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
