import MemeSeasonGridDropdown from "@/components/utils/select/dropdown/MemeSeasonGridDropdown";
import type { MemeSeason } from "@/entities/ISeason";

export default function UserPageCollectedFiltersSzn({
  selected,
  initialSeasonId,
  setSelected,
}: {
  readonly selected: MemeSeason | null;
  readonly initialSeasonId: number | null;
  readonly setSelected: (selected: MemeSeason | null) => void;
}) {
  return (
    <div className="tw-w-36">
      <MemeSeasonGridDropdown
        selected={selected}
        setSelected={setSelected}
        initialSeasonId={initialSeasonId}
      />
    </div>
  );
}
