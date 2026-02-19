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
import {
  ProfileActivityFilterTargetType,
  type ProfileActivityLogType,
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

const MATTER_OPTIONS: {
  readonly key: string;
  readonly label: string;
  readonly value: RateMatter | null;
}[] = [
  { key: "all", label: "ALL", value: null },
  { key: "rep", label: "REP", value: RateMatter.REP },
  { key: "nic", label: "NIC", value: RateMatter.NIC },
];

const DIRECTION_OPTIONS: {
  readonly key: string;
  readonly label: string;
  readonly value: ProfileActivityFilterTargetType;
}[] = [
  { key: "all", label: "all", value: ProfileActivityFilterTargetType.ALL },
  {
    key: "incoming",
    label: "incoming",
    value: ProfileActivityFilterTargetType.INCOMING,
  },
  {
    key: "outgoing",
    label: "outgoing",
    value: ProfileActivityFilterTargetType.OUTGOING,
  },
];

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
  withMatterFilter = false,
  disableActiveGroup = false,
  children,
}: {
  readonly initialParams: ActivityLogParams;
  readonly withFilters: boolean;
  readonly withMatterFilter?: boolean | undefined;
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
  const [matter, setMatter] = useState<RateMatter | null>(
    initialParams.matter
  );

  useEffect(() => {
    setSelectedFilters(initialParams.logTypes);
    setTargetType(initialParams.targetType);
    setCurrentPage(initialParams.page);
    setMatter(initialParams.matter);
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

  const onMatterChange = (m: RateMatter | null) => {
    setMatter(m);
    setSelectedFilters([]);
    setCurrentPage(1);
  };

  const [params, setParams] = useState<ActivityLogParamsConverted>(
    convertActivityLogParams({
      params: {
        page: currentPage,
        pageSize: initialParams.pageSize,
        logTypes: selectedFilters,
        matter,
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
          matter,
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
    matter,
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
      <div
        className={`${
          withMatterFilter
            ? "tw-flex tw-w-full tw-flex-col tw-gap-y-4"
            : "tw-flex tw-w-full tw-flex-col tw-gap-y-4 min-[1200px]:tw-flex-row min-[1200px]:tw-items-start min-[1200px]:tw-justify-between min-[1200px]:tw-gap-x-6"
        }`}
      >
        {children && (
          <div className="tw-flex-none tw-whitespace-nowrap">{children}</div>
        )}
        {withFilters && !withMatterFilter && (
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
        {withMatterFilter && (
          <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-3">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
              <div className="tw-inline-flex tw-items-center tw-gap-1 tw-p-1 tw-bg-black/40 tw-rounded-lg tw-border tw-border-solid tw-border-white/20">
                {MATTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => onMatterChange(opt.value)}
                    className={`tw-rounded-md tw-px-3 tw-py-1.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-widest tw-transition-all tw-cursor-pointer ${
                      matter === opt.value
                        ? "tw-bg-white/10 tw-text-white tw-shadow-sm tw-border-0"
                        : "tw-bg-transparent tw-text-iron-500 hover:tw-text-iron-300 tw-border-0"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {initialParams.handleOrWallet && (
                <div className="tw-inline-flex tw-items-center tw-gap-1 tw-p-1 tw-bg-black/40 tw-rounded-lg tw-border tw-border-solid tw-border-white/20">
                  {DIRECTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => onTargetType(opt.value)}
                      className={`tw-rounded-md tw-px-3 tw-py-1.5 tw-text-[11px] tw-font-semibold tw-capitalize tw-transition-all tw-cursor-pointer ${
                        targetType === opt.value
                          ? "tw-bg-white/10 tw-text-white tw-shadow-sm tw-border-0"
                          : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-300 tw-border-0"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {withFilters && matter === RateMatter.NIC && (
              <div className="tw-w-full sm:tw-ml-auto sm:tw-w-[17.5rem] min-[1200px]:tw-w-[18rem] min-[1400px]:tw-w-[20rem]">
                <ProfileActivityLogsFilter
                  user={initialParams.handleOrWallet}
                  options={initialParams.logTypes}
                  selected={selectedFilters}
                  setSelected={onFilter}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {!withMatterFilter && initialParams.handleOrWallet && (
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
                showTopBorder={false}
                className="tw-pt-6"
              />
            </div>
          ) : (
            <div className="tw-py-4">
              <span
                className={`${
                  initialParams.handleOrWallet ? "tw-px-2 sm:tw-px-3" : ""
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
