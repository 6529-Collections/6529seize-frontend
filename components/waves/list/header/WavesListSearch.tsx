import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function WavesListSearch({
  identity,
  waveName,
  setIdentity,
  setWaveName,
}: {
  readonly identity: string | null;
  readonly waveName: string | null;
  readonly setIdentity: (identity: string | null) => void;
  readonly setWaveName: (waveName: string | null) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-w-full sm:tw-flex-row sm:tw-items-center tw-gap-4 xl:tw-w-1/2 xl:tw-pr-3">
      <div className="tw-flex-1">
        <div className="tw-relative">
          <MagnifyingGlassIcon
            className="tw-text-iron-300 tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-h-5 tw-w-5"
            aria-hidden="true"
          />
          {waveName && (
            <svg
              onClick={() => setWaveName(null)}
              className="tw-cursor-pointer tw-absolute tw-right-3 tw-top-3 tw-h-5 tw-w-5 tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 7L7 17M7 7L17 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <input
            type="text"
            placeholder=" "
            id="search-waves"
            value={waveName ?? ""}
            onChange={(e) => setWaveName(e.target.value)}
            className="tw-py-3 tw-text-sm tw-ring-iron-700 focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400 hover:tw-ring-iron-650 tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-appearance-none tw-font-medium tw-border-iron-700 tw-peer tw-pl-10 tw-pr-4 tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out tw-text-white"
          />
          <label
            htmlFor="search-waves"
            className="tw-absolute tw-cursor-text tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 
        tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 tw-rounded-lg peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1 peer-focus:tw-text-primary-400 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2"
          >
            Search waves
          </label>
        </div>
      </div>
      <div className="tw-flex-1">
        <IdentitySearch
          size={IdentitySearchSize.SM}
          identity={identity}
          setIdentity={setIdentity}
          label="By Identity"
        />
      </div>
    </div>
  );
}
