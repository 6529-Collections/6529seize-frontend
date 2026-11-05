import type { CSSProperties } from "react";

export const COMPOSER_ACTION_BUTTON_CLASS_NAME =
  "tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

export const COMPOSER_ACTION_IDLE_CLASS_NAME =
  "tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100";

export const COMPOSER_ACTION_ICON_CLASS_NAME = "tw-size-5 tw-flex-shrink-0";

export const COMPOSER_ROW_GAP_CLASS_NAME = "tw-gap-x-1 sm:tw-gap-x-2";

export const COMPOSER_ROW_PADDING_CLASS_NAME = "tw-px-2 tw-py-2 sm:tw-px-3";

export const COMPOSER_INPUT_CLASS_NAME =
  "tw-block tw-min-h-10 tw-w-full tw-min-w-0 tw-resize-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-py-2 tw-pl-3 tw-pr-10 tw-text-sm tw-leading-6 tw-text-iron-100 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";

export function getNativeComposerStyle(
  isApp: boolean
): CSSProperties | undefined {
  return isApp
    ? {
        paddingBottom:
          "var(--native-keyboard-composer-bottom-padding, max(env(safe-area-inset-bottom,0px), 0.5rem))",
        transition:
          "padding-bottom var(--native-keyboard-layout-transition-duration, 0ms) var(--native-keyboard-layout-transition-easing, ease-out)",
      }
    : undefined;
}
