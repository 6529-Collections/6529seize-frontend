"use client";

import ProfileActivityLogsResults from "./ProfileActivityLogsResults";
import ProfileNicActivityLogs from "./ProfileNicActivityLogs";

import type { ProfileActivityLog } from "@/entities/IProfile";
import type { CountlessPage } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ProfileActivityLogsFilter from "./filter/ProfileActivityLogsFilter";

import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { convertActivityLogParams } from "@/helpers/profile-logs.helpers";
import {
  ProfileActivityFilterTargetType,
  type ProfileActivityLogType,
  RateMatter,
} from "@/types/enums";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import type { CommonSelectItem } from "../utils/select/CommonSelect";
import CommonTabs from "../utils/select/tabs/CommonTabs";

export interface ActivityLogParams {
  readonly page: number;
  readonly pageSize: number;
  readonly logTypes: ProfileActivityLogType[];
  readonly matter: RateMatter | null;
  readonly targetType: ProfileActivityFilterTargetType;
  readonly handleOrWallet: string | null;
  readonly groupId: string | null;
}

const MATTER_TAB_ITEMS: CommonSelectItem<RateMatter | null>[] = [
  { label: "All", value: null, key: "all" },
  { label: "REP", value: RateMatter.REP, key: "rep" },
  { label: "NIC", value: RateMatter.NIC, key: "nic" },
];

const DIRECTION_TAB_ITEMS: CommonSelectItem<ProfileActivityFilterTargetType>[] =
  [
    { label: "All", value: ProfileActivityFilterTargetType.ALL, key: "all" },
    {
      label: "Incoming",
      value: ProfileActivityFilterTargetType.INCOMING,
      key: "incoming",
    },
    {
      label: "Outgoing",
      value: ProfileActivityFilterTargetType.OUTGOING,
      key: "outgoing",
    },
  ];

export interface ActivityLogParamsConverted {
  readonly page: string;
  readonly page_size: string;
  readonly log_type: string;
  include_incoming?: string | undefined;
  rating_matter?: string | undefined;
  activity_scope?: "NIC";
  cursor?: string;
  profile?: string | undefined;
  target?: string | undefined;
  group_id?: string | undefined;
}

export default function ProfileActivityLogs({
  initialParams,
  withFilters,
  withMatterFilter = false,
  disableActiveGroup = false,
  enabled = true,
  children,
}: {
  readonly initialParams: ActivityLogParams;
  readonly withFilters: boolean;
  readonly withMatterFilter?: boolean | undefined;
  readonly disableActiveGroup?: boolean | undefined;
  readonly enabled?: boolean | undefined;
  readonly children?: React.ReactNode | undefined;
}) {
  const { activeGroupId } = useActiveGroup();
  const [selectedFilters, setSelectedFilters] = useState<
    ProfileActivityLogType[]
  >(initialParams.logTypes);
  const [targetType, setTargetType] = useState<ProfileActivityFilterTargetType>(
    initialParams.targetType
  );
  const [currentPage, setCurrentPage] = useState<number>(initialParams.page);
  const [matter, setMatter] = useState<RateMatter | null>(initialParams.matter);

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
    setSelectedFilters(initialParams.logTypes);
    setCurrentPage(1);
  };

  const params = convertActivityLogParams({
    params: {
      page: currentPage,
      pageSize: initialParams.pageSize,
      logTypes: selectedFilters,
      matter,
      targetType,
      handleOrWallet: initialParams.handleOrWallet,
      groupId: activeGroupId,
    },
    disableActiveGroup,
  });
  const isProfileNic = params.activity_scope === "NIC";

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
      enabled: enabled && !isProfileNic,
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
          <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-3">
            {initialParams.handleOrWallet && (
              <div className="tw-w-full sm:tw-w-fit">
                <CommonTabs
                  items={DIRECTION_TAB_ITEMS}
                  activeItem={targetType}
                  filterLabel="Filter direction"
                  setSelected={onTargetType}
                  size="sm"
                />
              </div>
            )}
            {matter === RateMatter.NIC && (
              <div className="tw-flex-1 md:tw-ml-auto md:tw-w-[17.5rem] md:tw-flex-none min-[1200px]:tw-w-[18rem] min-[1400px]:tw-w-[20rem]">
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
        {withMatterFilter && (
          <div className="tw-flex tw-w-full tw-items-center tw-gap-3">
            <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3">
              <div className="tw-max-w-[12rem]">
                <CommonTabs
                  items={MATTER_TAB_ITEMS}
                  activeItem={matter}
                  filterLabel="Filter matter"
                  setSelected={onMatterChange}
                  size="sm"
                />
              </div>
              {initialParams.handleOrWallet && (
                <div className="tw-max-w-[16rem]">
                  <CommonTabs
                    items={DIRECTION_TAB_ITEMS}
                    activeItem={targetType}
                    filterLabel="Filter direction"
                    setSelected={onTargetType}
                    size="sm"
                  />
                </div>
              )}
            </div>
            {withFilters && matter === RateMatter.NIC && (
              <div className="tw-ml-auto tw-w-[17.5rem] min-[1200px]:tw-w-[18rem] min-[1400px]:tw-w-[20rem]">
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
      {isProfileNic ? (
        <ProfileNicActivityLogs
          params={params}
          user={initialParams.handleOrWallet}
          enabled={enabled}
        />
      ) : (
        <ProfileActivityLogsResults
          logs={logs}
          user={initialParams.handleOrWallet}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}
