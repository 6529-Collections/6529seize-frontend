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
    <div className="tw-px-4 tw-space-y-4">
      <div className="tw-flex tw-flex-col tw-space-y-2">
        <div className="-tw-m-2.5 tw-flex tw-justify-end tw-items-center">
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
        <p className="tw-text-xl tw-text-iron-50 tw-font-semibold tw-mb-0">
          Curate your online experience
        </p>
      </div>
      <button
        type="button"
        onClick={onView}
        className="tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400  tw-bg-transparent"
      >
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12H4M4 12L10 18M4 12L10 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Back to list</span>
      </button>
      <button
        type="button"
        onClick={onView}
        className="tw-w-full tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-white tw-bg-primary-500 tw-border-primary-500 hover:tw-bg-primary-600 hover:tw-border-primary-600"
      >
        <svg
          className="tw-w-5 tw-h-5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{buttonTitle}</span>
      </button>
    </div>
  );
}
