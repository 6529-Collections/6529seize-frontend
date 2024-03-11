import CurationBuildFilter from "./filter-builder/CurationBuildFilter";
import CurationHeader from "./CurationHeader";
import CommunityCurationFiltersSelect from "./select/CommunityCurationFiltersSelect";
import { useState } from "react";
import { LocalStorageKey } from "../../helpers/Types";
import { useLocalStorage } from "react-use";

export enum CommunityCurationFiltersView {
  SELECT = "SELECT",
  BUILD = "BUILD",
}

export default function CommunityCurationFilters({
  setOpen,
}: {
  readonly setOpen: (open: boolean) => void;
}) {
  const components: Record<CommunityCurationFiltersView, JSX.Element> = {
    [CommunityCurationFiltersView.SELECT]: <CommunityCurationFiltersSelect />,
    [CommunityCurationFiltersView.BUILD]: <CurationBuildFilter />,
  };

  const [view, setView] = useState<CommunityCurationFiltersView>(
    CommunityCurationFiltersView.SELECT
  );

  const [selectedFilter, setSelectedFilter, removeSelectedFilter] =
    useLocalStorage(LocalStorageKey.ACTIVE_CURATION_FILTER, null);

  return (
    <div className="tw-px-2">
      <CurationHeader setOpen={setOpen} view={view} setView={setView} />
      {components[view]}
    </div>
  );
}
