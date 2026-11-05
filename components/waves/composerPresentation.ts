import type { CSSProperties } from "react";

export const COMPOSER_MAX_HEIGHT_PX = 200;

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
