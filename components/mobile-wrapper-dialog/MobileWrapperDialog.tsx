import useCapacitor from "@/hooks/useCapacitor";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import MobileWrapperDialogCloseButton from "./MobileWrapperDialogCloseButton";
import MobileWrapperDialogHeader from "./MobileWrapperDialogHeader";
import { useMobileDialogDrag } from "./useMobileDialogDrag";

const MOBILE_DIALOG_KEYBOARD_INSET =
  "var(--mobile-wrapper-dialog-keyboard-inset, 0px)";
const NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";
const MOBILE_DIALOG_CONTAINER_STYLE: CSSProperties = {
  bottom: 0,
  transform: `translate3d(0, calc(0px - ${MOBILE_DIALOG_KEYBOARD_INSET}), 0)`,
  transition: `transform ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION} ease-out`,
};

type MobileWrapperDialogProps = {
  readonly title?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onBack?: (() => void) | undefined;
  readonly onBeforeLeave?: (() => void) | undefined;
  readonly onAfterLeave?: (() => void) | undefined;
  readonly children: ReactNode;
  readonly noPadding?: boolean | undefined;
  readonly tall?: boolean | undefined;
  readonly fixedHeight?: boolean | undefined;
  readonly tabletModal?: boolean | undefined;
  readonly showScrollbar?: boolean | undefined;
  readonly allowOverflow?: boolean | undefined;
  readonly maxWidthClass?: string | undefined;
  readonly zIndexClassName?: string | undefined;
  readonly headerClassName?: string | undefined;
  readonly titleActions?: ReactNode;
  readonly headerActions?: ReactNode;
  readonly mobileCloseButtonClassName?: string | undefined;
  readonly showDragHandle?: boolean | undefined;
  readonly enableDragToClose?: boolean | undefined;
  /**
   * Defaults to the shared in-sheet header close button. Disable only for an
   * intentional full-bleed surface that requires the shared floating control.
   */
  readonly showHeaderCloseButton?: boolean | undefined;
  readonly showHeaderDivider?: boolean | undefined;
  readonly headerCloseButtonClassName?: string | undefined;
  readonly surfaceClassName?: string | undefined;
  readonly titleClassName?: string | undefined;
  readonly focusTitleOnOpen?: boolean | undefined;
  readonly backLabel?: string | undefined;
  readonly closeLabel?: string | undefined;
  readonly dismissible?: boolean | undefined;
  readonly hideOnDesktopHover?: boolean | undefined;
};

function getSlideTransition(tabletModal?: boolean) {
  return {
    enter:
      "tw-transform tw-transition-[transform,opacity] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
    enterFrom: clsx(
      "tw-translate-y-full motion-reduce:tw-translate-y-0 motion-reduce:tw-opacity-100",
      tabletModal && "md:tw-translate-y-4 md:tw-opacity-0"
    ),
    enterTo: clsx("tw-translate-y-0", tabletModal && "md:tw-opacity-100"),
    leave:
      "tw-transform tw-transition-[transform,opacity] tw-duration-150 tw-ease-in motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
    leaveFrom: clsx("tw-translate-y-0", tabletModal && "md:tw-opacity-100"),
    leaveTo: clsx(
      "tw-translate-y-full motion-reduce:tw-translate-y-0 motion-reduce:tw-opacity-100",
      tabletModal && "md:tw-translate-y-4 md:tw-opacity-0"
    ),
  };
}

function getOverlayTransition() {
  return {
    enter:
      "tw-transition-opacity tw-duration-200 tw-ease-out motion-reduce:tw-transition-none",
    enterFrom: "tw-opacity-0",
    enterTo: "tw-opacity-100",
    leave:
      "tw-transition-opacity tw-duration-150 tw-ease-in motion-reduce:tw-transition-none",
    leaveFrom: "tw-opacity-100",
    leaveTo: "tw-opacity-0",
  };
}

function getBottomPadding(noPadding?: boolean): string {
  return noPadding
    ? "env(safe-area-inset-bottom,0px)"
    : "calc(env(safe-area-inset-bottom,0px) + 1.5rem)";
}

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
    `max(0px, calc(${viewportHeight} - 4rem - ` +
    `${MOBILE_DIALOG_KEYBOARD_INSET}))`;

  return `min(${restingHeight}, ${keyboardAvailableHeight})`;
}

