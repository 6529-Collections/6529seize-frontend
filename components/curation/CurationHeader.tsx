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
  const onView = () => {
    if (view === CommunityCurationFiltersView.SELECT) {
      setView(CommunityCurationFiltersView.BUILD);
    } else {
      setView(CommunityCurationFiltersView.SELECT);
    }
  };

  return (
    <div className="tw-px-4 tw-space-y-4">
      <p className="tw-text-lg tw-pt-4 tw-text-iron-50 tw-font-semibold tw-mb-0 tw-whitespace-nowrap">
        Curate your online experience
      </p>
      {view === CommunityCurationFiltersView.BUILD && (
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
      )}
      {view === CommunityCurationFiltersView.SELECT && (
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
          <span>Create new</span>
        </button>
      )}
    </div>
  );
}
