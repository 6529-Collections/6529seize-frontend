import { useEffect, useState } from "react";
import {
  AllowlistOperationCode,
  AllowlistPhaseWithComponentAndItems,
} from "../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolPlusIcon from "../../icons/AllowlistToolPlusIcon";
import AllowlistToolBuilderPhasesPhaseComponent from "./components/AllowlistToolBuilderPhasesPhaseComponent";
import { useAnimate } from "framer-motion";
import AllowlistToolBuilderAddOperation from "../operations/AllowlistToolBuilderAddOperation";

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
      <tr
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <td className="tw-cursor-pointer tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6 ">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <svg
              ref={iconScope}
              className="tw-h-6 tw-w-6 tw-text-neutral-300"
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
            <div className="tw-inline-flex tw-items-center tw-gap-x-3">
              {phase.name}
            </div>
          </div>
        </td>
        <td className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
          {phase.description}
        </td>
        <td className="tw-px-3 tw-py-2"></td>
        <td className="tw-w-40 tw-py-2 tw-pl-6 tw-pr-4 tw-text-sm tw-font-normal sm:tw-pr-6">
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
              targetItemId={phase.phaseId}
              defaultOperation={defaultOperation}
            />
            <button
              type="button"
              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-[1.125rem] tw-w-[1.125rem] tw-flex tw-justify-center tw-items-center">
                <AllowlistToolHistoryIcon />
              </div>
            </button>
          </div>
        </td>
      </tr>
      <tr>
        <td colSpan={4}>
          <div className="tw-overflow-hidden tw-h-0" ref={tableScope}>
            <table className="tw-min-w-full">
              <tbody className="tw-divide-y tw-divide-neutral-800">
                {phase.components.map((phaseComponent) => (
                  <AllowlistToolBuilderPhasesPhaseComponent
                    phaseComponent={phaseComponent}
                    key={phaseComponent.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </>
  );
}
