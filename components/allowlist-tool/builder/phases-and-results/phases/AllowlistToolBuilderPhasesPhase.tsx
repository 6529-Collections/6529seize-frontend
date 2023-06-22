import { useEffect, useState } from "react";
import {
  AllowlistOperationCode,
  AllowlistPhaseWithComponentAndItems,
  AllowlistToolEntity,
} from "../../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderPhasesPhaseComponent from "./components/AllowlistToolBuilderPhasesPhaseComponent";
import { useAnimate } from "framer-motion";
import AllowlistToolBuilderAddOperation from "../../operations/AllowlistToolBuilderAddOperation";
import AllowlistTooBuilderOperationsHistory from "../../operations/history/AllowlistTooBuilderOperationsHistory";

export default function AllowlistToolBuilderPhasesPhase({
  phase,
}: {
  phase: AllowlistPhaseWithComponentAndItems;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [tableScope, animateTable] = useAnimate();
  const [iconScope, animateIcon] = useAnimate();
  useEffect(() => {
    if (isOpen) {
      animateTable(tableScope.current, { height: "auto" });
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateTable(tableScope.current, { height: 0 });
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [isOpen, animateTable, animateIcon, tableScope, iconScope]);
  const validOperations = [AllowlistOperationCode.ADD_COMPONENT];
  const defaultOperation = AllowlistOperationCode.ADD_COMPONENT;

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="tw-cursor-pointer tw-grid tw-grid-cols-13 tw-items-center tw-gap-x-4 hover:tw-bg-neutral-800/50 tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-col-span-3">
          <div className="tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <svg
                ref={iconScope}
                className="tw-h-6 tw-w-6 tw-text-neutral-300 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="tw-whitespace-nowrap tw-truncate tw-text-white">
                {phase.name}
              </div>
            </div>
          </div>
        </div>
        <div className="tw-col-span-2">
          <div className="tw-whitespace-nowrap tw-truncate tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phase.description}
          </div>
        </div>
        <div className="tw-col-span-2 tw-px-3 tw-py-2"></div>
        <div className="tw-col-span-2 tw-px-3 tw-py-2">
          <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phase.walletsCount}
          </div>
        </div>
        <div className="tw-col-span-2 tw-px-3 tw-py-2">
          <div className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phase.tokensCount}
          </div>
        </div>
        <div className="tw-col-span-2">
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
              <AllowlistToolBuilderAddOperation
                validOperations={validOperations}
                title={`Phase "${phase.name}"`}
                targetItemId={phase.id}
                defaultOperation={defaultOperation}
              />
              <AllowlistTooBuilderOperationsHistory
                entityType={AllowlistToolEntity.PHASE}
                targetItemId={phase.id}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="tw-overflow-hidden tw-h-0 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-neutral-800"
        ref={tableScope}
      >
        {phase.components.map((phaseComponent) => (
          <AllowlistToolBuilderPhasesPhaseComponent
            phaseComponent={phaseComponent}
            key={phaseComponent.id}
          />
        ))}
      </div>
    </>
  );
}
