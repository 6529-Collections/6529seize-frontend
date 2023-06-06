import { useAnimate } from "framer-motion";
import {
  AllowlistOperationCode,
  AllowlistPhaseComponentWithItems,
} from "../../../allowlist-tool.types";
import AllowlistToolHistoryIcon from "../../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderPhasesPhaseComponentItem from "./items/AllowlistToolBuilderPhasesPhaseComponentItem";
import React, { useEffect, useState } from "react";
import AllowlistToolBuilderAddOperation from "../../operations/AllowlistToolBuilderAddOperation";

export default function AllowlistToolBuilderPhasesPhaseComponent({
  phaseComponent,
}: {
  phaseComponent: AllowlistPhaseComponentWithItems;
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

  const validOperations: AllowlistOperationCode[] = [
    AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
    AllowlistOperationCode.ADD_ITEM,
  ];
  return (
    <>
      <tr onClick={() => setIsOpen(!isOpen)}>
        <td className="tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-normal tw-text-neutral-50 sm:tw-pl-14">
          <div className="tw-inline-flex tw-items-center tw-gap-x-2">
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
              {phaseComponent.name}
            </div>
          </div>
        </td>
        <td className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
          {phaseComponent.description}
        </td>
        <td className="tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300"></td>
        <td className="tw-w-40 tw-py-2 tw-pl-6 tw-pr-4 tw-text-sm tw-font-normal sm:tw-pr-6">
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
            <button
              type="button"
              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-[1.125rem] tw-w-[1.125rem]">
                <AllowlistToolJsonIcon />
              </div>
            </button>
            <AllowlistToolBuilderAddOperation
              validOperations={validOperations}
              title={`Add operation for component "${phaseComponent.name}"`}
              targetItemId={phaseComponent.componentId}
              defaultOperation={null}
            />
            <button
              type="button"
              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-5 tw-w-5">
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
              <tbody className="tw-divide-y tw-divide-neutral-700/40">
                {phaseComponent.items.map((phaseComponentItem) => (
                  <AllowlistToolBuilderPhasesPhaseComponentItem
                    phaseComponentItem={phaseComponentItem}
                    key={phaseComponentItem.id}
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
