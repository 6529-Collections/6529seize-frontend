"use client";

import type { ApiWaveCurationGroup } from "@/generated/models/ApiWaveCurationGroup";

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
  if (groups.length === 0) {
    return null;
  }

  const items = [
    { key: "all-submissions", label: "All submissions", value: null },
    ...groups.map((group) => ({
      key: group.id,
      label: group.name,
      value: group.id,
    })),
  ];

  return (
    <div
      data-testid="curation-group-select"
      className="tw-flex tw-flex-wrap tw-items-center tw-gap-2"
    >
      {items.map((item) => {
        const isActive = item.value === selectedGroupId;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.value)}
            className={`tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-transition-all tw-duration-200 tw-ease-out tw-border tw-border-solid ${
              isActive
                ? "tw-border-primary-400/30 tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-border-iron-700/50 tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-text-iron-200"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
