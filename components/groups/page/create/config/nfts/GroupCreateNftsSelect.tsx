import { GroupOwnsNft } from "../../../../../../generated/models/GroupOwnsNft";
import { NFTSearchResult } from "../../../../../header/header-search/HeaderSearchModalItem";
import GroupCreateNftSearch from "./GroupCreateNftSearch";

export default function GroupCreateNftsSelect({
  selected,
  onSelect,
}: {
  readonly selected: GroupOwnsNft[];
  readonly onSelect: (item: NFTSearchResult) => void;
}) {
  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
        Search NFT&apos;s
      </p>
      <div className="tw-mt-2 sm:tw-mt-3">
        <GroupCreateNftSearch onSelect={onSelect} selected={selected} />
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-3">
        <div className="tw-flex tw-items-center tw-gap-x-3 tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-ring-iron-700">
          <div className="tw-py-1 tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-h-7 tw-w-7 tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
              <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                  <img
                    src="#"
                    alt="Profile picture"
                    className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                  />
                </div>
              </div>
            </div>
            <span className="tw-text-xs tw-font-semibold tw-text-iron-50">
              UncleSeize
            </span>
            <span className="tw-bg-iron-600 tw-rounded-full tw-h-1 tw-w-1"></span>
            <span className="text-xs tw-font-semibold tw-text-iron-50">
              The Memes
            </span>
          </div>
          <button
            type="button"
            className="tw-h-full tw-bg-transparent tw-border-l tw-border-solid tw-border-y-0 tw-border-r-0 tw-border-iron-700 tw-text-iron-400 hover:tw-text-error tw-flex tw-items-center tw-justify-center tw-group tw-relative tw-transition-all -tw-mr-1.5 tw-duration-300 tw-ease-out"
          >
            <span className="tw-sr-only">Remove</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="tw-size-4 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* <GroupCreateIdentitySelectedItems
    selectedIdentities={selectedIdentities}
  /> */}
    </div>
  );
}
