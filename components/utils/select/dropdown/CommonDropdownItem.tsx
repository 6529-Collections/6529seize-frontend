import { useEffect, useState } from "react";
import CommonTableSortIcon from "../../../user/utils/icons/CommonTableSortIcon";
import { CommonSelectItemProps } from "../CommonSelect";
import { SortDirection } from "../../../../entities/ISort";

import { Inter } from "next/font/google";
import React from "react";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function CommonDropdownItem<T, U = unknown>(
  props: Readonly<CommonSelectItemProps<T, U>>
) {
  const { item, activeItem, setSelected, sortDirection, children } = props;

  const [isActive, setIsActive] = useState<boolean>(item.value === activeItem);

  useEffect(() => {
    setIsActive(item.value === activeItem);
  }, [activeItem]);

  const [shouldRotate, setShouldRotate] = useState<boolean>(false);

  const onSelected = () => {
    setSelected(item.value);
    setShouldRotate(false);
  };

  return (
    <li className={`${inter.className} tw-h-full`}>
      <button
        type="button"
        className="tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 tw-py-3 hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
        onClick={onSelected}
        onMouseEnter={() => setShouldRotate(true)}
        onMouseLeave={() => setShouldRotate(false)}
      >
        <div className="tw-w-44 tw-truncate">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            {item.mobileLabel ?? item.label}
          </span>
          {sortDirection && (
            <CommonTableSortIcon
              direction={isActive ? sortDirection : SortDirection.DESC}
              isActive={isActive}
              shouldRotate={isActive && shouldRotate}
            />
          )}
          {item.value === activeItem && (
            <svg
              className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
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
        {React.isValidElement(children) &&
          React.cloneElement(children, {
            onTitle: () => console.log("childs"),
          })}
      </button>
    </li>
  );
}
