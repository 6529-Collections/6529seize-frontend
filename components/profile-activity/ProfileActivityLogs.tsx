import { useEffect, useState } from "react";
import {
  ProfileActivityLog,
  ProfileActivityLogType,
} from "../../entities/IProfile";
import { Page } from "../../helpers/Types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import ProfileActivityLogsFilter from "./filter/ProfileActivityLogsFilter";
import ProfileActivityLogsList from "./list/ProfileActivityLogsList";
import UserPageIdentityPagination from "../user/identity/utils/UserPageIdentityPagination";

export default function ProfileActivityLogs({
  user,
  initialLogs,
  pageSize,
}: {
  readonly user: string | null;
  readonly pageSize: number;
  readonly initialLogs: Page<ProfileActivityLog>;
}) {
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
    setCurrentPage(1);
    if (!selectedFilters.length) {
      setLogTypeParams("");
      return;
    }
    setLogTypeParams(selectedFilters.map((f) => f.toLowerCase()).join(","));
  }, [selectedFilters]);

  const [currentPage, setCurrentPage] = useState<number>(1);

  const getParams = (): Record<string, string> => {
    const params: Record<string, string> = {
      page: `${currentPage}`,
      page_size: `${pageSize}`,
      log_type: logTypeParams,
    };

    if (user) {
      params.profile = user;
    }

    return params;
  };

  const [params, setParams] = useState<Record<string, string>>(getParams());

  useEffect(() => {
    setParams(getParams());
  }, [currentPage, pageSize, logTypeParams, user]);

  const { isLoading, data: logs } = useQuery<Page<ProfileActivityLog>>({
    queryKey: [QueryKey.PROFILE_LOGS, params],
    queryFn: async () =>
      await commonApiFetch<Page<ProfileActivityLog>>({
        endpoint: `profile-logs`,
        params: params,
      }),
    placeholderData: keepPreviousData,
    initialData: () =>
      currentPage === 1 && !logTypeParams.length ? initialLogs : undefined,
  });

  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isLoading) return;
    if (!logs?.count) {
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(logs.count / pageSize));
  }, [logs?.count, logs?.page, isLoading]);

  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    setShowFilters(!!selectedFilters.length || !!logs?.data.length);
  }, [selectedFilters, logs?.data]);

  return (
    <div
      className={`${
        user ? "tw-min-h-[28rem] tw-max-h-[28rem]" : "tw-mt-2 tw-min-h-screen"
      } tw-transform-gpu tw-scroll-py-3 tw-overflow-auto`}
    >
      {showFilters && (
        <ProfileActivityLogsFilter
          selected={selectedFilters}
          setSelected={onFilter}
          user={user}
        />
      )}
      {logs?.data.length ? (
        <div className="tw-flow-root">
          <ProfileActivityLogsList logs={logs.data} user={user} />
          {totalPages > 1 && (
            <UserPageIdentityPagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              user={user}
            />
          )}
        </div>
      ) : (
        <div className="tw-mt-4">
          <span
            className={`${
              user ? "tw-px-6 md:tw-px-8" : ""
            } tw-text-sm tw-italic tw-text-iron-500`}
          >
            No Activity Log
          </span>
        </div>
      )}
    </div>
  );
}
