import { Fragment, useCallback } from "react";
import { MenuItem } from "@headlessui/react";
import clsx from "clsx";
import type { CompactMenuItem, CompactMenuProps } from "../types";
import { CompactMenuItemButton } from "./CompactMenuItemButton";

interface CompactMenuItemsPanelProps {
  readonly items: CompactMenuProps["items"];
  readonly activeItemId?: CompactMenuProps["activeItemId"] | undefined;
  readonly onItemSelect?: CompactMenuProps["onItemSelect"] | undefined;
  readonly close: () => void;
  readonly closeOnSelect: boolean;
  readonly itemClassName?: CompactMenuProps["itemClassName"] | undefined;
  readonly activeItemClassName?: CompactMenuProps["activeItemClassName"] | undefined;
  readonly inactiveItemClassName?: CompactMenuProps["inactiveItemClassName"] | undefined;
  readonly focusItemClassName?: CompactMenuProps["focusItemClassName"] | undefined;
  readonly itemsWrapperClassName?: CompactMenuProps["itemsWrapperClassName"] | undefined;
  readonly unstyledItems?: boolean | undefined;
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
          <MenuItem key={item.id} as={Fragment} disabled={!!item.disabled}>
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
