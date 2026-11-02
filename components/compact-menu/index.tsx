"use client";

import { Menu, MenuItems } from "@headlessui/react";
import clsx from "clsx";
import { CompactMenuTrigger } from "./subcomponents/CompactMenuTrigger";
import { CompactMenuItemsPanel } from "./subcomponents/CompactMenuItemsPanel";
import { useCompactMenuFocus } from "./hooks/useCompactMenuFocus";
import { DEFAULT_ANCHOR, DEFAULT_MENU_CLASSES } from "./constants";
import type { CompactMenuProps } from "./types";

export function CompactMenu({
  trigger,
  items,
  onItemSelect,
  className,
  triggerClassName,
  triggerAsChild,
  unstyledTrigger,
  menuClassName,
  unstyledMenu,
  header,
  headerClassName,
  itemsWrapperClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  focusItemClassName,
  anchor,
  menuWidthClassName,
  disabled,
  activeItemId,
  closeOnSelect,
  autoFocusItem,
  "aria-label": ariaLabel,
  unstyledItems,
}: Readonly<CompactMenuProps>) {
  return (
    <Menu as="div" className={clsx("tw-relative", className)}>
      {({ open, close }) => (
        <CompactMenuContent
          trigger={trigger}
          items={items}
          onItemSelect={onItemSelect}
          triggerClassName={triggerClassName}
          triggerAsChild={triggerAsChild}
          unstyledTrigger={unstyledTrigger}
          menuClassName={menuClassName}
          unstyledMenu={unstyledMenu}
          header={header}
          headerClassName={headerClassName}
          itemsWrapperClassName={itemsWrapperClassName}
          itemClassName={itemClassName}
          activeItemClassName={activeItemClassName}
          inactiveItemClassName={inactiveItemClassName}
          focusItemClassName={focusItemClassName}
          anchor={anchor}
          menuWidthClassName={menuWidthClassName}
          disabled={disabled}
          activeItemId={activeItemId}
          closeOnSelect={closeOnSelect}
          autoFocusItem={autoFocusItem}
          ariaLabel={ariaLabel}
          unstyledItems={unstyledItems}
          isOpen={open}
          close={close}
        />
      )}
    </Menu>
  );
}

interface CompactMenuContentProps extends Omit<
  CompactMenuProps,
  "className" | "menuWidthClassName" | "anchor" | "aria-label"
> {
  readonly anchor: CompactMenuProps["anchor"];
  readonly menuWidthClassName: CompactMenuProps["menuWidthClassName"];
  readonly ariaLabel: CompactMenuProps["aria-label"];
  readonly isOpen: boolean;
  readonly close: () => void;
}

function CompactMenuContent({
  trigger,
  items,
  onItemSelect,
  triggerClassName,
  triggerAsChild = false,
  unstyledTrigger = false,
  menuClassName,
  unstyledMenu = false,
  header,
  headerClassName,
  itemsWrapperClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  focusItemClassName,
  anchor,
  menuWidthClassName = "tw-w-40",
  disabled = false,
  activeItemId,
  closeOnSelect = true,
  autoFocusItem = true,
  ariaLabel,
  unstyledItems = false,
  isOpen,
  close,
}: Readonly<CompactMenuContentProps>) {
  const { menuItemsRef } = useCompactMenuFocus(isOpen, autoFocusItem);
  const menuAnchor = anchor ?? DEFAULT_ANCHOR;

  return (
    <>
      <CompactMenuTrigger
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerAsChild={triggerAsChild}
        unstyledTrigger={unstyledTrigger}
        disabled={disabled}
        ariaLabel={ariaLabel}
        isOpen={isOpen}
        close={close}
      />
      <MenuItems
        transition
        ref={menuItemsRef}
        anchor={menuAnchor}
        className={clsx(
          "tw-group/compact-menu tw-transition data-[closed]:tw-translate-y-1 data-[closed]:tw-opacity-0 data-[enter]:tw-duration-150 data-[leave]:tw-duration-100 data-[enter]:tw-ease-out data-[leave]:tw-ease-in",
          unstyledMenu ? undefined : DEFAULT_MENU_CLASSES,
          menuWidthClassName,
          menuClassName
        )}
      >
        <CompactMenuItemsPanel
          items={items}
          activeItemId={activeItemId}
          onItemSelect={onItemSelect}
          close={close}
          closeOnSelect={closeOnSelect}
          header={header}
          headerClassName={headerClassName}
          itemClassName={itemClassName}
          activeItemClassName={activeItemClassName}
          inactiveItemClassName={inactiveItemClassName}
          focusItemClassName={focusItemClassName}
          itemsWrapperClassName={itemsWrapperClassName}
          unstyledItems={unstyledItems}
        />
      </MenuItems>
    </>
  );
}

export type { CompactMenuItem } from "./types";
