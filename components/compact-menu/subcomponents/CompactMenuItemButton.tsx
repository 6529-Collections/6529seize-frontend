import clsx from "clsx";
import { MenuItem } from "@headlessui/react";
import Link from "next/link";
import type { CompactMenuActionItem } from "../types";
import {
  DEFAULT_ACTIVE_ITEM_CLASSES,
  DEFAULT_FOCUS_ITEM_CLASSES,
  DEFAULT_INACTIVE_ITEM_CLASSES,
  DEFAULT_ITEM_CLASSES,
} from "../constants";

interface CompactMenuItemButtonProps {
  readonly item: CompactMenuActionItem;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly itemClassName?: string | undefined;
  readonly activeItemClassName?: string | undefined;
  readonly inactiveItemClassName?: string | undefined;
  readonly focusItemClassName?: string | undefined;
  readonly unstyledItems?: boolean | undefined;
}

export function CompactMenuItemButton({
  item,
  isActive,
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

  const role = item.role ?? "menuitem";
  const className = ({ focus }: { readonly focus: boolean }) =>
    clsx(
      unstyledItems ? undefined : DEFAULT_ITEM_CLASSES,
      stateClasses,
      focus &&
        !item.disabled &&
        !isActive &&
        clsx(focusDefaultClasses, focusItemClassName),
      itemClassName,
      item.className,
      item.disabled &&
        !unstyledItems &&
        "tw-cursor-not-allowed tw-text-iron-500 tw-opacity-60"
    );
  const showIcon =
    item.icon !== undefined && item.icon !== null && item.icon !== false;
  const contents = (
    <>
      {showIcon && (
        <span
          className={
            item.iconClassName ??
            "tw-flex tw-shrink-0 tw-items-center tw-justify-center"
          }
        >
          {item.icon}
        </span>
      )}
      <span className="tw-flex-1 tw-text-left">{item.label}</span>
    </>
  );

  return (
    <MenuItem disabled={Boolean(item.disabled)}>
      {({ focus }) =>
        item.href !== undefined && !item.disabled ? (
          <Link
            href={item.href}
            role={role}
            aria-selected={item.ariaSelected}
            aria-label={item.ariaLabel}
            data-compact-menu-item="true"
            data-menu-item-id={item.id}
            data-active={isActive ? "true" : "false"}
            data-testid={item["data-testid"]}
            onClick={onClick}
            className={className({ focus })}
          >
            {contents}
          </Link>
        ) : (
          <button
            type="button"
            role={role}
            aria-selected={item.ariaSelected}
            aria-label={item.ariaLabel}
            disabled={item.disabled}
            data-compact-menu-item="true"
            data-menu-item-id={item.id}
            data-active={isActive ? "true" : "false"}
            data-disabled={item.disabled ? "true" : undefined}
            data-testid={item["data-testid"]}
            onClick={onClick}
            className={className({ focus })}
          >
            {contents}
          </button>
        )
      }
    </MenuItem>
  );
}
