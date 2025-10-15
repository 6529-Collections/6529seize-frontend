"use client";

import { Fragment, type ReactNode } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import clsx from "clsx";

export interface CompactMenuItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly onSelect?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly active?: boolean;
  readonly "data-testid"?: string;
  readonly role?: string;
  readonly ariaSelected?: boolean;
  readonly ariaLabel?: string;
}

export interface CompactMenuProps {
  readonly trigger:
    | ReactNode
    | ((context: { isOpen: boolean; close: () => void }) => ReactNode);
  readonly items: readonly CompactMenuItem[];
  readonly onItemSelect?: (id: string) => void;
  readonly className?: string;
  readonly triggerClassName?: string;
  readonly unstyledTrigger?: boolean;
  readonly menuClassName?: string;
  readonly unstyledMenu?: boolean;
  readonly itemsWrapperClassName?: string;
  readonly itemClassName?: string;
  readonly activeItemClassName?: string;
  readonly inactiveItemClassName?: string;
  readonly focusItemClassName?: string;
  readonly anchor?: string;
  readonly menuWidthClassName?: string;
  readonly disabled?: boolean;
  readonly activeItemId?: string;
  readonly closeOnSelect?: boolean;
  readonly "aria-label"?: string;
  readonly unstyledItems?: boolean;
}

const DEFAULT_TRIGGER_CLASSES =
  "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

const DEFAULT_MENU_CLASSES =
  "tw-z-50 tw-mt-2 tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus:tw-outline-none";

const DEFAULT_ITEM_CLASSES =
  "tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-transition tw-duration-150 tw-ease-out";

const DEFAULT_ACTIVE_ITEM_CLASSES = "tw-text-primary-300";

const DEFAULT_INACTIVE_ITEM_CLASSES =
  "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50";

const DEFAULT_FOCUS_ITEM_CLASSES = "tw-bg-iron-800 tw-text-iron-50";

export function CompactMenu({
  trigger,
  items,
  onItemSelect,
  className,
  triggerClassName,
  unstyledTrigger = false,
  menuClassName,
  unstyledMenu = false,
  itemsWrapperClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  focusItemClassName,
  anchor = "bottom end",
  menuWidthClassName = "tw-w-40",
  disabled = false,
  activeItemId,
  closeOnSelect = true,
  "aria-label": ariaLabel,
  unstyledItems = false,
}: CompactMenuProps) {
  return (
    <Menu as="div" className={clsx("tw-relative", className)}>
      {({ open, close }) => (
        <>
          <MenuButton
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            className={clsx(
              unstyledTrigger ? undefined : DEFAULT_TRIGGER_CLASSES,
              triggerClassName,
            )}
          >
            {typeof trigger === "function" ? trigger({ isOpen: open, close }) : trigger}
          </MenuButton>
          <Transition
            as={Fragment}
            enter="tw-transition tw-duration-150 tw-ease-out"
            enterFrom="tw-opacity-0 tw-translate-y-1"
            enterTo="tw-opacity-100 tw-translate-y-0"
            leave="tw-transition tw-duration-100 tw-ease-in"
            leaveFrom="tw-opacity-100 tw-translate-y-0"
            leaveTo="tw-opacity-0 tw-translate-y-1"
          >
            <MenuItems
              anchor={anchor}
              className={clsx(
                unstyledMenu ? undefined : DEFAULT_MENU_CLASSES,
                menuWidthClassName,
                menuClassName,
              )}
            >
              <div className={clsx("tw-flex tw-flex-col", itemsWrapperClassName)}>
                {items.map((item) => (
                  <MenuItem key={item.id} disabled={item.disabled}>
                    {({ active }) => {
                      const isActive = item.active ?? activeItemId === item.id;
                      const stateClasses = isActive
                        ? clsx(
                            unstyledItems ? undefined : DEFAULT_ACTIVE_ITEM_CLASSES,
                            activeItemClassName,
                          )
                        : clsx(
                            unstyledItems ? undefined : DEFAULT_INACTIVE_ITEM_CLASSES,
                            inactiveItemClassName,
                          );

                      const focusClasses =
                        active && !item.disabled && !isActive
                          ? clsx(
                              unstyledItems ? undefined : DEFAULT_FOCUS_ITEM_CLASSES,
                              focusItemClassName,
                            )
                          : undefined;

                      const content = (
                        <button
                          type="button"
                          role={item.role}
                          aria-selected={item.ariaSelected}
                          aria-label={item.ariaLabel}
                          data-testid={item["data-testid"]}
                          onClick={() => {
                            if (item.disabled) {
                              return;
                            }
                            if (closeOnSelect) {
                              close();
                            }
                            item.onSelect?.();
                            onItemSelect?.(item.id);
                          }}
                          className={clsx(
                            DEFAULT_ITEM_CLASSES,
                            stateClasses,
                            focusClasses,
                            itemClassName,
                            item.className,
                            item.disabled &&
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

                      return content;
                    }}
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  );
}
