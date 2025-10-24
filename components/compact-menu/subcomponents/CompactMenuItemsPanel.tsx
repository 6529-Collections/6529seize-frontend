import { Fragment, useCallback } from "react";
import { MenuItem } from "@headlessui/react";
import clsx from "clsx";
import type { CompactMenuItem, CompactMenuProps } from "../types";
import { CompactMenuItemButton } from "./CompactMenuItemButton";

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
          <MenuItem key={item.id} as={Fragment} disabled={item.disabled}>
            {({ active }) => (
              <CompactMenuItemButton
                item={item}
                isActive={isActive}
                menuActive={active}
                onClick={() => handleItemClick(item)}
                itemClassName={itemClassName}
                activeItemClassName={activeItemClassName}
                inactiveItemClassName={inactiveItemClassName}
                focusItemClassName={focusItemClassName}
                unstyledItems={unstyledItems}
              />
            )}
          </MenuItem>
        );
      })}
    </div>
  );
}
