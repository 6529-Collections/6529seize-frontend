"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import { CommonSelectItemProps } from "../CommonSelect";
import { SortDirection } from "@/entities/ISort";

export default function CommonDropdownItem<T, U = unknown>(
  props: Readonly<CommonSelectItemProps<T, U>>
) {
  const { item, activeItem, setSelected, sortDirection, children, isMobile } =
    props;

  const [isActive, setIsActive] = useState<boolean>(item.value === activeItem);

  useEffect(() => {
    setIsActive(item.value === activeItem);
  }, [activeItem]);

  const [shouldRotate, setShouldRotate] = useState<boolean>(false);

  const onSelected = () => {
    setSelected(item.value);
    setShouldRotate(false);
  };

  const getLabel = (): string => item.mobileLabel ?? item.label;

  const [label, setLabel] = useState<string>(getLabel());

  const onCopy = () => {
    setLabel("Copied!");
    setTimeout(() => {
      setLabel(getLabel());
    }, 1000);
  };

  return (
    <li className="tw-h-full">
      <button
        type="button"
        className={`${
          isMobile
            ? "tw-py-3 hover:tw-bg-iron-800"
            : "hover:tw-bg-iron-700 tw-py-2"
        } tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-inline-flex tw-justify-between  tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
        onClick={onSelected}
        onMouseEnter={() => setShouldRotate(true)}
        onMouseLeave={() => setShouldRotate(false)}>
        <div className="tw-w-44 tw-truncate tw-flex tw-items-center">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            {label}
          </span>
          {sortDirection && (
            <span className="-tw-mt-0.5 tw-ml-2">
              <CommonTableSortIcon
                direction={isActive ? sortDirection : SortDirection.DESC}
                isActive={isActive}
                shouldRotate={isActive && shouldRotate}
              />
            </span>
          )}
          {item.value === activeItem && (
            <svg
              className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {isValidElement(children) &&
          cloneElement(children, {
            onCopy,
          })}
      </button>
    </li>
  );
}
