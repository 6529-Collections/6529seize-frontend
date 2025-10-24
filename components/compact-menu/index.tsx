"use client";

import { Fragment } from "react";
import { Menu, MenuItems, Transition } from "@headlessui/react";
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
  unstyledTrigger,
  menuClassName,
  unstyledMenu,
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
          unstyledTrigger={unstyledTrigger}
          menuClassName={menuClassName}
          unstyledMenu={unstyledMenu}
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
          ariaLabel={ariaLabel}
          unstyledItems={unstyledItems}
          isOpen={open}
          close={close}
        />
      )}
    </Menu>
  );
}

interface CompactMenuContentProps
  extends Omit<
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
  unstyledTrigger = false,
  menuClassName,
  unstyledMenu = false,
  itemsWrapperClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  focusItemClassName,
  anchor = DEFAULT_ANCHOR,
  menuWidthClassName = "tw-w-40",
  disabled = false,
  activeItemId,
  closeOnSelect = true,
  ariaLabel,
  unstyledItems = false,
  isOpen,
  close,
}: Readonly<CompactMenuContentProps>) {
  const { menuItemsRef, focusInitialMenuItem } = useCompactMenuFocus(isOpen);

  return (
    <>
      <CompactMenuTrigger
        trigger={trigger}
        triggerClassName={triggerClassName}
        unstyledTrigger={unstyledTrigger}
        disabled={disabled}
        ariaLabel={ariaLabel}
        isOpen={isOpen}
        close={close}
      />
      <Transition
        as={Fragment}
        enter="tw-transition tw-duration-150 tw-ease-out"
        enterFrom="tw-opacity-0 tw-translate-y-1"
        enterTo="tw-opacity-100 tw-translate-y-0"
        leave="tw-transition tw-duration-100 tw-ease-in"
        leaveFrom="tw-opacity-100 tw-translate-y-0"
        leaveTo="tw-opacity-0 tw-translate-y-1"
        afterEnter={focusInitialMenuItem}
      >
        <MenuItems
          ref={menuItemsRef}
          anchor={anchor}
          className={clsx(
            unstyledMenu ? undefined : DEFAULT_MENU_CLASSES,
            menuWidthClassName,
            menuClassName,
          )}
        >
          <CompactMenuItemsPanel
            items={items}
            activeItemId={activeItemId}
            onItemSelect={onItemSelect}
            close={close}
            closeOnSelect={closeOnSelect}
            itemClassName={itemClassName}
            activeItemClassName={activeItemClassName}
            inactiveItemClassName={inactiveItemClassName}
            focusItemClassName={focusItemClassName}
            itemsWrapperClassName={itemsWrapperClassName}
            unstyledItems={unstyledItems}
          />
        </MenuItems>
      </Transition>
    </>
  );
}

export type { CompactMenuItem, CompactMenuProps } from "./types";
