import {  AllowlistPhaseComponentWithItems } from "../../../allowlist-tool.types";
import AllowlistToolJsonIcon from "../../../icons/AllowlistToolJsonIcon";

export default function AllowlistToolBuilderResultsPhaseComponent({
  phaseComponent,
}: {
  phaseComponent: AllowlistPhaseComponentWithItems;
}) {
  return (
    <div className="tw-cursor-pointer tw-grid tw-grid-cols-9 tw-items-center tw-gap-x-4">
      <div className="tw-col-span-2">
        <div className="tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-normal tw-text-neutral-50 sm:tw-pl-[3.25rem]">
          <div className="tw-inline-flex tw-items-center tw-gap-x-3">
            {phaseComponent.name}
          </div>
        </div>
      </div>
      <div className="tw-col-span-2">
        <div className="tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
          {phaseComponent.description}
        </div>
      </div>
      <div className="tw-col-span-2 tw-px-3 tw-py-2">
        <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
          {phaseComponent.winnersWalletsCount}
        </div>
      </div>
      <div className="tw-col-span-2 tw-px-3 tw-py-2">
        <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
          {phaseComponent.winnersSpotsCount}
        </div>
      </div>
      <div className="tw-col-span-1">
        <div className="tw-py-2 tw-pl-3 tw-pr-4 sm:tw-pr-6">
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
            <button
              type="button"
              className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-4 tw-w-4 tw-flex tw-justify-center tw-items-center">
                <AllowlistToolJsonIcon />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
