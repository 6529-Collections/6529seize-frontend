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

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <label
        htmlFor="wave-leaderboard-curation-group"
        className="tw-text-xs tw-font-medium tw-text-iron-400"
      >
        Curation
      </label>
      <select
        id="wave-leaderboard-curation-group"
        aria-label="Filter by curation group"
        data-testid="curation-group-select"
        value={selectedGroupId ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="tw-h-9 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-xs tw-font-medium tw-text-iron-100 tw-transition-colors focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 desktop-hover:hover:tw-border-white/20"
      >
        <option value="">All submissions</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  );
}
