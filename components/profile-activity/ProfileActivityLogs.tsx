import { useEffect, useState } from "react";
import {
  ProfileActivityLog,
  ProfileActivityLogRatingEditContentMatter,
  ProfileActivityLogType,
} from "../../entities/IProfile";
import { Page } from "../../helpers/Types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import ProfileActivityLogsFilter from "./filter/ProfileActivityLogsFilter";
import ProfileActivityLogsList from "./list/ProfileActivityLogsList";
import CommonTablePagination from "../utils/CommonTablePagination";
import CommonFilterTargetSelect, {
  FilterTargetType,
} from "../utils/CommonFilterTargetSelect";

export interface ActivityLogParams {
  readonly page: number;
  readonly pageSize: number;
  readonly logTypes: ProfileActivityLogType[];
  readonly matter: ProfileActivityLogRatingEditContentMatter | null;
  readonly targetType: FilterTargetType;
  readonly handleOrWallet: string | null;
}

export interface ActivityLogParamsConverted {
  readonly page: string;
  readonly page_size: string;
  readonly log_type: string;
  include_incoming?: string;
  rating_matter?: string;
  profile?: string;
  target?: string;
}

export const convertActivityLogParams = (
  params: ActivityLogParams
): ActivityLogParamsConverted => {
  const converted: ActivityLogParamsConverted = {
    page: `${params.page}`,
    page_size: `${params.pageSize}`,
    log_type: params.logTypes.length
      ? [...params.logTypes].sort((a, d) => a.localeCompare(d)).join(",")
      : "",
  };

  if (params.matter) {
    converted.rating_matter = params.matter;
  }

  if (!params.handleOrWallet) {
    return converted;
  }

  if (params.targetType === FilterTargetType.ALL) {
    converted.include_incoming = "true";
    converted.profile = params.handleOrWallet;
    return converted;
  }

  if (params.targetType === FilterTargetType.INCOMING) {
    converted.target = params.handleOrWallet;
    return converted;
  }

  if (params.targetType === FilterTargetType.OUTGOING) {
    converted.profile = params.handleOrWallet;
    return converted;
  }

  return converted;
};

export default function ProfileActivityLogs({
  initialParams,
  withFilters,
}: {
  readonly initialParams: ActivityLogParams;
  readonly withFilters: boolean;
}) {
  const [selectedFilters, setSelectedFilters] = useState<
    ProfileActivityLogType[]
  >(initialParams.logTypes);
  const [targetType, setTargetType] = useState<FilterTargetType>(
    initialParams.targetType
  );
  const [currentPage, setCurrentPage] = useState<number>(initialParams.page);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    setSelectedFilters(initialParams.logTypes);
    setTargetType(initialParams.targetType);
    setCurrentPage(initialParams.page);
  }, [initialParams]);

  const onFilter = (filter: ProfileActivityLogType) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
    setCurrentPage(1);
  };

  const onTargetType = (target: FilterTargetType) => {
    setTargetType(target);
    setCurrentPage(1);
  };

  const [params, setParams] = useState<ActivityLogParamsConverted>(
    convertActivityLogParams({
      page: currentPage,
      pageSize: initialParams.pageSize,
      logTypes: selectedFilters,
      matter: initialParams.matter,
      targetType,
      handleOrWallet: initialParams.handleOrWallet,
    })
  );

  useEffect(() => {
    setParams(
      convertActivityLogParams({
        page: currentPage,
        pageSize: initialParams.pageSize,
        logTypes: selectedFilters,
        matter: initialParams.matter,
        targetType,
        handleOrWallet: initialParams.handleOrWallet,
      })
    );
  }, [currentPage, selectedFilters, initialParams.handleOrWallet, targetType]);

  const { isLoading, data: logs } = useQuery<Page<ProfileActivityLog>>({
    queryKey: [QueryKey.PROFILE_LOGS, params],
    queryFn: async () =>
      await commonApiFetch<
        Page<ProfileActivityLog>,
        ActivityLogParamsConverted
      >({
        endpoint: `profile-logs`,
        params: params,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!logs?.count) {
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(logs.count / initialParams.pageSize));
  }, [logs?.count, logs?.page, isLoading]);

  return (
    <div
      className={`${
        initialParams.handleOrWallet
          ? "tw-min-h-[28rem] tw-max-h-[28rem]"
          : "tw-mt-2 tw-min-h-screen"
      }  tw-scroll-py-3 tw-overflow-auto`}
    >
      {withFilters && (
        <ProfileActivityLogsFilter
          selected={selectedFilters}
          setSelected={onFilter}
          user={initialParams.handleOrWallet}
        />
      )}
      {initialParams.handleOrWallet && (
        <CommonFilterTargetSelect
          selected={targetType}
          onChange={onTargetType}
        />
      )}
      {logs?.data.length ? (
        <div className="tw-flow-root">
          <ProfileActivityLogsList
            logs={logs.data}
            user={initialParams.handleOrWallet}
          />
          {totalPages > 1 && (
            <CommonTablePagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              small={!!initialParams.handleOrWallet}
            />
          )}
        </div>
      ) : (
        <div className="tw-mt-4">
          <span
            className={`${
              initialParams.handleOrWallet ? "tw-px-4 sm:tw-px-6 md:tw-px-8" : ""
            } tw-text-sm tw-italic tw-text-iron-500`}
          >
            No Activity Log
          </span>
        </div>
      )}
    </div>
  );
}
