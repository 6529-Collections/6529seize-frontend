import { AllowlistPhaseWithComponentAndItems } from "../../../allowlist-tool.types";
import AllowlistToolJsonIcon from "../../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderResultsPhaseComponent from "./AllowlistToolBuilderResultsPhaseComponent";

export default function AllowlistToolBuilderResultsPhase({
  phase,
}: {
  phase: AllowlistPhaseWithComponentAndItems;
}) {
  return (
    <>
      <div className="tw-cursor-pointer tw-grid tw-grid-cols-9 tw-items-center tw-gap-x-4">
        <div className="tw-col-span-2">
          <div className="tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-inline-flex tw-items-center tw-gap-x-3">
                {phase.name}
              </div>
            </div>
          </div>
        </div>
        <div className="tw-col-span-2">
          <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phase.description}
          </div>
        </div>
        <div className="tw-col-span-2 tw-px-3 tw-py-2">
          <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phase.winnersWalletsCount}
          </div>
        </div>
        <div className="tw-col-span-2 tw-px-3 tw-py-2">
          <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phase.winnersSpotsCount}
          </div>
        </div>
        <div className="tw-col-span-1">
          <div className="tw-py-2 tw-pl-3 tw-pr-4 sm:tw-pr-6">
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2.5">
              <button
                type="button"
                className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-w-8 tw-h-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
              >
                <div className="tw-h-4 tw-w-4 tw-flex tw-justify-center tw-items-center">
                  <AllowlistToolJsonIcon />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {phase.components.map((component) => (
        <AllowlistToolBuilderResultsPhaseComponent
          key={component.id}
          phaseComponent={component}
        />
      ))}
    </>
  );
}
