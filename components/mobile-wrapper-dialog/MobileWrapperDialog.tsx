import useCapacitor from "@/hooks/useCapacitor";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useCallback, useRef, useState } from "react";
import type { CSSProperties, ReactNode, TouchEvent } from "react";

const DISMISS_DRAG_DISTANCE_PX = 44;
const DISMISS_DRAG_FLICK_DISTANCE_PX = 18;
const DISMISS_DRAG_FLICK_VELOCITY_PX_MS = 0.42;
const DRAG_START_REGION_PX = 112;
const MAX_DRAG_OFFSET_PX = 260;

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
  showHeaderCloseButton,
  headerCloseButtonClassName,
  surfaceClassName,
  titleClassName,
  dismissible = true,
}: {
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
  readonly showHeaderCloseButton?: boolean | undefined;
  readonly headerCloseButtonClassName?: string | undefined;
  readonly surfaceClassName?: string | undefined;
  readonly titleClassName?: string | undefined;
  readonly dismissible?: boolean | undefined;
}) {
  const { isCapacitor, isIos } = useCapacitor();
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartedAtRef = useRef(0);
  const dragOffsetRef = useRef(0);

  const handleClose = useCallback(() => {
    if (dismissible) {
      onClose();
    }
  }, [dismissible, onClose]);

  const canDragToClose = dismissible && !!showDragHandle && !tabletModal;

  const setClampedDragOffset = useCallback((offset: number) => {
    const clampedOffset = Math.min(Math.max(offset, 0), MAX_DRAG_OFFSET_PX);
    dragOffsetRef.current = clampedOffset;
    setDragOffset(clampedOffset);
  }, []);

  const resetDrag = useCallback(() => {
    dragStartYRef.current = null;
    dragStartedAtRef.current = 0;
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  const handleDragStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!canDragToClose) {
        return;
      }

      const touch = event.touches.item(0);
      const startsInDragRegion =
        touch.clientY - event.currentTarget.getBoundingClientRect().top <=
        DRAG_START_REGION_PX;

      if (!startsInDragRegion) {
        return;
      }

      dragStartYRef.current = touch.clientY;
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
    const elapsed = Math.max(performance.now() - dragStartedAtRef.current, 1);
    const velocity = releasedOffset / elapsed;
    const shouldClose =
      releasedOffset >= DISMISS_DRAG_DISTANCE_PX ||
      (releasedOffset >= DISMISS_DRAG_FLICK_DISTANCE_PX &&
        velocity >= DISMISS_DRAG_FLICK_VELOCITY_PX_MS);

    dragStartYRef.current = null;
    dragStartedAtRef.current = 0;
    dragOffsetRef.current = 0;
    setIsDragging(false);

    if (shouldClose) {
      handleClose();
      return;
    }

    setDragOffset(0);
  }, [canDragToClose, handleClose, resetDrag]);

  const handleAfterLeave = useCallback(() => {
    resetDrag();
    onAfterLeave?.();
  }, [onAfterLeave, resetDrag]);

  const bottomPadding = getBottomPadding(noPadding);
  const dialogHeight = getDialogHeight({
    tall,
    isCapacitor,
  });

  const panelClassNames = clsx(
    "mobile-wrapper-dialog tw-pointer-events-auto tw-relative tw-w-screen",
    !tabletModal && "md:tw-max-w-screen-md",
    !isIos && "tw-transform-gpu tw-will-change-transform",
    tabletModal && ["md:tw-w-full", maxWidthClass ?? "md:tw-max-w-md"]
  );

  const containerClassNames = clsx(
    "tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-justify-center tw-pt-10",
    tabletModal && "md:tw-inset-0 md:tw-items-center md:tw-p-6 md:tw-pt-0"
  );

  const slideTransition = getSlideTransition(tabletModal);
  const panelStyle: CSSProperties = {
    touchAction: "manipulation",
  };
  const surfaceStyle: CSSProperties = {
    transform: `translate3d(0, ${dragOffset}px, 0)`,
    transition: isDragging
      ? "none"
      : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
    ...(fixedHeight ? { height: dialogHeight } : { maxHeight: dialogHeight }),
  };

  const showDesktopHeaderCloseButton =
    dismissible && !!tabletModal && !showHeaderCloseButton;

  return (
    <Transition appear={true} show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={clsx("tailwind-scope tw-absolute", zIndexClassName)}
        onClose={handleClose}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-duration-250 tw-ease-in-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-250 tw-ease-in-out"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
          {...(onBeforeLeave ? { beforeLeave: onBeforeLeave } : {})}
          afterLeave={handleAfterLeave}
        >
          <div className="tw-fixed tw-inset-0 tw-bg-iron-600/60" />
        </TransitionChild>

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
                  onTouchStart={canDragToClose ? handleDragStart : undefined}
                  onTouchMove={canDragToClose ? handleDragMove : undefined}
                  onTouchEnd={canDragToClose ? handleDragEnd : undefined}
                  onTouchCancel={resetDrag}
                  onClick={(e) => e.stopPropagation()}
                >
                  {dismissible && !showHeaderCloseButton && (
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
                          onClick={handleClose}
                          {...(mobileCloseButtonClassName
                            ? { className: mobileCloseButtonClassName }
                            : {})}
                        />
                      </div>
                    </TransitionChild>
                  )}
                  <div
                    className={clsx(
                      "tw-flex tw-flex-col tw-rounded-t-xl",
                      surfaceClassName ?? "tw-bg-iron-950",
                      allowOverflow
                        ? "tw-overflow-visible"
                        : "tw-overflow-hidden",
                      canDragToClose && "tw-will-change-transform",
                      tabletModal && "md:tw-rounded-xl"
                    )}
                    style={surfaceStyle}
                  >
                    <div
                      className={clsx(
                        "tw-flex tw-min-h-0 tw-flex-1 tw-scroll-py-3 tw-flex-col",
                        allowOverflow
                          ? "tw-overflow-visible"
                          : "tw-overflow-y-auto",
                        noPadding ? "tw-py-0" : "tw-py-6",
                        showScrollbar &&
                          !allowOverflow &&
                          "tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
                      )}
                      style={{ paddingBottom: bottomPadding }}
                    >
                      {showDragHandle && (
                        <div className="tw-flex tw-justify-center tw-pt-3">
                          <div className="tw-h-1 tw-w-10 tw-rounded-full tw-bg-iron-700" />
                        </div>
                      )}
                      <DialogHeader
                        title={title}
                        showDesktopCloseButton={showDesktopHeaderCloseButton}
                        onClose={handleClose}
                        className={headerClassName}
                        headerActions={headerActions}
                        showHeaderCloseButton={
                          dismissible && !!showHeaderCloseButton
                        }
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
