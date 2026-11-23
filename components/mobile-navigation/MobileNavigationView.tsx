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
  useMemo,
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
import MobileWrapperDialogCloseButton from "@/components/mobile-wrapper-dialog/MobileWrapperDialogCloseButton";
import {
  MobilePageContext,
  type MobilePageNavigation,
} from "./MobilePageContext";
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

function getPanelMotion(
  presentation: "page" | "form",
  reducedMotion: boolean,
  exitTransition:
    | typeof BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION
    | typeof BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
) {
  const entrance = presentation === "form" ? { y: "100%" } : { x: "100%" };
  const destination = reducedMotion ? 0 : "100%";
  const exit =
    presentation === "form"
      ? { y: destination, transition: exitTransition }
      : { x: destination, transition: exitTransition };
  return { entrance, exit };
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
}: {
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
  const drafts = useRef(
    new Map<string, () => { dirty: boolean; busy: boolean }>()
  );
  const [navigationStack, setNavigationState] = useState(
    new Map<string, MobilePageNavigation>()
  );
  const navigation = [...navigationStack.values()].at(-1);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const registerDraft = useCallback(
    (id: string, read: () => { dirty: boolean; busy: boolean }) => {
      drafts.current.set(id, read);
      return () => {
        drafts.current.delete(id);
      };
    },
    []
  );
  const setNavigation = useCallback(
    (id: string, value: MobilePageNavigation | null) => {
      setNavigationState((current) => {
        const next = new Map(current);
        if (value) next.set(id, value);
        else next.delete(id);
        return next;
      });
    },
    []
  );
  const pageContext = useMemo(
    () => ({ registerDraft, setNavigation }),
    [registerDraft, setNavigation]
  );
  const guard = useCallback(
    (leave: () => void) => {
      if (!guardDrafts) return false;
      const states = [...drafts.current.values()].map((read) => read());
      if (states.some((state) => state.busy)) return true;
      if (!states.some((state) => state.dirty)) return false;
      setPendingLeave(() => leave);
      return true;
    },
    [guardDrafts]
  );
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
    presentation === "form" || parentPage !== null,
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
  const viewportRef = useDialogKeyboard(true);
  const transition = reducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION;
  const exitTransition = reducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION;
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
    if (reducedMotion) {
      x.stop();
      x.set(0);
    }
    if (previousPage.current.key === activePageKey) return;
    const backwards = pageDepth < previousPage.current.depth;
    previousPage.current = { key: activePageKey, depth: pageDepth };
    const start = backwards
      ? -globalThis.innerWidth * 0.25
      : globalThis.innerWidth;
    x.set(reducedMotion ? 0 : start);
    const animation = animate(x, 0, transition);
    return () => animation.stop();
  }, [activePageKey, pageDepth, reducedMotion, transition, x]);

  const { entrance, exit: panelExit } = getPanelMotion(
    presentation,
    reducedMotion,
    exitTransition
  );
  const isFormRoot = presentation === "form" && !navigation;

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
          {!isFormRoot && (
            <IconButton
              size={44}
              aria-label={t(locale, "common.back")}
              onClick={requestBack}
            >
              <ChevronLeftIcon className="tw-size-5" aria-hidden="true" />
            </IconButton>
          )}
          <DialogTitle
            key={title}
            ref={focusTitle}
            tabIndex={-1}
            className={`tw-m-0 tw-min-w-0 tw-flex-1 tw-break-words tw-text-base tw-font-semibold focus:tw-outline-none ${isFormRoot ? "tw-pl-2" : "tw-pr-3"}`}
          >
            {title}
          </DialogTitle>
          {isFormRoot && (
            <MobileWrapperDialogCloseButton
              label={t(locale, "common.close")}
              onClick={requestBack}
            />
          )}
        </div>
      </header>
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto">
        {children}
      </div>
    </m.div>
  );

  return (
    <MobilePageContext.Provider value={pageContext}>
      <LazyMotion features={domAnimation}>
        <span hidden aria-hidden="true" ref={setMount} />
        <Dialog
          as={m.div}
          ref={dialogRef}
          open={mount !== null}
          onClose={requestBack}
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
              initial={springMotion || reducedMotion ? false : entrance}
              animate={{ x: 0, y: 0, transition }}
              exit={springMotion ? {} : panelExit}
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
      </LazyMotion>
      <MobileWrapperConfirmationDialog
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
    </MobilePageContext.Provider>
  );
}
