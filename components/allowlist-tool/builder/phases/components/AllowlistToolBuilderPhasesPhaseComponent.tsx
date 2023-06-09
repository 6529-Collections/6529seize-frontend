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
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="tw-cursor-pointer tw-grid tw-grid-cols-11 tw-items-center tw-gap-x-4 hover:tw-bg-neutral-800/50 tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-col-span-3">
          <div className="tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-normal tw-text-neutral-50 sm:tw-pl-[3.25rem]">
            <div className="tw-inline-flex tw-items-center tw-gap-x-2">
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
              <div className="tw-inline-flex tw-items-center tw-gap-x-3">
                {phaseComponent.name}
              </div>
            </div>
          </div>
        </div>
        <div className="tw-col-span-3">
          <div className="tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
            {phaseComponent.description}
          </div>
        </div>
        <div className="tw-col-span-3 tw-px-3 tw-py-2"></div>
        <div className="tw-col-span-2">
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
              <AllowlistToolBuilderAddOperation
                validOperations={validOperations}
                title={`Component "${phaseComponent.name}"`}
                targetItemId={phaseComponent.componentId}
                defaultOperation={null}
              />
              <button
                type="button"
                className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
              >
                <div className="tw-h-[1.125rem] tw-w-[1.125rem] tw-flex tw-justify-center tw-items-center">
                  <AllowlistToolHistoryIcon />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-overflow-hidden tw-h-0 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-neutral-800" ref={tableScope}>
        {phaseComponent.items.map((phaseComponentItem) => (
          <AllowlistToolBuilderPhasesPhaseComponentItem
            phaseComponentItem={phaseComponentItem}
            key={phaseComponentItem.id}
          />
        ))}
      </div>

      {/*     <tr className="tw-hidden">
        <td
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="tw-w-[25%] tw-cursor-pointer tw-whitespace-nowrap tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-font-normal tw-text-neutral-50 sm:tw-pl-14"
        >
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
        <td className="tw-w-[25%] tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300">
          {phaseComponent.description}
        </td>
        <td className="tw-w-[25%] tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-text-neutral-300"></td>
        <td className="tw-w-[25%] tw-py-2 tw-pl-3 tw-pr-4 sm:tw-pr-6 tw-text-sm tw-font-normal">
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
            <button
              type="button"
              className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <div className="tw-h-4 tw-w-4 tw-flex tw-justify-center tw-items-center">
                <AllowlistToolJsonIcon />
              </div>
            </button>
            <AllowlistToolBuilderAddOperation
              validOperations={validOperations}
              title={`Component "${phaseComponent.name}"`}
              targetItemId={phaseComponent.componentId}
              defaultOperation={null}
            />
            <button
              type="button"
              className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
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
            <table className="table-fixed tw-min-w-full">
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
      </tr> */}
    </>
  );
}