function getBeforeLeaveProps(onBeforeLeave?: (() => void) | undefined) {
  return onBeforeLeave ? { beforeLeave: onBeforeLeave } : {};
}

function MobileDialogOverlay({
  onBeforeLeave,
  onAfterLeave,
}: {
  readonly onBeforeLeave?: (() => void) | undefined;
  readonly onAfterLeave: () => void;
}) {
  return (
    <TransitionChild
      as={Fragment}
      {...getOverlayTransition()}
      {...getBeforeLeaveProps(onBeforeLeave)}
      afterLeave={onAfterLeave}
    >
      <div className="tw-fixed tw-inset-0 tw-transform-gpu tw-bg-gray-700/60" />
    </TransitionChild>
  );
}

function getPanelClassNames({
  isIos,
  tabletModal,
  maxWidthClass,
}: {
  readonly isIos: boolean;
  readonly tabletModal?: boolean | undefined;
  readonly maxWidthClass?: string | undefined;
}) {
  return clsx(
    "tw-pointer-events-auto tw-relative tw-w-screen",
    !tabletModal && "md:tw-max-w-screen-md",
    !isIos && "tw-transform-gpu",
    !isIos && "tw-will-change-transform",
    tabletModal && ["md:tw-w-full", maxWidthClass ?? "md:tw-max-w-md"]
  );
}

function getDragPanelClassNames(canDragToClose: boolean) {
  return clsx(
    "mobile-wrapper-dialog tw-pointer-events-auto tw-relative tw-w-full",
    canDragToClose &&
      "tw-will-change-transform motion-reduce:!tw-transition-none"
  );
}

function getContainerClassNames(tabletModal?: boolean | undefined) {
  return clsx(
    "tw-pointer-events-none tw-fixed tw-inset-x-0 tw-flex tw-max-w-full tw-justify-center tw-pt-10 [--mobile-wrapper-dialog-keyboard-inset:var(--native-keyboard-inset-bottom,0px)]",
    tabletModal &&
      "md:tw-inset-0 md:tw-items-center md:tw-p-6 md:tw-pt-0 md:[--mobile-wrapper-dialog-keyboard-inset:0px]"
  );
}

function getSurfaceClassNames({
  surfaceClassName,
  allowOverflow,
  tabletModal,
}: {
  readonly surfaceClassName?: string | undefined;
  readonly allowOverflow?: boolean | undefined;
  readonly tabletModal?: boolean | undefined;
}) {
  return clsx(
    "tw-flex tw-flex-col tw-rounded-t-2xl",
    surfaceClassName ?? "tw-bg-iron-950",
    allowOverflow
      ? "mobile-wrapper-dialog-overflow-surface tw-overflow-visible"
      : "tw-overflow-hidden",
    tabletModal && "md:tw-rounded-xl"
  );
}

function getContentClassNames({
  allowOverflow,
  noPadding,
  showScrollbar,
  hasDragHandle,
  tabletModal,
}: {
  readonly allowOverflow?: boolean | undefined;
  readonly noPadding?: boolean | undefined;
  readonly showScrollbar?: boolean | undefined;
  readonly hasDragHandle: boolean;
  readonly tabletModal?: boolean | undefined;
}) {
  let paddingClassName = "tw-py-0";
  if (!noPadding) {
    paddingClassName = clsx(
      "tw-pb-6",
      hasDragHandle ? "tw-pt-0" : "tw-pt-4",
      hasDragHandle && tabletModal && "md:tw-pt-4"
    );
  }

  return clsx(
    "tw-flex tw-min-h-0 tw-flex-1 tw-scroll-py-3 tw-flex-col",
    allowOverflow
      ? "mobile-wrapper-dialog-overflow-content tw-overflow-visible"
      : "tw-overflow-y-auto",
    paddingClassName,
    showScrollbar &&
      !allowOverflow &&
      "tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
  );
}

