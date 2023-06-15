import { useRouter } from "next/router";
import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import { useContext, useEffect, useState } from "react";
import {
  AllowlistOperationCode,
  AllowlistPhaseWithComponentAndItems,
  AllowlistRunStatus,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import AllowlistToolBuilderPhasesPhase from "./AllowlistToolBuilderPhasesPhase";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderPhasesAdd from "./AllowlistToolBuilderPhasesAdd";
import AllowlistToolBuilderAddOperation from "../operations/AllowlistToolBuilderAddOperation";
import AllowlistToolPoolsWrapper from "../../common/pools/AllowlistToolPoolsWrapper";

export default function AllowlistToolBuilderPhases() {
  const router = useRouter();
  const { allowlist, phases, setPhases, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoading, setShowLoading] = useState<boolean>(true);

  useEffect(() => {
    setShowLoading(
      isLoading ||
        (!!allowlist?.activeRun?.status &&
          [AllowlistRunStatus.PENDING, AllowlistRunStatus.CLAIMED].includes(
            allowlist?.activeRun?.status
          ))
    );
  }, [isLoading, allowlist]);

  useEffect(() => {
    async function fetchPhases() {
      setIsLoading(true);
      setPhases([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/phases?withComponentsAndItems=true`
        );
        const data: AllowlistToolResponse<
          AllowlistPhaseWithComponentAndItems[]
        > = await response.json();
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setPhases(data);
        }
      } catch (error: any) {
        setToasts({ messages: [error.message], type: "error" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPhases();
  }, [router.query.id, setPhases, setToasts]);

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
                <div className="tw-bg-neutral-800/50 tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-800 tw-grid tw-grid-cols-12 tw-items-center tw-gap-x-4 sm:tw-gap-x-6">
                  <div className="tw-col-span-2">
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
                        <button
                          type="button"
                          className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                        >
                          <div className="tw-h-[1.125rem] tw-w-[1.125rem] tw-flex tw-items-center tw-justify-center">
                            <AllowlistToolHistoryIcon />
                          </div>
                        </button>
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
