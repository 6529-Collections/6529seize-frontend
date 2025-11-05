import { RepSearchState } from "./UserPageRepNewRepSearch";

export default function UserPageRepNewRepSearchDropdown({
  categories,
  onRepSelect,
  state,
  minSearchLength,
  maxSearchLength,
}: {
  readonly categories: string[];
  readonly onRepSelect: (rep: string) => void;
  readonly state: RepSearchState;
  readonly minSearchLength: number;
  readonly maxSearchLength: number;
}) {
  return (
    <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-full tw-w-full tw-rounded-md tw-bg-iron-900 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
      <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
          {state === RepSearchState.MIN_LENGTH_ERROR && (
            <li className="tw-group tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative  tw-select-none tw-p-2 tw-text-iron-200 tw-font-normal tw-text-sm">
              Type at least {minSearchLength} characters
            </li>
          )}
          {state === RepSearchState.MAX_LENGTH_ERROR && (
            <li className="tw-group tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative  tw-select-none tw-p-2 tw-text-iron-200 tw-font-normal tw-text-sm">
              Type at most {maxSearchLength} characters
            </li>
          )}
          {state === RepSearchState.LOADING && (
            <li className="tw-group tw-text-iron-200 tw-text-sm tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out">
              Loading...
            </li>
          )}
          {state === RepSearchState.HAVE_RESULTS &&
            categories.map((category) => (
              <li
                key={category}
                className="tw-group tw-text-white tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 tw-py-1 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRepSelect(category);
                  }}
                  className="tw-bg-transparent tw-border-none tw-w-full tw-h-full tw-text-left"
                >
                  <span className="tw-inline-block tw-text-sm tw-font-medium tw-text-white">
                    {category}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
