import clsx from "clsx";
import type { CompactMenuItem } from "../types";
import {
  DEFAULT_ACTIVE_ITEM_CLASSES,
  DEFAULT_FOCUS_ITEM_CLASSES,
  DEFAULT_INACTIVE_ITEM_CLASSES,
  DEFAULT_ITEM_CLASSES,
} from "../constants";

interface CompactMenuItemButtonProps {
  readonly item: CompactMenuItem;
  readonly isActive: boolean;
  readonly menuActive: boolean;
  readonly onClick: () => void;
  readonly itemClassName?: string;
  readonly activeItemClassName?: string;
  readonly inactiveItemClassName?: string;
  readonly focusItemClassName?: string;
  readonly unstyledItems?: boolean;
}

export function CompactMenuItemButton({
  item,
  isActive,
  menuActive,
  onClick,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  focusItemClassName,
  unstyledItems = false,
}: CompactMenuItemButtonProps) {
  const activeDefaultClasses = unstyledItems
    ? undefined
    : DEFAULT_ACTIVE_ITEM_CLASSES;
  const inactiveDefaultClasses = unstyledItems
    ? undefined
    : DEFAULT_INACTIVE_ITEM_CLASSES;
  const focusDefaultClasses = unstyledItems
    ? undefined
    : DEFAULT_FOCUS_ITEM_CLASSES;

  const stateClasses = isActive
    ? clsx(activeDefaultClasses, activeItemClassName)
    : clsx(inactiveDefaultClasses, inactiveItemClassName);

  const focusClasses =
    menuActive && !item.disabled && !isActive
      ? clsx(
          focusDefaultClasses,
          focusItemClassName,
        )
      : undefined;

  const role = item.role ?? "menuitem";

  return (
    <button
      type="button"
      role={role}
      aria-selected={item.ariaSelected}
      aria-label={item.ariaLabel}
      disabled={item.disabled}
      data-compact-menu-item="true"
      data-menu-item-id={item.id}
      data-active={isActive ? "true" : "false"}
      data-disabled={item.disabled ? "true" : "false"}
      data-testid={item["data-testid"]}
      onClick={onClick}
      className={clsx(
        unstyledItems ? undefined : DEFAULT_ITEM_CLASSES,
        stateClasses,
        focusClasses,
        itemClassName,
        item.className,
        item.disabled &&
          !unstyledItems &&
          "tw-cursor-not-allowed tw-opacity-60 tw-text-iron-500",
      )}
    >
      {item.icon && (
        <span className="tw-flex tw-shrink-0 tw-items-center tw-justify-center">
          {item.icon}
        </span>
      )}
      <span className="tw-flex-1 tw-text-left">{item.label}</span>
    </button>
  );
}
