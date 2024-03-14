import CurationBuildFilter from "./filter-builder/CurationBuildFilter";
import CurationHeader from "./header/CurationHeader";
import CommunityCurationFiltersSelect from "./select/CommunityCurationFiltersSelect";
import { useContext, useState } from "react";
import { CurationFilterResponse } from "../../helpers/filters/Filters.types";
import { useDispatch } from "react-redux";
import { setActiveCurationFilterId } from "../../store/curationFilterSlice";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";

export enum CommunityCurationFiltersView {
  SELECT = "SELECT",
  BUILD = "BUILD",
}

export default function CommunityCurationFilters({
  setOpen,
}: {
  readonly setOpen: (open: boolean) => void;
}) {
  const dispatch = useDispatch();
  const { onCurationFilterChanged } = useContext(ReactQueryWrapperContext);
  const [editFilter, setEditFilter] = useState<CurationFilterResponse | null>(
    null
  );

  const [view, setView] = useState<CommunityCurationFiltersView>(
    CommunityCurationFiltersView.SELECT
  );

  const onEditClick = (filter: CurationFilterResponse) => {
    setEditFilter(filter);
    setView(CommunityCurationFiltersView.BUILD);
    dispatch(setActiveCurationFilterId(filter.id));
  };

  const onView = (view: CommunityCurationFiltersView) => {
    setEditFilter(null);
    setView(view);
  };

  const onSaved = (response: CurationFilterResponse) => {
    setEditFilter(null);
    setView(CommunityCurationFiltersView.SELECT);
    dispatch(setActiveCurationFilterId(response.id));
    onCurationFilterChanged({ filterId: response.id });
  };

  return (
    <div className="tw-pb-4">
      <CurationHeader setOpen={setOpen} view={view} setView={onView} />
      {view === CommunityCurationFiltersView.SELECT && (
        <CommunityCurationFiltersSelect onEditClick={onEditClick} />
      )}
      {view === CommunityCurationFiltersView.BUILD && (
        <CurationBuildFilter originalFilter={editFilter} onSaved={onSaved} />
      )}
    </div>
  );
}
