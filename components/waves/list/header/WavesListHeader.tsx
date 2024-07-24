import { useState } from "react";
import IdentitySearch, {
  IdentitySearchSize,
} from "../../../utils/input/identity/IdentitySearch";

export default function WavesListHeader({
  showCreateNewWaveButton,
  onCreateNewWave,
}: {
  readonly showCreateNewWaveButton?: boolean;
  readonly onCreateNewWave: () => void;
}) {
  const [identity, setIdentity] = useState<string | null>(null);

  return (
    <div className="tw-mt-6 lg:tw-mt-8">
      <h1>Waves</h1>
      <div className="tw-mt-4 tw-flex tw-items-center tw-gap-x-3">
        <div>
          {showCreateNewWaveButton && (
            <button
              onClick={onCreateNewWave}
              type="button"
              className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
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
              <span>Create New</span>
            </button>
          )}
        </div>
        <div className="tw-max-w-2xl tw-flex tw-gap-x-3 tw-items-center tw-relative tw-w-full">
          <svg
            className="tw-text-iron-300 tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            ></path>
          </svg>
          <input
            type="text"
            placeholder=" "
            id="search-waves"
            className="tw-form-input tw-block tw-w-full tw-text-base tw-leading-5 tw-rounded-lg tw-border-0 tw-appearance-none tw-font-medium tw-border-iron-650 tw-peer tw-pl-10 tw-pt-4 tw-pb-3 tw-pr-4 tw-bg-iron-900 focus:tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out focus:tw-text-white tw-text-primary-400 tw-ring-iron-650 focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400"
          />
          <label
            htmlFor="search-waves"
            className="tw-absolute tw-cursor-text tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 
        tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 tw-rounded-lg peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1 peer-focus:tw-text-primary-400 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2"
          >
            Search waves
          </label>
          <IdentitySearch
            size={IdentitySearchSize.SM}
            identity={identity}
            setIdentity={setIdentity}
            label="By Identity"
          />
        </div>
      </div>
    </div>
  );
}
