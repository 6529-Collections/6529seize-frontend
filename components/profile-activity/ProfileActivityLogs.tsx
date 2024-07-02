import { useEffect, useState } from "react";
import {
  ProfileActivityLog,
  ProfileActivityLogType,
  RateMatter,
} from "../../entities/IProfile";
import { CountlessPage } from "../../helpers/Types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import ProfileActivityLogsFilter from "./filter/ProfileActivityLogsFilter";
import ProfileActivityLogsList from "./list/ProfileActivityLogsList";
import CommonFilterTargetSelect, {
  FilterTargetType,
} from "../utils/CommonFilterTargetSelect";

import CommonCardSkeleton from "../utils/animation/CommonCardSkeleton";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../../store/groupSlice";
import CommonTablePagination from "../utils/table/paginator/CommonTablePagination";

export interface ActivityLogParams {
  readonly page: number;
  readonly pageSize: number;
  readonly logTypes: ProfileActivityLogType[];
  readonly matter: RateMatter | null;
  readonly targetType: FilterTargetType;
  readonly handleOrWallet: string | null;
  readonly groupId: string | null;
}

export interface ActivityLogParamsConverted {
  readonly page: string;
  readonly page_size: string;
  readonly log_type: string;
  include_incoming?: string;
  rating_matter?: string;
  profile?: string;
  target?: string;
  group_id?: string;
}

export const convertActivityLogParams = ({
  params,
  disableActiveGroup,
}: {
  readonly params: ActivityLogParams;
  readonly disableActiveGroup: boolean;
}): ActivityLogParamsConverted => {
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
  if (params.groupId && !params.handleOrWallet && !disableActiveGroup) {
    converted.group_id = params.groupId;
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
  disableActiveGroup = false,
  children,
}: {
  readonly initialParams: ActivityLogParams;
  readonly withFilters: boolean;
  readonly disableActiveGroup?: boolean;
  readonly children?: React.ReactNode;
}) {
  const activeGroupId = useSelector(selectActiveGroupId);
  const [selectedFilters, setSelectedFilters] = useState<
    ProfileActivityLogType[]
  >(initialParams.logTypes);
  const [targetType, setTargetType] = useState<FilterTargetType>(
    initialParams.targetType
  );
  const [currentPage, setCurrentPage] = useState<number>(initialParams.page);

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
      params: {
        page: currentPage,
        pageSize: initialParams.pageSize,
        logTypes: selectedFilters,
        matter: initialParams.matter,
        targetType,
        handleOrWallet: initialParams.handleOrWallet,
        groupId: activeGroupId,
      },
      disableActiveGroup: !!disableActiveGroup,
    })
  );

  useEffect(() => {
    setParams(
      convertActivityLogParams({
        params: {
          page: currentPage,
          pageSize: initialParams.pageSize,
          logTypes: selectedFilters,
          matter: initialParams.matter,
          targetType,
          handleOrWallet: initialParams.handleOrWallet,
          groupId: activeGroupId,
        },
        disableActiveGroup: !!disableActiveGroup,
      })
    );
  }, [
    currentPage,
    selectedFilters,
    initialParams.handleOrWallet,
    targetType,
    activeGroupId,
  ]);

  const { isLoading, data: logs } = useQuery<CountlessPage<ProfileActivityLog>>(
    {
      queryKey: [
        QueryKey.PROFILE_LOGS,
        {
          ...params,
        },
      ],
      queryFn: async () =>
        await commonApiFetch<
          CountlessPage<ProfileActivityLog>,
          ActivityLogParamsConverted
        >({
          endpoint: `profile-logs`,
          params: params,
        }),
      placeholderData: keepPreviousData,
    }
  );

  useEffect(() => {
    if (isLoading) return;
    if (logs?.page === 1 && !logs.data.length) {
      setCurrentPage(1);
    }
  }, [logs?.page, isLoading]);
  return (
    <div className={`${initialParams.handleOrWallet ? "" : "tw-mt-2"}  `}>
      <div className="tw-w-full tw-flex tw-flex-col min-[1200px]:tw-flex-row tw-gap-y-8 min-[1200px]:tw-gap-x-16 min-[1200px]:tw-justify-between min-[1200px]:tw-items-center">
        {children && <div>{children}</div>}
        {withFilters && (
          <div className="min-[1200px]:tw-flex min-[1200px]:tw-justify-end">
            <div
              className={`${children ? "" : "tw-mt-6"} min-[1200px]:tw-w-80`}
            >
              <ProfileActivityLogsFilter
                user={initialParams.handleOrWallet}
                options={initialParams.logTypes}
                selected={selectedFilters}
                setSelected={onFilter}
              />
            </div>
          </div>
        )}
      </div>
      {initialParams.handleOrWallet && (
        <CommonFilterTargetSelect
          selected={targetType}
          onChange={onTargetType}
        />
      )}
      {logs ? (
        <div>
          {logs?.data.length ? (
            <div className="tw-flow-root tw-scroll-py-3 tw-overflow-auto">
              <ProfileActivityLogsList
                logs={logs.data}
                user={initialParams.handleOrWallet}
              />
              <CommonTablePagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={null}
                haveNextPage={logs.next}
                small={!!initialParams.handleOrWallet}
              />
            </div>
          ) : (
            <div className="tw-py-4">
              <span
                className={`${
                  initialParams.handleOrWallet ? "tw-px-4 sm:tw-px-6" : ""
                } tw-text-sm sm:tw-text-md tw-italic tw-text-iron-500`}
              >
                No Activity Log
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="tw-h-screen tw-w-full">
          <CommonCardSkeleton />
        </div>
      )}
    </div>
  );
}
