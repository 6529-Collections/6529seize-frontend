"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import type { ApiWaveCurationGroup } from "@/generated/models/ApiWaveCurationGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

interface WaveLeaderboardCurationGroupSelectProps {
  readonly groups: readonly ApiWaveCurationGroup[];
  readonly selectedGroupId: string | null;
  readonly onChange: (groupId: string | null) => void;
}

export function WaveLeaderboardCurationGroupSelect({
  groups,
  selectedGroupId,
  onChange,
}: WaveLeaderboardCurationGroupSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const selectedGroupGroupId = selectedGroup?.group_id;

  const { data: groupDetails } = useQuery({
    queryKey: [QueryKey.GROUP, selectedGroupGroupId],
    queryFn: async () => {
      if (!selectedGroupGroupId) {
        throw new Error("Group ID is required");
      }
      return await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${selectedGroupGroupId}`,
      });
    },
    enabled: Boolean(selectedGroupGroupId),
    staleTime: 5 * 60 * 1000,
  });

  const pfp = groupDetails?.created_by.pfp ?? null;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const items = useMemo(
    () => [
      { key: "all-submissions", label: "All submissions", value: null },
      ...groups.map((group) => ({
        key: group.id,
        label: group.name,
        value: group.id,
      })),
    ],
    [groups]
  );

  const selectedLabel = useMemo(
    () =>
      items.find((item) => item.value === selectedGroupId)?.label ??
      "All submissions",
    [items, selectedGroupId]
  );

  const handleItemClick = useCallback(
    (value: string | null) => {
      onChange(value);
      setIsOpen(false);
    },
    [onChange]
  );

  if (groups.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-testid="curation-group-select"
      className="tw-relative"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="tw-flex tw-items-center tw-gap-x-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/50 tw-px-4 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/60 desktop-hover:hover:tw-text-iron-200"
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-4 tw-flex-shrink-0 tw-text-primary-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
          />
        </svg>
        {pfp && selectedGroupId && (
          <Image
            src={getScaledImageUri(pfp, ImageScale.W_AUTO_H_50)}
            alt=""
            width={18}
            height={18}
            className="tw-size-[18px] tw-flex-shrink-0 tw-rounded-md tw-object-cover"
          />
        )}
        <span>{selectedLabel}</span>
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className={`tw-size-3.5 tw-flex-shrink-0 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="tw-absolute tw-left-0 tw-top-full tw-z-50 tw-mt-1.5 tw-min-w-[180px] tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-1 tw-shadow-xl tw-shadow-black/40">
          {items.map((item) => {
            const isActive = item.value === selectedGroupId;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleItemClick(item.value)}
                className={`tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-transition-colors tw-duration-150 ${
                  isActive
                    ? "tw-bg-white/5 tw-text-white"
                    : "tw-text-iron-400 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white"
                }`}
              >
                {isActive && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="tw-size-3.5 tw-flex-shrink-0 tw-text-emerald-400"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {!isActive && <span className="tw-w-3.5 tw-flex-shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
