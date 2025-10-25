import type { MenuItemsProps } from "@headlessui/react";

export const DEFAULT_TRIGGER_CLASSES =
  "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

export const DEFAULT_MENU_CLASSES =
  "tw-z-50 tw-mt-2 tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus:tw-outline-none";

export const DEFAULT_ITEM_CLASSES =
  "tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-transition tw-duration-150 tw-ease-out";

export const DEFAULT_ACTIVE_ITEM_CLASSES = "tw-text-primary-300";

export const DEFAULT_INACTIVE_ITEM_CLASSES =
  "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50";

export const DEFAULT_FOCUS_ITEM_CLASSES = "tw-bg-iron-800 tw-text-iron-50";

export const DEFAULT_ANCHOR: MenuItemsProps["anchor"] = "bottom end";
