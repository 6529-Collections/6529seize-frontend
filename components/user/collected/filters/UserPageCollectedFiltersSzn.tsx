import SeasonsGridDropdown from "@/components/utils/select/dropdown/SeasonsGridDropdown";
import { MemeSeason } from "@/entities/ISeason";
import { RefObject } from "react";

export default function UserPageCollectedFiltersSzn({
  selected,
  initialSeasonId,
  containerRef,
  setSelected,
}: {
  readonly selected: MemeSeason | null;
  readonly initialSeasonId: number | null;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly setSelected: (selected: MemeSeason | null) => void;
}) {
  return (
    <div className="tw-w-36">
      <SeasonsGridDropdown
        selected={selected}
        setSelected={setSelected}
        initialSeasonId={initialSeasonId}
        containerRef={containerRef}
      />
    </div>
  );
}
