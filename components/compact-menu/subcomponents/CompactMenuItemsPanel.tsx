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
  readonly header?: CompactMenuProps["header"] | undefined;
  readonly headerClassName?: CompactMenuProps["headerClassName"] | undefined;
  readonly itemClassName?: CompactMenuProps["itemClassName"] | undefined;
  readonly activeItemClassName?:
    | CompactMenuProps["activeItemClassName"]
    | undefined;
  readonly inactiveItemClassName?:
    | CompactMenuProps["inactiveItemClassName"]
    | undefined;
  readonly focusItemClassName?:
    | CompactMenuProps["focusItemClassName"]
    | undefined;
  readonly itemsWrapperClassName?:
    | CompactMenuProps["itemsWrapperClassName"]
    | undefined;
  readonly unstyledItems?: boolean | undefined;
}

export function CompactMenuItemsPanel({
  items,
  activeItemId,
  onItemSelect,
  close,
  closeOnSelect,
  header,
  headerClassName,
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
    [close, closeOnSelect, onItemSelect]
  );

  return (
    <div className={clsx("tw-flex tw-flex-col", itemsWrapperClassName)}>
      {header !== undefined && header !== null && (
        <div className={headerClassName}>{header}</div>
      )}
      {items.map((item) => {
        if (item.kind === "section") {
          return (
            <div
              key={item.id}
              role="presentation"
              className={clsx(
                "tw-mt-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-px-3 tw-pb-1.5 tw-pt-3 first:tw-mt-0 first:tw-border-t-0 first:tw-pt-0",
                item.className
              )}
            >
              <span className="tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-500">
                {item.label}
              </span>
            </div>
          );
        }

        const isActive = item.active ?? activeItemId === item.id;

        return (
          <MenuItem key={item.id} as={Fragment} disabled={!!item.disabled}>
            {({ focus }) => (
              <CompactMenuItemButton
                item={item}
                isActive={isActive}
                menuActive={focus}
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
