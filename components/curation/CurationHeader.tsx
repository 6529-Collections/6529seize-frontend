import { CommonSelectItem } from "../utils/select/CommonSelect";
import CommonTabs from "../utils/select/tabs/CommonTabs";
import { CommunityCurationFiltersView } from "./CommunityCurationFilters";

export default function CurationHeader({
  view,
  setView,
  setOpen,
}: {
  readonly view: CommunityCurationFiltersView;
  readonly setView: (view: CommunityCurationFiltersView) => void;
  readonly setOpen: (open: boolean) => void;
}) {
  const buttonTitle =
    view === CommunityCurationFiltersView.SELECT ? "Create new" : "Close";

  const onView = () => {
    if (view === CommunityCurationFiltersView.SELECT) {
      setView(CommunityCurationFiltersView.BUILD);
    } else {
      setView(CommunityCurationFiltersView.SELECT);
    }
  };

  return (
    <div>
      <div className="tw-max-w-xl tw-flex tw-flex-col">
        <p className="tw-text-lg tw-text-iron-50 tw-font-semibold tw-mb-0">
          Curate your online experience
        </p>
      </div>
      <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
        <button
          onClick={() => setOpen(false)}
          type="button"
          className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-sr-only tw-text-sm">Close</span>
          <svg
            className="tw-h-6 tw-w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <button onClick={onView}>{buttonTitle}</button>
    </div>
  );
}
