import { CommunityMemberMinimal } from "../../../../../../entities/IProfile";
import CommonProfileSearch from "../../../../../utils/input/profile-search/CommonProfileSearch";

export default function ProxyCreateTargetSearch({
  onTargetSelect,
}: {
  readonly onTargetSelect: (target: CommunityMemberMinimal | null) => void;
}) {
  return (
    <div className="tw-grid tw-grid-cols-3 tw-gap-4">
      <div className="tw-col-span-1 tailwind-scope">
        {/*  <CommonProfileSearch
        value=""
        placeholder="User"
        onProfileSelect={onTargetSelect}
      /> */}
        <div className="tw-relative">
          <svg
            className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-h-5 tw-w-5 tw-text-iron-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            placeholder="Search"
            className="tw-pl-11 tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent hover:tw-ring-neutral-600 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
    </div>
  );
}