function getPanelStyle({
  canDragToClose,
  dragOffset,
  isDragging,
}: {
  readonly canDragToClose: boolean;
  readonly dragOffset: number;
  readonly isDragging: boolean;
}): CSSProperties {
  if (!canDragToClose) {
    return { touchAction: "manipulation" };
  }

  return {
    touchAction: "manipulation",
    transform: `translate3d(0, ${dragOffset}px, 0)`,
    transition: isDragging
      ? "none"
      : "transform 150ms cubic-bezier(0.22, 1, 0.36, 1)",
  };
}

function getSurfaceStyle({
  dialogHeight,
  fixedHeight,
}: {
  readonly dialogHeight: string;
  readonly fixedHeight?: boolean | undefined;
}): CSSProperties {
  const dimension = fixedHeight ? "height" : "max-height";
  const size = fixedHeight
    ? { height: dialogHeight }
    : { maxHeight: dialogHeight };

  return {
    ...size,
    transition: `${dimension} ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION} ease-out`,
  };
}

function FloatingCloseButton({
  show,
  hideOnMobile,
  tabletModal,
  onClose,
  mobileCloseButtonClassName,
  closeLabel,
}: {
  readonly show: boolean;
  readonly hideOnMobile: boolean;
  readonly tabletModal?: boolean | undefined;
  readonly onClose: () => void;
  readonly mobileCloseButtonClassName?: string | undefined;
  readonly closeLabel: string;
}) {
  if (!show) {
    return null;
  }

  return (
    <TransitionChild
      as={Fragment}
      enter="tw-duration-200 tw-ease-out motion-reduce:tw-transition-none"
      enterFrom="tw-opacity-0"
      enterTo="tw-opacity-100"
      leave="tw-duration-150 tw-ease-in motion-reduce:tw-transition-none"
      leaveFrom="tw-opacity-100"
      leaveTo="tw-opacity-0"
    >
      <div
        className={clsx(
          "tw-absolute -tw-top-16 tw-right-0 tw-pr-2 tw-pt-4 md:tw-pr-0",
          hideOnMobile ? "tw-hidden" : "tw-flex",
          hideOnMobile && !tabletModal && "md:tw-flex",
          tabletModal && "md:tw-hidden"
        )}
      >
        <MobileWrapperDialogCloseButton
          onClick={onClose}
          label={closeLabel}
          {...(mobileCloseButtonClassName
            ? { className: mobileCloseButtonClassName }
            : {})}
        />
      </div>
    </TransitionChild>
  );
}

function DragHandle({
  show,
  tabletModal,
}: {
  readonly show?: boolean | undefined;
  readonly tabletModal?: boolean | undefined;
}) {
  if (!show) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={clsx(
        "tw-flex tw-justify-center tw-py-2",
        tabletModal && "md:tw-hidden"
      )}
    >
      <div className="tw-h-1 tw-w-10 tw-rounded-full tw-bg-iron-700" />
    </div>
  );
}

