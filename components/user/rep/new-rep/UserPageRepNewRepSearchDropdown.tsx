import { useEffect, useState } from "react";

enum STATE {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  HAVE_RESULTS = "HAVE_RESULTS",
}

export default function UserPageRepNewRepSearchDropdown({
  categories,
  onRepSelect,
  loading,
}: {
  readonly categories: string[];
  readonly onRepSelect: (rep: string) => void;
  readonly loading: boolean;
}) {
  const [state, setState] = useState<STATE>(STATE.INITIAL);

  useEffect(() => {
    if (loading) {
      setState(STATE.LOADING);
    } else if (categories.length) {
      setState(STATE.HAVE_RESULTS);
    } else {
      setState(STATE.INITIAL);
    }
  }, [loading, categories]);

  return (
    <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
      <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
        <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
          {state === STATE.INITIAL && (
            <li className="tw-group tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative  tw-select-none tw-p-2 tw-text-iron-200 tw-font-normal">
              Type at least 3 characters
            </li>
          )}
          {state === STATE.LOADING && (
            <li className="tw-group tw-text-white tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out">
              Loading...
            </li>
          )}
          {state === STATE.HAVE_RESULTS &&
            categories?.map((category) => (
              <li
                key={category}
                className="tw-group tw-text-white tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
              >
                <button
                  onClick={() => onRepSelect(category)}
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
