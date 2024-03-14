import { CommunityCurationFiltersView } from "../CommunityCurationFilters";
import CurationHeaderBuild from "./CurationHeaderBuild";
import CurationHeaderSelect from "./CurationHeaderSelect";

export default function CurationHeader({
  view,
  setView,
  setOpen,
}: {
  readonly view: CommunityCurationFiltersView;
  readonly setView: (view: CommunityCurationFiltersView) => void;
  readonly setOpen: (open: boolean) => void;
}) {
  const onView = () => {
    if (view === CommunityCurationFiltersView.SELECT) {
      setView(CommunityCurationFiltersView.BUILD);
    } else {
      setView(CommunityCurationFiltersView.SELECT);
    }
  };

  const components: Record<CommunityCurationFiltersView, JSX.Element> = {
    [CommunityCurationFiltersView.BUILD]: (
      <CurationHeaderBuild onView={onView} />
    ),
    [CommunityCurationFiltersView.SELECT]: (
      <CurationHeaderSelect onView={onView} />
    ),
  };

  return (
    <div className="tw-px-4 tw-space-y-4">
      <p className="tw-text-lg tw-pt-4 tw-text-iron-50 tw-font-semibold tw-mb-0 tw-whitespace-nowrap tw-inline-flex">
        Curate{" "}
        <span className="tw-pl-1.5 tw-text-xs tw-leading-7 tw-uppercase">
          (Alpha)
        </span>
      </p>
      {components[view]}
    </div>
  );
}
