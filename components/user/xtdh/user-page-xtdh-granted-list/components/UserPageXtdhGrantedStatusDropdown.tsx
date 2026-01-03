"use client";

import { useAnimate } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdownItemsWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsWrapper";
import {
  DEFAULT_STATUS,
  DEFAULT_STATUSES,
  STATUS_LABELS,
  areAllGrantedStatuses,
  normalizeGrantedStatuses,
} from "../constants";
import type { GrantedFilterStatus, GrantedFilterStatuses } from "../types";

interface UserPageXtdhGrantedStatusDropdownProps {
  readonly items: CommonSelectItem<GrantedFilterStatus>[];
  readonly selectedStatuses: GrantedFilterStatuses;
  readonly onChange: (statuses: GrantedFilterStatuses) => void;
  readonly filterLabel: string;
  readonly disabled?: boolean | undefined;
}

export function UserPageXtdhGrantedStatusDropdown({
  items,
  selectedStatuses,
  onChange,
  filterLabel,
  disabled = false,
}: Readonly<UserPageXtdhGrantedStatusDropdownProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();

  useEffect(() => {
    if (!iconScope.current) return;
    animateIcon(iconScope.current, { rotate: isOpen ? 0 : -90 });
  }, [animateIcon, iconScope, isOpen]);

  const normalizedSelection = useMemo(
    () => normalizeGrantedStatuses(selectedStatuses),
    [selectedStatuses]
  );

  const labelByStatus = useMemo(() => {
    return items.reduce<Record<GrantedFilterStatus, string>>((acc, item) => {
      acc[item.value] = item.label;
      return acc;
    }, {} as Record<GrantedFilterStatus, string>);
  }, [items]);

  const triggerLabel = useMemo(() => {
    if (areAllGrantedStatuses(normalizedSelection)) {
      return labelByStatus[DEFAULT_STATUS] ?? STATUS_LABELS[DEFAULT_STATUS];
    }

    if (normalizedSelection.length === 1) {
      const [status] = normalizedSelection;
      return labelByStatus[status!] ?? STATUS_LABELS[status!];
    }

    if (normalizedSelection.length === 2) {
      const [first, second] = normalizedSelection;
      return `${STATUS_LABELS[first!]} + ${STATUS_LABELS[second!]}`;
    }

    const [primary, ...rest] = normalizedSelection;
    const extraCount = rest.length;
    return `${STATUS_LABELS[primary!]} +${extraCount} more`;
  }, [labelByStatus, normalizedSelection]);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (status: GrantedFilterStatus) => {
    if (disabled) return;

    if (status === DEFAULT_STATUS) {
      onChange(DEFAULT_STATUSES);
      setIsOpen(false);
      return;
    }

    const selection = new Set(
      normalizedSelection.filter((item) => item !== DEFAULT_STATUS)
    );

    if (selection.has(status)) {
      selection.delete(status);
    } else {
      selection.add(status);
    }

    const next = normalizeGrantedStatuses(Array.from(selection));
    onChange(next);
  };

  const isStatusSelected = (status: GrantedFilterStatus): boolean => {
    if (status === DEFAULT_STATUS) {
      return areAllGrantedStatuses(normalizedSelection);
    }
    return normalizedSelection.includes(status);
  };

  return (
    <div className="tw-w-full tw-h-full">
      <div className="tw-relative tw-w-full">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={`${filterLabel}: ${triggerLabel}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${
            disabled
              ? "tw-opacity-50 tw-text-iron-400"
              : "hover:tw-ring-iron-600 tw-text-iron-300"
          } tw-bg-iron-800 lg:tw-bg-iron-900 tw-py-3 tw-w-full tw-truncate tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-pl-3.5 tw-pr-10 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between`}
        >
          {triggerLabel}
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
            <svg
              ref={iconScope}
              className="tw-h-5 tw-w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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
          </div>
        </button>
      </div>
      <CommonDropdownItemsWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
        filterLabel={filterLabel}
        dynamicPosition={true}
        onIsMobile={() => {}} // Mobile state unused: dropdown layout identical across breakpoints
      >
        {items.map((item) => (
          <StatusDropdownItem
            key={item.key}
            item={item}
            onToggle={() => handleToggle(item.value)}
            isSelected={isStatusSelected(item.value)}
            disabled={disabled}
          />
        ))}
      </CommonDropdownItemsWrapper>
    </div>
  );
}

interface StatusDropdownItemProps {
  readonly item: CommonSelectItem<GrantedFilterStatus>;
  readonly onToggle: () => void;
  readonly isSelected: boolean;
  readonly disabled: boolean;
}

function StatusDropdownItem({
  item,
  onToggle,
  isSelected,
  disabled,
}: Readonly<StatusDropdownItemProps>) {
  return (
    <li className="tw-h-full" role="none">
      <button
        type="button"
        className={`${
          disabled ? "tw-cursor-not-allowed tw-opacity-60" : ""
        } tw-px-3 tw-py-2 tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
          isSelected ? "tw-bg-iron-800 tw-text-iron-100" : ""
        }`}
        role="menuitemcheckbox"
        aria-checked={isSelected}
        onClick={onToggle}
        disabled={disabled}
      >
        <span className="tw-truncate tw-text-sm tw-font-medium">
          {item.label}
        </span>
        {isSelected && (
          <FontAwesomeIcon
            icon={faCheck}
            className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-300 tw-transition tw-duration-200 tw-ease-out"
            aria-hidden="true"
          />
        )}
      </button>
    </li>
  );
}
