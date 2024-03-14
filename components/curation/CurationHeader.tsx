import { useContext } from "react";
import { CommonSelectItem } from "../utils/select/CommonSelect";
import CommonTabs from "../utils/select/tabs/CommonTabs";
import { CommunityCurationFiltersView } from "./CommunityCurationFilters";
import { AuthContext } from "../auth/Auth";

export default function CurationHeader({
  view,
  setView,
  setOpen,
}: {
  readonly view: CommunityCurationFiltersView;
  readonly setView: (view: CommunityCurationFiltersView) => void;
  readonly setOpen: (open: boolean) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
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
          className="tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
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
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back to list</span>
        </button>
      )}
      {view === CommunityCurationFiltersView.SELECT && connectedProfile && (
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
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Create new</span>
        </button>
      )}

      <div className="tw-w-full tw-inline-flex tw-items-center tw-rounded-lg tw-bg-primary-400/5 tw-border tw-border-solid tw-border-primary-400/30 tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center">
          <svg
            className="tw-flex-shrink-0 tw-self-center tw-w-5 tw-h-5 tw-text-primary-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          <div className="tw-ml-3 tw-self-center">
            <p className="tw-text-sm tw-mb-0 tw-font-semibold tw-text-primary-300">
              Please connect your account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
