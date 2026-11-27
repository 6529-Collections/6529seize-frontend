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
} from "framer-motion";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION,
  BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION,
  BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION,
} from "@/components/brain/right-sidebar/BrainRightSidebarTypes";
import SpringNavigationSurface from "./SpringNavigationSurface";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { MobilePageContext, useMobilePageState } from "./MobilePageContext";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import { useMobileFormHistory } from "./useMobileFormHistory";
import IconButton from "@/components/utils/button/IconButton";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDialogKeyboard, {
  DIALOG_KEYBOARD_VIEWPORT_STYLE,
} from "@/hooks/useDialogKeyboard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { t } from "@/i18n/messages";

function getPanelMotion(reducedMotion: boolean, springMotion: boolean) {
  const transition = reducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION;
  const exitTransition = reducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION;
  return {
    transition,
    exitTransition,
    initial: springMotion || reducedMotion ? false : { x: "100%" },
    exit: springMotion
      ? {}
      : { x: reducedMotion ? 0 : "100%", transition: exitTransition },
  } as const;
}

/** Keep mounted through AnimatePresence so Back and swipe share the same exit. */
export default function MobileNavigationView({
  title: baseTitle,
  onBack,
  children,
  presentation = "page",
  pageKey,
  guardDrafts = true,
  springMotion = false,
  isOpen = true,
  onAfterLeave,
  formSize = "compact",
}: {
  readonly isOpen?: boolean;
  readonly onAfterLeave?: (() => void) | undefined;
  readonly formSize?: "compact" | "tall";
  readonly guardDrafts?: boolean;
  readonly springMotion?: boolean;
  readonly title: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
  readonly presentation?: "page" | "form";
  readonly pageKey?: string | undefined;
}) {
  const parentPage = useContext(MobilePageContext);
  const locale = useBrowserLocale();
  const {
    pageContext,
    navigation,
    navigationStack,
    guard,
    pendingLeave,
    setPendingLeave,
  } = useMobilePageState(guardDrafts);
  const registerBackGuard = useWaveInformation()?.registerBackGuard;
  useEffect(
    () =>
      presentation === "page" && parentPage === null
        ? registerBackGuard?.(guard)
        : undefined,
    [registerBackGuard, guard, presentation, parentPage]
  );
  const title = navigation?.title ?? baseTitle;
  const requestBack = () => {
    const leave = navigation?.back ?? onBack;
    const protectDrafts = navigation?.protectDrafts ?? true;
    if (protectDrafts && guard(leave)) return false;
    leave();
    return true;
  };
  useMobileFormHistory(
    isOpen && (presentation === "form" || parentPage !== null),
    requestBack
  );
  const isPresent = useIsPresent();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const x = useMotionValue(0);
  const focusTitle = useCallback(
    (element: HTMLHeadingElement | null) => {
      titleRef.current = element;
      if (element) {
        x.stop();
        x.set(0);
        const active = document.activeElement;
        const focusAlreadyInPage =
          active instanceof HTMLElement &&
          dialogRef.current?.contains(active) &&
          active.getClientRects().length > 0 &&
          active.closest("[hidden]") === null;
        if (
          !focusAlreadyInPage &&
          !dialogRef.current?.querySelector("input[data-autofocus]")
        )
          element.focus({ preventScroll: true });
      }
    },
    [x]
  );
  const [mount, setMount] = useState<HTMLSpanElement | null>(null);
  const viewportRef = useDialogKeyboard(presentation === "page");
  const panelMotion = getPanelMotion(reducedMotion, springMotion);
  const { transition, exitTransition } = panelMotion;
  const onTouchStart = useHorizontalSwipe(
    {
      enabled: isPresent && presentation === "page" && !springMotion,
      direction: 1,
      threshold: 100,
      intentRatio: 1.2,
      flick: true,
      onStart: () => x.stop(),
      onMove: (distance) => x.set(Math.min(distance, globalThis.innerWidth)),
      onEnd: (committed) => {
        if (committed) {
          // Keep the drag offset while the outgoing view finishes sliding right.
          requestBack();
          void animate(x, 0, reducedMotion ? { duration: 0 } : transition);
        } else {
          void animate(x, 0, reducedMotion ? { duration: 0 } : transition);
        }
      },
    },
    title
  );
  useAndroidBackLayer(mount !== null, dialogRef, requestBack);
  const activePageKey = navigation?.title ?? pageKey;
  const pageDepth =
    (pageKey && pageKey !== "about" ? 1 : 0) + navigationStack.size;
  const previousPage = useRef({ key: activePageKey, depth: pageDepth });
  useLayoutEffect(() => {
    if (presentation === "form") return;
    if (reducedMotion) {
      x.stop();
      x.set(0);
    }
    if (previousPage.current.key === activePageKey) return;
    const backwards = pageDepth < previousPage.current.depth;
    previousPage.current = { key: activePageKey, depth: pageDepth };
    // Back reveals the parent in place; only a newly opened editor slides in.
    x.stop();
    x.set(reducedMotion || backwards ? 0 : globalThis.innerWidth);
    if (backwards) return;
    const animation = animate(x, 0, transition);
    return () => animation.stop();
  }, [activePageKey, pageDepth, presentation, reducedMotion, transition, x]);

  const isTallForm = formSize === "tall" || Boolean(navigation);

  const content = (
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
            onClick={requestBack}
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
  );

  const confirmation = (
    <MobileWrapperConfirmationDialog
      key={title}
      isOpen={pendingLeave !== null}
      title={t(locale, "waves.information.discardTitle")}
      message={t(locale, "waves.information.discardMessage")}
      confirmText={t(locale, "waves.create.dialog.discardConfirm")}
      confirmVariant="destructive"
      onClose={() => setPendingLeave(null)}
      onConfirm={() => {
        const leave = pendingLeave;
        setPendingLeave(null);
        leave?.();
      }}
      zIndexClassName="tw-z-[11000]"
    />
  );

  return (
    <MobilePageContext.Provider value={pageContext}>
      <LazyMotion features={domAnimation}>
        {presentation === "form" ? (
          <MobileWrapperDialog
            isOpen={isOpen}
            onClose={requestBack}
            onEscape={requestBack}
            onBack={navigation ? requestBack : undefined}
            onAfterLeave={onAfterLeave}
            title={title}
            showCloseButton={!navigation}
            enableDragToClose={false}
            preserveFocusOnEscape
            tall={isTallForm}
            fixedHeight={isTallForm}
            fitVisualViewport
            avoidKeyboard
            noPadding
            tabletModal
            zIndexClassName="tw-z-[9999]"
            headerClassName="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-py-4"
          >
            {children}
            {confirmation}
          </MobileWrapperDialog>
        ) : (
          <>
            <span hidden aria-hidden="true" ref={setMount} />
            <Dialog
              as={m.div}
              ref={dialogRef}
              open={mount !== null}
              onClose={requestBack}
              initialFocus={titleRef}
              className={`tailwind-scope tw-fixed tw-inset-0 ${parentPage ? "tw-z-[10000]" : "tw-z-[1010]"}`}
              exit={{ opacity: 1, transition: exitTransition }}
              onKeyDown={(event) => {
                if (
                  event.key === "Escape" &&
                  !event.defaultPrevented &&
                  event.target instanceof Element &&
                  event.target.closest(
                    '[role="dialog"], [role="alertdialog"]'
                  ) === event.currentTarget
                ) {
                  event.preventDefault();
                  requestBack();
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
                  initial={panelMotion.initial}
                  animate={{ x: 0, y: 0, transition }}
                  exit={panelMotion.exit}
                >
                  {springMotion ? (
                    <SpringNavigationSurface
                      onBack={requestBack}
                      scope={activePageKey ?? title}
                      reducedMotion={reducedMotion}
                    >
                      {content}
                    </SpringNavigationSurface>
                  ) : (
                    content
                  )}
                </DialogPanel>
              </div>
            </Dialog>
          </>
        )}
      </LazyMotion>
      {presentation === "page" && confirmation}
    </MobilePageContext.Provider>
  );
}
