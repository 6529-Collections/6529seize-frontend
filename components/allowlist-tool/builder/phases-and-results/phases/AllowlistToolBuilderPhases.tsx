import AllowlistToolExpandableTableWrapper from "../../../common/AllowlistToolExpandableTableWrapper";
import {
  AllowlistOperationCode,
  AllowlistPhaseWithComponentAndItems,
  AllowlistToolEntity,
} from "../../../allowlist-tool.types";
import AllowlistToolBuilderPhasesPhase from "./AllowlistToolBuilderPhasesPhase";
import AllowlistToolJsonIcon from "../../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderPhasesAdd from "./AllowlistToolBuilderPhasesAdd";
import AllowlistToolBuilderAddOperation from "../../operations/AllowlistToolBuilderAddOperation";
import AllowlistToolPoolsWrapper from "../../../common/pools/AllowlistToolPoolsWrapper";
import AllowlistTooBuilderOperationsHistory from "../../operations/history/AllowlistTooBuilderOperationsHistory";

export default function AllowlistToolBuilderPhases({
  showLoading,
  phases,
}: {
  showLoading: boolean;
  phases: AllowlistPhaseWithComponentAndItems[];
}) {
  const validOperations = [AllowlistOperationCode.ADD_PHASE];
  const defaultOperation = AllowlistOperationCode.ADD_PHASE;

  return (
    <AllowlistToolPoolsWrapper isLoading={showLoading}>
      <AllowlistToolExpandableTableWrapper title="Phases">
        <div className="tw-w-full tw-overflow-hidden tw-h-0">
          <div className="tw-border tw-border-neutral-700/60 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-w-full"></div>

          <AllowlistToolBuilderPhasesAdd />

          <div className="tw-mt-8 tw-flex tw-flex-col">
            <div className="tw-overflow-x-auto tw-rounded-b-lg">
              <div className="tw-inline-block tw-min-w-full tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-neutral-800">
                <div className="tw-bg-neutral-800/50 tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-800 tw-grid tw-grid-cols-13 tw-items-center tw-gap-x-4 sm:tw-gap-x-6">
                  <div className="tw-col-span-3">
                    <div className="tw-py-1.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6">
                      Phase name
                    </div>
                  </div>
                  <div className="tw-col-span-2">
                    <div className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                      Description
                    </div>
                  </div>
                  <div className="tw-col-span-2">
                    <div className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                      Pool name
                    </div>
                  </div>
                  <div className="tw-col-span-2">
                    <div className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                      Wallets
                    </div>
                  </div>
                  <div className="tw-col-span-2">
                    <div className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                      Tokens
                    </div>
                  </div>
                  <div className="tw-col-span-2">
                    <div className="tw-px-3 tw-py-1.5 tw-pl-3 tw-pr-4 sm:tw-pr-6 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400">
                      <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2.5">
                        <button
                          type="button"
                          className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                        >
                          <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
                            <AllowlistToolJsonIcon />
                          </div>
                        </button>
                        <AllowlistToolBuilderAddOperation
                          validOperations={validOperations}
                          title={`Phases`}
                          targetItemId={null}
                          defaultOperation={defaultOperation}
                        />
                        <AllowlistTooBuilderOperationsHistory
                          entityType={AllowlistToolEntity.PHASES}
                          targetItemId={null}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tw-flex tw-flex-col tw-bg-neutral-900 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-neutral-800">
                  {phases.map((phase) => (
                    <AllowlistToolBuilderPhasesPhase
                      phase={phase}
                      key={phase.id}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AllowlistToolExpandableTableWrapper>
    </AllowlistToolPoolsWrapper>
  );
}
