"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { CommonSelectItemProps } from "../CommonSelect";
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
    <li className="tw-h-full" role="none">
      <button
        type="button"
        className={`${
          isMobile ? "tw-px-4 tw-py-3" : "tw-px-3 tw-py-2"
        } tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
          isActive ? "tw-bg-iron-800 tw-text-iron-100" : ""
        }`}
        role="menuitem"
        onClick={onSelected}
        onMouseEnter={() => setShouldRotate(true)}
        onMouseLeave={() => setShouldRotate(false)}>
        <div className="tw-flex tw-flex-1 tw-items-center tw-gap-x-2 tw-min-w-0">
          <span className="tw-truncate tw-text-sm tw-font-medium">{label}</span>
          {sortDirection && (
            <span className="-tw-mt-0.5">
              <CommonTableSortIcon
                direction={isActive ? sortDirection : SortDirection.DESC}
                isActive={isActive}
                shouldRotate={isActive && shouldRotate}
              />
            </span>
          )}
          {item.value === activeItem && (
            <FontAwesomeIcon
              icon={faCheck}
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-300 tw-transition tw-duration-200 tw-ease-out"
              aria-hidden="true"
            />
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
