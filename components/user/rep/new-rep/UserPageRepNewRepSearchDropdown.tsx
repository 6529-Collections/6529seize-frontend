import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { RepSearchState } from "./rep-search-types";

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
  if (state === RepSearchState.MIN_LENGTH_ERROR) {
    return (
      <p className="tw-mb-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-500">
        Type at least {minSearchLength} characters
      </p>
    );
  }

  if (state === RepSearchState.MAX_LENGTH_ERROR) {
    return (
      <p className="tw-mb-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-500">
        Type at most {maxSearchLength} characters
      </p>
    );
  }

  if (state === RepSearchState.LOADING) {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-text-xs tw-text-iron-400">
        <CircleLoader />
        <span>Searching...</span>
      </div>
    );
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2.5 tw-px-1 tw-py-1">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRepSelect(category);
          }}
          className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-transition tw-duration-200 tw-ease-out hover:tw-border-white/20 hover:tw-bg-white/10 md:tw-px-2 md:tw-py-1.5 md:tw-text-xs"
        >
          {category}
        </button>
      ))}
    </div>
  );
}
