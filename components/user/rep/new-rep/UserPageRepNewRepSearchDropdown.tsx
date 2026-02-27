import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
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
  if (state === RepSearchState.MIN_LENGTH_ERROR) {
    return (
      <p className="tw-mb-0 tw-text-xs tw-text-iron-500 tw-font-normal">
        Type at least {minSearchLength} characters
      </p>
    );
  }

  if (state === RepSearchState.MAX_LENGTH_ERROR) {
    return (
      <p className="tw-mb-0 tw-text-xs tw-text-iron-500 tw-font-normal">
        Type at most {maxSearchLength} characters
      </p>
    );
  }

  if (state === RepSearchState.LOADING) {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
        <CircleLoader />
        <span>Searching...</span>
      </div>
    );
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2.5">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRepSelect(category);
          }}
          className="tw-px-3 tw-py-2 tw-rounded-lg tw-bg-white/5 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-white/10 tw-cursor-pointer hover:tw-bg-white/10 hover:tw-border-white/20 tw-transition tw-duration-200 tw-ease-out"
        >
          {category}
        </button>
      ))}
    </div>
  );
}
