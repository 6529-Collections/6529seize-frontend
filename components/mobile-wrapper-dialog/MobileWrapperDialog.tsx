import useCapacitor from "@/hooks/useCapacitor";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import clsx from "clsx";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  TouchEvent,
} from "react";

const DISMISS_DRAG_DISTANCE_PX = 44;
const DISMISS_DRAG_FLICK_DISTANCE_PX = 18;
const DISMISS_DRAG_FLICK_VELOCITY_PX_MS = 0.42;
const DISMISS_DRAG_SETTLE_MS = 180;
const DRAG_START_REGION_PX = 112;
const MAX_DRAG_OFFSET_PX = 260;

type MobileWrapperDialogProps = {
  readonly title?: string | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
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
  readonly headerActions?: ReactNode;
  readonly mobileCloseButtonClassName?: string | undefined;
  readonly showDragHandle?: boolean | undefined;
  readonly enableDragToClose?: boolean | undefined;
  readonly showHeaderCloseButton?: boolean | undefined;
  readonly headerCloseButtonClassName?: string | undefined;
  readonly surfaceClassName?: string | undefined;
  readonly titleClassName?: string | undefined;
  readonly dismissible?: boolean | undefined;
};

type DragTouchHandlers = Pick<
  HTMLAttributes<HTMLDivElement>,
  "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel"
>;

type MobileDialogDragOptions = {
  readonly dismissible: boolean;
  readonly showDragHandle?: boolean | undefined;
  readonly enableDragToClose?: boolean | undefined;
  readonly tabletModal?: boolean | undefined;
  readonly onClose: () => void;
  readonly onAfterLeave?: (() => void) | undefined;
};

function DialogCloseButton({
  onClick,
  className,
}: {
  readonly onClick: () => void;
  readonly className?: string;
}) {
  return (
    <button
      type="button"
      title="Close panel"
      aria-label="Close panel"
      className={clsx(
        "-tw-mr-2 tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-p-2.5 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-white/5 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white/20",
        className
      )}
      onClick={onClick}
    >
      <svg
        className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-current"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 6L6 18M6 6L18 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function DialogHeader({
  title,
  showDesktopCloseButton,
  onClose,
  className,
  headerActions,
  showHeaderCloseButton,
  headerCloseButtonClassName,
  titleClassName,
}: {
  readonly title: string | undefined;
  readonly showDesktopCloseButton: boolean;
  readonly onClose: () => void;
  readonly className?: string | undefined;
  readonly headerActions?: ReactNode;
  readonly showHeaderCloseButton?: boolean | undefined;
  readonly headerCloseButtonClassName?: string | undefined;
  readonly titleClassName?: string | undefined;
}) {
  return (
    <div className={clsx("tw-px-4 sm:tw-px-6", className)}>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2">
          {title && (
            <DialogTitle
              className={clsx(
                "tw-text-base tw-font-semibold tw-text-iron-50",
                titleClassName
              )}
            >
              {title}
            </DialogTitle>
          )}
          {headerActions !== undefined && headerActions !== null && (
            <div className="tw-flex tw-items-center">{headerActions}</div>
          )}
        </div>
        {showDesktopCloseButton && (
          <DialogCloseButton
            onClick={onClose}
            className="tw-hidden md:tw-inline-flex"
          />
        )}
        {showHeaderCloseButton && (
          <DialogCloseButton
            onClick={onClose}
            className={clsx("tw-inline-flex", headerCloseButtonClassName)}
          />
        )}
      </div>
    </div>
  );
}

function getSlideTransition(tabletModal?: boolean) {
  return {
    enter:
      "tw-duration-250 sm:tw-duration-350 tw-transform tw-transition tw-ease-in-out",
    enterFrom: clsx(
      "tw-translate-y-full",
      tabletModal && "md:tw-translate-y-4 md:tw-opacity-0"
    ),
    enterTo: clsx("tw-translate-y-0", tabletModal && "md:tw-opacity-100"),
    leave:
      "tw-duration-250 sm:tw-duration-350 tw-transform tw-transition tw-ease-in-out",
    leaveFrom: clsx("tw-translate-y-0", tabletModal && "md:tw-opacity-100"),
    leaveTo: clsx(
      "tw-translate-y-full",
      tabletModal && "md:tw-translate-y-4 md:tw-opacity-0"
    ),
  };
}

