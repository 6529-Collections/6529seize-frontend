import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import FiltersButton from "../../filters/FiltersButton";
import { FilterDirection, GeneralFilter } from "../../filters/FilterBuilder";

export default function UserPageFeed({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [filters, setFilters] = useState<GeneralFilter>({
    tdh: { min: null, max: null },
    rep: {
      min: null,
      max: null,
      direction: null,
      user: null,
      category: null,
    },
    cic: { min: null, max: null, direction: null, user: null },
    level: { min: null, max: null },
  });

  return (
    <div className="tailwind-scope">
      <FiltersButton
        profile={profile}
        filters={filters}
        onFilters={setFilters}
      />
    </div>
  );
}
