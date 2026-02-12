"use client";

import CommonSelect, {
  type CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
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
  const items: CommonSelectItem<string | null>[] = [
    {
      key: "all-submissions",
      label: "All submissions",
      value: null,
    },
    ...groups.map((group) => ({
      key: group.id,
      label: group.name,
      value: group.id,
    })),
  ];

  if (groups.length === 0) {
    return null;
  }

  return (
    <div data-testid="curation-group-select">
      <CommonSelect<string | null>
        items={items}
        activeItem={selectedGroupId ?? null}
        setSelected={onChange}
        filterLabel="Curation"
        fill={false}
      />
    </div>
  );
}