function getOverlayTransition() {
  return {
    enter: "tw-transition-opacity tw-duration-250 tw-ease-out",
    enterFrom: "tw-opacity-0",
    enterTo: "tw-opacity-100",
    leave: "tw-transition-opacity tw-duration-250 tw-ease-in",
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

  if (tall && !isCapacitor) {
    return `calc(${viewportHeight} - 4rem)`;
  }

  return `calc(${viewportHeight} - 10rem)`;
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
  canDragToClose,
}: {
  readonly isIos: boolean;
  readonly tabletModal?: boolean | undefined;
  readonly maxWidthClass?: string | undefined;
  readonly canDragToClose: boolean;
}) {
  return clsx(
    "mobile-wrapper-dialog tw-pointer-events-auto tw-relative tw-w-screen",
    !tabletModal && "md:tw-max-w-screen-md",
    !isIos && "tw-transform-gpu",
    (!isIos || canDragToClose) && "tw-will-change-transform",
    tabletModal && ["md:tw-w-full", maxWidthClass ?? "md:tw-max-w-md"]
  );
}

function getContainerClassNames(tabletModal?: boolean | undefined) {
  return clsx(
    "tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-justify-center tw-pt-10",
    tabletModal && "md:tw-inset-0 md:tw-items-center md:tw-p-6 md:tw-pt-0"
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
    "tw-flex tw-flex-col tw-rounded-t-xl",
    surfaceClassName ?? "tw-bg-iron-950",
    allowOverflow ? "tw-overflow-visible" : "tw-overflow-hidden",
    tabletModal && "md:tw-rounded-xl"
  );
}

function getContentClassNames({
  allowOverflow,
  noPadding,
  showScrollbar,
}: {
  readonly allowOverflow?: boolean | undefined;
  readonly noPadding?: boolean | undefined;
  readonly showScrollbar?: boolean | undefined;
}) {
  return clsx(
    "tw-flex tw-min-h-0 tw-flex-1 tw-scroll-py-3 tw-flex-col",
    allowOverflow ? "tw-overflow-visible" : "tw-overflow-y-auto",
    noPadding ? "tw-py-0" : "tw-py-6",
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
      : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
  };
}

function getSurfaceStyle({
  dialogHeight,
  fixedHeight,
}: {
  readonly dialogHeight: string;
  readonly fixedHeight?: boolean | undefined;
}): CSSProperties {
  return fixedHeight ? { height: dialogHeight } : { maxHeight: dialogHeight };
}

function FloatingCloseButton({
  show,
  tabletModal,
  onClose,
  mobileCloseButtonClassName,
}: {
  readonly show: boolean;
  readonly tabletModal?: boolean | undefined;
  readonly onClose: () => void;
  readonly mobileCloseButtonClassName?: string | undefined;
}) {
  if (!show) {
    return null;
  }

  return (
    <TransitionChild
      as={Fragment}
      enter="tw-duration-250 tw-ease-in-out"
      enterFrom="tw-opacity-0"
      enterTo="tw-opacity-100"
      leave="tw-duration-250 tw-ease-in-out"
      leaveFrom="tw-opacity-100"
      leaveTo="tw-opacity-0"
    >
      <div
        className={clsx(
          "tw-absolute -tw-top-16 tw-right-0 tw-flex tw-pr-2 tw-pt-4 md:tw-pr-0",
          tabletModal && "md:tw-hidden"
        )}
      >
        <DialogCloseButton
          onClick={onClose}
          {...(mobileCloseButtonClassName
            ? { className: mobileCloseButtonClassName }
            : {})}
        />
      </div>
    </TransitionChild>
  );
}

function DragHandle({ show }: { readonly show?: boolean | undefined }) {
  if (!show) {
    return null;
  }

  return (
    <div className="tw-flex tw-justify-center tw-pt-3">
      <div className="tw-h-1 tw-w-10 tw-rounded-full tw-bg-iron-700" />
    </div>
  );
}

