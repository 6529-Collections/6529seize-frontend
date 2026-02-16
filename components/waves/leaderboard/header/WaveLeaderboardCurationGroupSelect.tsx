"use client";

import { useMemo } from "react";
import { createBreakpoint } from "react-use";
import { useQueries } from "@tanstack/react-query";
import Image from "next/image";
import type { ApiWaveCurationGroup } from "@/generated/models/ApiWaveCurationGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

interface WaveLeaderboardCurationGroupSelectProps {
  readonly groups: readonly ApiWaveCurationGroup[];
  readonly selectedGroupId: string | null;
  readonly onChange: (groupId: string | null) => void;
}

const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

export function WaveLeaderboardCurationGroupSelect({
  groups,
  selectedGroupId,
  onChange,
}: WaveLeaderboardCurationGroupSelectProps) {
  const breakpoint = useBreakpoint();
  const isSmallViewport = breakpoint === "S";

  const groupDetailsQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: [QueryKey.GROUP, group.group_id],
      queryFn: async () =>
        await commonApiFetch<ApiGroupFull>({
          endpoint: `groups/${group.group_id}`,
        }),
      enabled: Boolean(group.group_id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const pfpMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((group, i) => {
      const pfp = groupDetailsQueries[i]?.data?.created_by?.pfp;
      if (pfp) {
        map.set(group.id, pfp);
      }
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, ...groupDetailsQueries.map((q) => q.data)]);

  const items = useMemo<readonly CommonSelectItem<string | null>[]>(
    () => [
      { key: "all-submissions", label: "All submissions", value: null },
      ...groups.map((group) => ({
        key: group.id,
        label: group.name,
        value: group.id as string | null,
      })),
    ],
    [groups]
  );

  if (groups.length === 0) {
    return null;
  }

  if (isSmallViewport) {
    return (
      <div className="tw-min-w-0">
        <CommonDropdown<string | null>
          items={items}
          activeItem={selectedGroupId}
          filterLabel="Group"
          setSelected={onChange}
          size="sm"
          showFilterLabel={true}
        />
      </div>
    );
  }

  const getTabClassName = (value: string | null) => {
    const baseClass =
      "tw-flex tw-items-center tw-gap-x-1.5 tw-px-3 tw-py-2.5 tw-text-xs tw-font-semibold tw-rounded-lg tw-transition-colors tw-whitespace-nowrap tw-border-0 tw-ring-1 tw-ring-inset";

    if (selectedGroupId === value) {
      return `${baseClass} tw-ring-iron-600 tw-bg-iron-800 tw-text-iron-200`;
    }

    return `${baseClass} tw-ring-transparent tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-ring-iron-700 desktop-hover:hover:tw-text-iron-300`;
  };

  return (
    <div
      data-testid="curation-group-select"
      className="tw-flex tw-items-center tw-gap-x-1"
    >
      {items.map((item) => {
        const pfp = item.value ? pfpMap.get(item.value) : null;
        return (
          <button
            key={item.key}
            type="button"
            className={getTabClassName(item.value)}
            onClick={() => onChange(item.value)}
          >
            {pfp && (
              <Image
                src={getScaledImageUri(pfp, ImageScale.W_AUTO_H_50)}
                alt=""
                width={16}
                height={16}
                className="tw-size-4 tw-flex-shrink-0 tw-rounded-lg tw-object-cover"
              />
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
