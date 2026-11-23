"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import {
  animate,
  domAnimation,
  LazyMotion,
  m,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION,
  BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION,
  BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION,
} from "@/components/brain/right-sidebar/BrainRightSidebarTypes";
import IconButton from "@/components/utils/button/IconButton";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDialogKeyboard, {
  DIALOG_KEYBOARD_VIEWPORT_STYLE,
} from "@/hooks/useDialogKeyboard";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { t } from "@/i18n/messages";

/** Keep mounted through AnimatePresence so Back and swipe share the same exit. */
export default function MobileNavigationView({
  title,
  onBack,
  children,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  const isPresent = useIsPresent();
  const reducedMotion = useReducedMotion() ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const x = useMotionValue(0);
  const focusTitle = useCallback(
    (element: HTMLHeadingElement | null) => {
      titleRef.current = element;
      if (element) {
        x.stop();
        x.set(0);
        element.focus({ preventScroll: true });
      }
    },
    [x]
  );
  const [mount, setMount] = useState<HTMLSpanElement | null>(null);
  const viewportRef = useDialogKeyboard(true);
  const transition = reducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION;
  const exitTransition = reducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION;
  const onTouchStart = useHorizontalSwipe(
    {
      enabled: isPresent,
      direction: 1,
      threshold: 100,
      intentRatio: 1.2,
      flick: true,
      onStart: () => x.stop(),
      onMove: (distance) => x.set(Math.min(distance, globalThis.innerWidth)),
      onEnd: (committed) => {
        if (committed) {
          // Keep the drag offset while the outgoing view finishes sliding right.
          onBack();
        } else {
          void animate(x, 0, reducedMotion ? { duration: 0 } : transition);
        }
      },
    },
    title
  );
  useAndroidBackLayer(mount !== null, dialogRef, onBack);

  return (
    <LazyMotion features={domAnimation}>
      <span hidden aria-hidden="true" ref={setMount} />
      <Dialog
        as={m.div}
        ref={dialogRef}
        open={mount !== null}
        onClose={onBack}
        initialFocus={titleRef}
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1010]"
        exit={{ opacity: 1, transition: exitTransition }}
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            !event.defaultPrevented &&
            event.target instanceof Element &&
            event.target.closest('[role="dialog"], [role="alertdialog"]') ===
              event.currentTarget
          ) {
            event.preventDefault();
            onBack();
          }
        }}
      >
        <div
          ref={viewportRef}
          className="tw-fixed tw-inset-x-0 tw-top-0 tw-overflow-hidden"
          style={DIALOG_KEYBOARD_VIEWPORT_STYLE}
        >
          <DialogPanel
            as={m.div}
            className="tw-h-full tw-min-h-0"
            initial={reducedMotion ? false : { x: "100%" }}
            animate={{ x: 0, transition }}
            exit={{ x: reducedMotion ? 0 : "100%", transition: exitTransition }}
          >
            <m.div
              data-mobile-navigation-view
              data-state={isPresent ? "open" : "closing"}
              className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-overflow-hidden tw-bg-iron-950 tw-pb-[env(safe-area-inset-bottom,0px)] tw-text-iron-50"
              style={{ x, touchAction: "pan-y pinch-zoom" }}
              onTouchStart={onTouchStart}
            >
              <header
                data-testid="mobile-dialog-header"
                className="tw-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-pt-[env(safe-area-inset-top,0px)]"
              >
                <div className="tw-flex tw-min-h-14 tw-items-center tw-gap-2 tw-px-2 tw-py-1">
                  <IconButton
                    size={44}
                    aria-label={t(locale, "common.back")}
                    onClick={onBack}
                  >
                    <ChevronLeftIcon className="tw-size-5" aria-hidden="true" />
                  </IconButton>
                  <DialogTitle
                    key={title}
                    ref={focusTitle}
                    tabIndex={-1}
                    className="tw-m-0 tw-min-w-0 tw-flex-1 tw-break-words tw-pr-3 tw-text-base tw-font-semibold focus:tw-outline-none"
                  >
                    {title}
                  </DialogTitle>
                </div>
              </header>
              <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto">
                {children}
              </div>
            </m.div>
          </DialogPanel>
        </div>
      </Dialog>
    </LazyMotion>
  );
}
