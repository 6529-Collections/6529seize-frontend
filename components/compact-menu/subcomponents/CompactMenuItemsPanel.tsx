import { useCallback } from "react";
import { MenuItem } from "@headlessui/react";
import clsx from "clsx";
import type { CompactMenuItem, CompactMenuProps } from "../types";
import {
  DEFAULT_ACTIVE_ITEM_CLASSES,
  DEFAULT_FOCUS_ITEM_CLASSES,
  DEFAULT_INACTIVE_ITEM_CLASSES,
  DEFAULT_ITEM_CLASSES,
} from "../constants";

interface CompactMenuItemsPanelProps {
  readonly items: CompactMenuProps["items"];
  readonly activeItemId?: CompactMenuProps["activeItemId"];
  readonly onItemSelect?: CompactMenuProps["onItemSelect"];
  readonly close: () => void;
  readonly closeOnSelect: boolean;
  readonly itemClassName?: CompactMenuProps["itemClassName"];
  readonly activeItemClassName?: CompactMenuProps["activeItemClassName"];
  readonly inactiveItemClassName?: CompactMenuProps["inactiveItemClassName"];
  readonly focusItemClassName?: CompactMenuProps["focusItemClassName"];
  readonly itemsWrapperClassName?: CompactMenuProps["itemsWrapperClassName"];
  readonly unstyledItems?: boolean;
}

export function CompactMenuItemsPanel({
  items,
  activeItemId,
  onItemSelect,
  close,
  closeOnSelect,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  focusItemClassName,
  itemsWrapperClassName,
  unstyledItems = false,
}: CompactMenuItemsPanelProps) {
  const handleItemClick = useCallback(
    (item: CompactMenuItem) => {
      if (item.disabled) {
        return;
      }
      if (closeOnSelect) {
        close();
      }
      item.onSelect?.();
      onItemSelect?.(item.id);
    },
    [close, closeOnSelect, onItemSelect],
  );

  return (
    <div className={clsx("tw-flex tw-flex-col", itemsWrapperClassName)}>
      {items.map((item) => {
        const isActive = item.active ?? activeItemId === item.id;

        return (
          <MenuItem
            key={item.id}
            as="button"
            type="button"
            disabled={item.disabled}
            aria-label={item.ariaLabel}
            data-compact-menu-item="true"
            data-menu-item-id={item.id}
            data-active={isActive ? "true" : "false"}
            data-disabled={item.disabled ? "true" : "false"}
            data-testid={item["data-testid"]}
            onClick={() => handleItemClick(item)}
            className={({ active }) =>
              clsx(
                unstyledItems ? undefined : DEFAULT_ITEM_CLASSES,
                isActive
                  ? clsx(
                      unstyledItems ? undefined : DEFAULT_ACTIVE_ITEM_CLASSES,
                      activeItemClassName,
                    )
                  : clsx(
                      unstyledItems ? undefined : DEFAULT_INACTIVE_ITEM_CLASSES,
                      inactiveItemClassName,
                    ),
                active && !item.disabled && !isActive
                  ? clsx(
                      unstyledItems ? undefined : DEFAULT_FOCUS_ITEM_CLASSES,
                      focusItemClassName,
                    )
                  : undefined,
                itemClassName,
                item.className,
                item.disabled &&
                  "tw-cursor-not-allowed tw-opacity-60 tw-text-iron-500",
              )
            }
          >
            {item.icon && (
              <span className="tw-flex tw-shrink-0 tw-items-center tw-justify-center">
                {item.icon}
              </span>
            )}
            <span className="tw-flex-1 tw-text-left">{item.label}</span>
          </MenuItem>
        );
      })}
    </div>
  );
}