function getDragTouchHandlers({
  canDragToClose,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  resetDrag,
}: {
  readonly canDragToClose: boolean;
  readonly handleDragStart: (event: TouchEvent<HTMLDivElement>) => void;
  readonly handleDragMove: (event: TouchEvent<HTMLDivElement>) => void;
  readonly handleDragEnd: () => void;
  readonly resetDrag: () => void;
}): DragTouchHandlers {
  if (!canDragToClose) {
    return { onTouchCancel: resetDrag };
  }

  return {
    onTouchStart: handleDragStart,
    onTouchMove: handleDragMove,
    onTouchEnd: handleDragEnd,
    onTouchCancel: resetDrag,
  };
}

function startsInDragRegion(event: TouchEvent<HTMLDivElement>): boolean {
  const touch = event.touches.item(0);
  return (
    touch.clientY - event.currentTarget.getBoundingClientRect().top <=
    DRAG_START_REGION_PX
  );
}

function shouldDismissDrag(releasedOffset: number, startedAt: number): boolean {
  const elapsed = Math.max(performance.now() - startedAt, 1);
  const velocity = releasedOffset / elapsed;

  return (
    releasedOffset >= DISMISS_DRAG_DISTANCE_PX ||
    (releasedOffset >= DISMISS_DRAG_FLICK_DISTANCE_PX &&
      velocity >= DISMISS_DRAG_FLICK_VELOCITY_PX_MS)
  );
}

function getDismissDragOffset(): number {
  return Math.max(
    globalThis.visualViewport?.height ?? 0,
    globalThis.innerHeight ?? 0,
    MAX_DRAG_OFFSET_PX
  );
}

function useMobileDialogDrag({
  dismissible,
  showDragHandle,
  enableDragToClose,
  tabletModal,
  onClose,
  onAfterLeave,
}: MobileDialogDragOptions) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartedAtRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const dragFrameRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (dismissible) {
      onClose();
    }
  }, [dismissible, onClose]);

  const canDragToClose =
    dismissible && (enableDragToClose ?? !!showDragHandle) && !tabletModal;

  const cancelScheduledDragFrame = useCallback(() => {
    if (dragFrameRef.current === null) {
      return;
    }

    if (typeof globalThis.cancelAnimationFrame === "function") {
      globalThis.cancelAnimationFrame(dragFrameRef.current);
    }

    dragFrameRef.current = null;
  }, []);

  const cancelScheduledDismiss = useCallback(() => {
    if (dismissTimerRef.current === null) {
      return;
    }

    globalThis.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
  }, []);

  const scheduleDragOffsetUpdate = useCallback(() => {
    if (typeof globalThis.requestAnimationFrame !== "function") {
      setDragOffset(dragOffsetRef.current);
      return;
    }

    if (dragFrameRef.current !== null) {
      return;
    }

    dragFrameRef.current = globalThis.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      setDragOffset(dragOffsetRef.current);
    });
  }, []);

  const setClampedDragOffset = useCallback(
    (offset: number) => {
      const clampedOffset = Math.min(Math.max(offset, 0), MAX_DRAG_OFFSET_PX);
      if (dragOffsetRef.current === clampedOffset) {
        return;
      }

      dragOffsetRef.current = clampedOffset;
      scheduleDragOffsetUpdate();
    },
    [scheduleDragOffsetUpdate]
  );

  const resetDrag = useCallback(() => {
    cancelScheduledDragFrame();
    cancelScheduledDismiss();
    dragStartYRef.current = null;
    dragStartedAtRef.current = 0;
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  }, [cancelScheduledDismiss, cancelScheduledDragFrame]);

  useEffect(
    () => () => {
      cancelScheduledDragFrame();
      cancelScheduledDismiss();
    },
    [cancelScheduledDismiss, cancelScheduledDragFrame]
  );

  const handleDragStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!canDragToClose || !startsInDragRegion(event)) {
        return;
      }

      dragStartYRef.current = event.touches.item(0).clientY;
      dragStartedAtRef.current = performance.now();
      setIsDragging(true);
      setClampedDragOffset(0);
    },
    [canDragToClose, setClampedDragOffset]
  );

  const handleDragMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!canDragToClose || dragStartYRef.current === null) {
        return;
      }

      const nextOffset = event.touches.item(0).clientY - dragStartYRef.current;
      if (nextOffset <= 0) {
        setClampedDragOffset(0);
        return;
      }

      event.preventDefault();
      setClampedDragOffset(nextOffset);
    },
    [canDragToClose, setClampedDragOffset]
  );

  const handleDragEnd = useCallback(() => {
    if (!canDragToClose || dragStartYRef.current === null) {
      resetDrag();
      return;
    }

    const releasedOffset = dragOffsetRef.current;
    const startedAt = dragStartedAtRef.current;
    dragStartYRef.current = null;
    dragStartedAtRef.current = 0;
    cancelScheduledDragFrame();

    if (shouldDismissDrag(releasedOffset, startedAt)) {
      dragOffsetRef.current = getDismissDragOffset();
      setIsDragging(false);
      setDragOffset(dragOffsetRef.current);
      dismissTimerRef.current = globalThis.setTimeout(() => {
        dismissTimerRef.current = null;
        handleClose();
      }, DISMISS_DRAG_SETTLE_MS);
      return;
    }

    dragOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  }, [canDragToClose, cancelScheduledDragFrame, handleClose, resetDrag]);

  const handleAfterLeave = useCallback(() => {
    resetDrag();
    onAfterLeave?.();
  }, [onAfterLeave, resetDrag]);

  const dragTouchHandlers = useMemo(
    () =>
      getDragTouchHandlers({
        canDragToClose,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        resetDrag,
      }),
    [canDragToClose, handleDragStart, handleDragMove, handleDragEnd, resetDrag]
  );

  return {
    canDragToClose,
    dragOffset,
    dragTouchHandlers,
    handleAfterLeave,
    handleClose,
    isDragging,
  };
}

