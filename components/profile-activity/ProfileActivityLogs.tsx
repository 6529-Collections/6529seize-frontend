"use client";

import type { ProfileActivityLog } from "@/entities/IProfile";
import type { CountlessPage } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import CommonFilterTargetSelect from "../utils/CommonFilterTargetSelect";
import ProfileActivityLogsFilter from "./filter/ProfileActivityLogsFilter";
import ProfileActivityLogsList from "./list/ProfileActivityLogsList";

import { convertActivityLogParams } from "@/helpers/profile-logs.helpers";
import { selectActiveGroupId } from "@/store/groupSlice";
import type {
  ProfileActivityFilterTargetType,
  ProfileActivityLogType,
  RateMatter,
} from "@/types/enums";
import { useSelector } from "react-redux";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import CommonCardSkeleton from "../utils/animation/CommonCardSkeleton";
import CommonTablePagination from "../utils/table/paginator/CommonTablePagination";

export interface ActivityLogParams {
  readonly page: number;
  readonly pageSize: number;
  readonly logTypes: ProfileActivityLogType[];
  readonly matter: RateMatter | null;
  readonly targetType: ProfileActivityFilterTargetType;
  readonly handleOrWallet: string | null;
  readonly groupId: string | null;
}

export interface ActivityLogParamsConverted {
  readonly page: string;
  readonly page_size: string;
  readonly log_type: string;
  include_incoming?: string | undefined;
  rating_matter?: string | undefined;
  profile?: string | undefined;
  target?: string | undefined;
  group_id?: string | undefined;
}

export default function ProfileActivityLogs({
  initialParams,
  withFilters,
  disableActiveGroup = false,
  children,
}: {
  readonly initialParams: ActivityLogParams;
  readonly withFilters: boolean;
  readonly disableActiveGroup?: boolean | undefined;
  readonly children?: React.ReactNode | undefined;
}) {
  const activeGroupId = useSelector(selectActiveGroupId);
  const [selectedFilters, setSelectedFilters] = useState<
    ProfileActivityLogType[]
  >(initialParams.logTypes);
  const [targetType, setTargetType] = useState<ProfileActivityFilterTargetType>(
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

  const onTargetType = (target: ProfileActivityFilterTargetType) => {
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
    <div className={`${initialParams.handleOrWallet ? "" : "tw-mt-2"} `}>
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-y-4 min-[1200px]:tw-flex-row min-[1200px]:tw-items-center min-[1200px]:tw-justify-between min-[1200px]:tw-gap-x-16">
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
            <div className="tw-flow-root tw-scroll-py-3 tw-overflow-x-auto tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
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
                } tw-text-sm tw-italic tw-text-iron-500 sm:tw-text-md`}
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
