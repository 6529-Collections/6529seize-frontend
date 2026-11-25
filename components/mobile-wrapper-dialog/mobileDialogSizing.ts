import type { CSSProperties } from "react";

const MOBILE_DIALOG_KEYBOARD_INSET =
  "var(--mobile-wrapper-dialog-keyboard-inset, 0px)";
export const MOBILE_DIALOG_VIEWPORT_RESERVE =
  "var(--mobile-wrapper-dialog-viewport-reserve, 4rem)";
const EXPANDABLE_DIALOG_VIEWPORT_RESERVE =
  "max(0.75rem, env(safe-area-inset-top, 0px))";
const NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";
const NATIVE_KEYBOARD_LAYOUT_TRANSITION_EASING =
  "var(--native-keyboard-layout-transition-easing, ease-out)";

function getDialogHeight({
  tall,
  isCapacitor,
}: {
  readonly tall?: boolean | undefined;
  readonly isCapacitor: boolean;
}): string {
  const viewportHeight = "min(100vh, 100svh)";
  const restingHeight =
    tall && !isCapacitor
      ? `calc(${viewportHeight} - 4rem)`
      : `calc(${viewportHeight} - 10rem)`;
  const keyboardAvailableHeight =
    `max(0px, calc(${viewportHeight} - ${MOBILE_DIALOG_VIEWPORT_RESERVE} - ` +
    `${MOBILE_DIALOG_KEYBOARD_INSET}))`;

  return `min(var(--mobile-wrapper-dialog-resting-height, ${restingHeight}), var(--mobile-wrapper-dialog-available-height, ${keyboardAvailableHeight}))`;
}

function getExpandableDialogHeight(expanded: boolean, dragOffset: number) {
  const availableHeight = `var(--mobile-wrapper-dialog-available-height, max(0px, calc(min(100vh, 100svh) - ${MOBILE_DIALOG_VIEWPORT_RESERVE} - ${MOBILE_DIALOG_KEYBOARD_INSET})))`;
  if (expanded) return availableHeight;
  const upwardDrag = Math.max(0, -dragOffset);
  return `min(${availableHeight}, calc(${availableHeight} / 2 + ${upwardDrag}px))`;
}

// Animate layout offset with the surface height. A compositor transform can
// outrun height layout on iOS, briefly pushing the sheet offscreen.
export function getMobileDialogContainerStyle({
  keyboardTransitionEasing = NATIVE_KEYBOARD_LAYOUT_TRANSITION_EASING,
  desktopTopOffset,
  canResize,
  avoidKeyboard,
}: {
  readonly keyboardTransitionEasing?: string | undefined;
  readonly desktopTopOffset: number;
  readonly canResize: boolean;
  readonly avoidKeyboard: boolean;
}): CSSProperties {
  return {
    bottom: MOBILE_DIALOG_KEYBOARD_INSET,
    transition: `bottom ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION} ${keyboardTransitionEasing}`,
    "--mobile-wrapper-dialog-top-offset": `${desktopTopOffset}vh`,
    ...(canResize && {
      "--mobile-wrapper-dialog-viewport-reserve":
        EXPANDABLE_DIALOG_VIEWPORT_RESERVE,
    }),
    ...(!avoidKeyboard && { "--mobile-wrapper-dialog-keyboard-inset": "0px" }),
  } as CSSProperties;
}

export function getMobileDialogSurfaceStyle({
  tall,
  isCapacitor,
  fixedHeight,
  keyboardTransitionEasing = NATIVE_KEYBOARD_LAYOUT_TRANSITION_EASING,
  resize,
}: {
  readonly tall?: boolean | undefined;
  readonly isCapacitor: boolean;
  readonly fixedHeight?: boolean | undefined;
  readonly keyboardTransitionEasing?: string | undefined;
  readonly resize?:
    | {
        readonly isExpanded: boolean;
        readonly dragOffset: number;
        readonly isDragging: boolean;
      }
    | undefined;
}): CSSProperties {
  const dialogHeight = resize
    ? getExpandableDialogHeight(resize.isExpanded, resize.dragOffset)
    : getDialogHeight({ tall, isCapacitor });
  const isFixed = resize !== undefined || fixedHeight === true;
  const dimension = isFixed ? "height" : "max-height";
  const size = isFixed ? { height: dialogHeight } : { maxHeight: dialogHeight };
  const duration = resize
    ? `max(160ms, ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION})`
    : NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION;
  return {
    ...size,
    transition: resize?.isDragging
      ? "none"
      : `${dimension} ${duration} ${keyboardTransitionEasing}`,
  };
}