export default function MobileWrapperDialog({
  title,
  isOpen,
  onClose,
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
  headerActions,
  mobileCloseButtonClassName,
  showDragHandle,
  enableDragToClose,
  showHeaderCloseButton,
  headerCloseButtonClassName,
  surfaceClassName,
  titleClassName,
  dismissible = true,
}: MobileWrapperDialogProps) {
  const { isCapacitor, isIos } = useCapacitor();
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
    canDragToClose,
  });
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
  });
  const surfaceStyle = getSurfaceStyle({
    dialogHeight,
    fixedHeight,
  });
  const showDesktopHeaderCloseButton =
    dismissible && !!tabletModal && !showHeaderCloseButton;
  const showFloatingCloseButton = dismissible && !showHeaderCloseButton;
  const showInlineHeaderCloseButton = dismissible && !!showHeaderCloseButton;

  return (
    <Transition appear={true} show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={clsx("tailwind-scope tw-absolute", zIndexClassName)}
        onClose={handleClose}
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
            <div className={containerClassNames}>
              <TransitionChild as={Fragment} {...slideTransition}>
                <DialogPanel
                  className={panelClassNames}
                  style={panelStyle}
                  {...dragTouchHandlers}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FloatingCloseButton
                    show={showFloatingCloseButton}
                    tabletModal={tabletModal}
                    onClose={handleClose}
                    mobileCloseButtonClassName={mobileCloseButtonClassName}
                  />
                  <div className={surfaceClassNames} style={surfaceStyle}>
                    <div
                      className={contentClassNames}
                      style={{ paddingBottom: bottomPadding }}
                    >
                      <DragHandle show={showDragHandle} />
                      <DialogHeader
                        title={title}
                        showDesktopCloseButton={showDesktopHeaderCloseButton}
                        onClose={handleClose}
                        className={headerClassName}
                        headerActions={headerActions}
                        showHeaderCloseButton={showInlineHeaderCloseButton}
                        headerCloseButtonClassName={headerCloseButtonClassName}
                        titleClassName={titleClassName}
                      />
                      {children}
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