export default function MobileWrapperDialog({
  title,
  ariaLabel,
  isOpen,
  onClose,
  onBack,
  onBeforeLeave,
  onAfterLeave,
  children,
  noPadding,
  tall,
  fixedHeight,
  tabletModal,
  showScrollbar,
  allowOverflow,
  maxWidthClass,
  zIndexClassName = "tw-z-[1010]",
  headerClassName,
  titleActions,
  headerActions,
  mobileCloseButtonClassName,
  showDragHandle,
  enableDragToClose,
  showHeaderCloseButton = true,
  showHeaderDivider,
  headerCloseButtonClassName,
  surfaceClassName,
  titleClassName,
  focusTitleOnOpen = false,
  backLabel,
  closeLabel,
  dismissible = true,
  hideOnDesktopHover = false,
}: MobileWrapperDialogProps) {
  const locale = useBrowserLocale();
  const { isCapacitor, isIos } = useCapacitor();
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const isTouchDevice = useIsTouchDevice();
  const titleRef = useRef<HTMLElement>(null);
  const resolvedBackLabel = backLabel ?? t(locale, "common.back");
  const resolvedCloseLabel = closeLabel ?? t(locale, "common.close");
  const {
    canDragToClose,
    dragOffset,
    dragTouchHandlers,
    handleAfterLeave,
    handleClose,
    isDragging,
  } = useMobileDialogDrag({
    dismissible,
    showDragHandle,
    enableDragToClose,
    tabletModal,
    onClose,
    onAfterLeave,
  });

  const bottomPadding = getBottomPadding(noPadding);
  const dialogHeight = getDialogHeight({
    tall,
    isCapacitor,
  });

  const panelClassNames = getPanelClassNames({
    isIos,
    tabletModal,
    maxWidthClass,
  });
  const dragPanelClassNames = getDragPanelClassNames(canDragToClose);
  const hasDragHandle = showDragHandle ?? canDragToClose;
  const containerClassNames = getContainerClassNames(tabletModal);
  const slideTransition = getSlideTransition(tabletModal);
  const panelStyle = getPanelStyle({
    canDragToClose,
    dragOffset,
    isDragging,
  });
  const surfaceClassNames = getSurfaceClassNames({
    surfaceClassName,
    allowOverflow,
    tabletModal,
  });
  const contentClassNames = getContentClassNames({
    allowOverflow,
    noPadding,
    showScrollbar,
    hasDragHandle,
    tabletModal,
  });
  const surfaceStyle = getSurfaceStyle({
    dialogHeight,
    fixedHeight,
  });
  const showDesktopHeaderCloseButton =
    dismissible && !!tabletModal && !showHeaderCloseButton;
  const showFloatingCloseButton = dismissible && !showHeaderCloseButton;
  const showInlineHeaderCloseButton = dismissible && !!showHeaderCloseButton;
  const hideMobileCloseButton = canDragToClose;
  const shouldHideOnDesktopHover =
    hideOnDesktopHover && !isMobileLayoutViewport && !isTouchDevice;

  useEffect(() => {
    if (!isOpen || !focusTitleOnOpen) {
      return;
    }

    const frame = globalThis.requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true });
    });

    return () => globalThis.cancelAnimationFrame(frame);
  }, [focusTitleOnOpen, isOpen, title]);

  if (shouldHideOnDesktopHover) {
    return null;
  }

  return (
    <Transition appear={true} show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={clsx("tailwind-scope tw-absolute", zIndexClassName)}
        onClose={handleClose}
        aria-label={ariaLabel}
        {...(focusTitleOnOpen ? { initialFocus: titleRef } : {})}
      >
        <MobileDialogOverlay
          onBeforeLeave={onBeforeLeave}
          onAfterLeave={handleAfterLeave}
        />

        <div
          className="tw-fixed tw-inset-0"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <div
            className="tw-absolute tw-inset-0 tw-overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={containerClassNames}
              style={MOBILE_DIALOG_CONTAINER_STYLE}
            >
              <TransitionChild as={Fragment} {...slideTransition}>
                <div className={panelClassNames}>
                  <DialogPanel
                    className={dragPanelClassNames}
                    style={panelStyle}
                    {...dragTouchHandlers}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FloatingCloseButton
                      show={showFloatingCloseButton}
                      hideOnMobile={hideMobileCloseButton}
                      tabletModal={tabletModal}
                      onClose={handleClose}
                      mobileCloseButtonClassName={mobileCloseButtonClassName}
                      closeLabel={resolvedCloseLabel}
                    />
                    <div className={surfaceClassNames} style={surfaceStyle}>
                      <div
                        className={contentClassNames}
                        style={{ paddingBottom: bottomPadding }}
                      >
                        <DragHandle
                          show={hasDragHandle}
                          tabletModal={tabletModal}
                        />
                        <MobileWrapperDialogHeader
                          title={title}
                          showDesktopCloseButton={showDesktopHeaderCloseButton}
                          onClose={handleClose}
                          onBack={dismissible ? onBack : undefined}
                          className={headerClassName}
                          titleActions={titleActions}
                          headerActions={headerActions}
                          showHeaderCloseButton={showInlineHeaderCloseButton}
                          showHeaderDivider={showHeaderDivider}
                          headerCloseButtonClassName={
                            clsx(
                              hideMobileCloseButton &&
                                "!tw-hidden md:!tw-inline-flex",
                              headerCloseButtonClassName
                            )
                          }
                          titleClassName={titleClassName}
                          titleRef={titleRef}
                          backLabel={resolvedBackLabel}
                          closeLabel={resolvedCloseLabel}
                        />
                        {children}
                      </div>
                    </div>
                  </DialogPanel>
                </div>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
