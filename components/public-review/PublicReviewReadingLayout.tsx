"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const COMMENT_PANEL_ID = "public-review-feedback";
const COMMENT_PANEL_HEADING_ID = "public-review-feedback-heading";
const COMMENT_PANEL_INLINE_MIN_WIDTH = 760;
const PublicReviewCommentPanelOpenContext = createContext(true);
const PublicReviewFeedbackPanelCoordinationContext = createContext({
  close: (): void => undefined,
  isOpen: false,
  open: (): void => undefined,
});

/** Returns whether the public review feedback panel is currently open. */
export function usePublicReviewCommentPanelOpen(): boolean {
  return useContext(PublicReviewCommentPanelOpenContext);
}

/** Returns shared controls for the public review feedback panel. */
export function usePublicReviewFeedbackPanelCoordination(): {
  readonly close: () => void;
  readonly isOpen: boolean;
  readonly open: () => void;
} {
  return useContext(PublicReviewFeedbackPanelCoordinationContext);
}

/** Lays out review content beside its coordinated feedback panel. */
export function PublicReviewReadingLayout({
  content,
  feedbackAvailable,
  mobileNavigation,
  panel,
  toolbar,
}: {
  readonly content: ReactNode;
  readonly feedbackAvailable: boolean;
  readonly mobileNavigation?: ReactNode | undefined;
  readonly panel: ReactNode;
  readonly toolbar: ReactNode;
}) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [isOverlayLayout, setIsOverlayLayout] = useState<boolean | null>(null);
  const handledFocusRequestRef = useRef(0);
  const layoutRef = useRef<HTMLElement>(null);
  const hasMobileNavigation =
    mobileNavigation !== null && mobileNavigation !== undefined;

  const closePanel = useCallback((): void => {
    setIsPanelOpen(false);
  }, []);
  const openPanel = useCallback((): void => {
    setFocusRequest((request) => request + 1);
    setIsPanelOpen(true);
  }, []);
  const feedbackPanelCoordination = useMemo(
    () => ({ close: closePanel, isOpen: isPanelOpen, open: openPanel }),
    [closePanel, isPanelOpen, openPanel]
  );

  useLayoutEffect(() => {
    const layoutElement = layoutRef.current;
    if (!layoutElement) {
      return;
    }
    const updateLayout = () => {
      setIsOverlayLayout(
        layoutElement.getBoundingClientRect().width <
          COMMENT_PANEL_INLINE_MIN_WIDTH
      );
    };
    updateLayout();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateLayout);
    resizeObserver?.observe(layoutElement);
    globalThis.addEventListener("resize", updateLayout);

    return () => {
      resizeObserver?.disconnect();
      globalThis.removeEventListener("resize", updateLayout);
    };
  }, [feedbackAvailable]);

  useLayoutEffect(() => {
    if (
      !feedbackAvailable ||
      !isPanelOpen ||
      isOverlayLayout === null ||
      focusRequest === handledFocusRequestRef.current
    ) {
      return;
    }

    const panelElement = document.getElementById(COMMENT_PANEL_ID);
    if (!panelElement) {
      return;
    }
    handledFocusRequestRef.current = focusRequest;
    panelElement.focus({ preventScroll: true });
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isOverlayLayout) {
      panelElement.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [feedbackAvailable, focusRequest, isOverlayLayout, isPanelOpen]);

  useEffect(() => {
    if (!feedbackAvailable) {
      return;
    }

    const revealHashTarget = (): void => {
      if (window.location.hash !== `#${COMMENT_PANEL_ID}`) {
        return;
      }
      openPanel();
    };

    const revealTimer = window.setTimeout(revealHashTarget, 0);
    window.addEventListener("hashchange", revealHashTarget);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, [feedbackAvailable, openPanel]);

  const feedbackToggle = feedbackAvailable ? (
    <button
      aria-controls={COMMENT_PANEL_ID}
      aria-expanded={isPanelOpen}
      className="tw-group/feedback-toggle tw-inline-flex tw-min-h-11 tw-flex-none tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-px-0 tw-text-xs tw-font-semibold tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-white sm:tw-gap-2"
      onClick={() => (isPanelOpen ? closePanel() : openPanel())}
      type="button"
    >
      {isPanelOpen ? (
        <XMarkIcon
          className="tw-size-4 tw-transition-colors group-hover/feedback-toggle:tw-text-primary-300"
          aria-hidden="true"
        />
      ) : (
        <ChatBubbleLeftRightIcon
          className="tw-size-4 tw-transition-colors group-hover/feedback-toggle:tw-text-primary-300"
          aria-hidden="true"
        />
      )}
      <span className="tw-transition-colors group-hover/feedback-toggle:tw-text-primary-300">
        {t(
          DEFAULT_LOCALE,
          isPanelOpen
            ? "publicReview.comments.hide"
            : "publicReview.comments.show"
        )}
      </span>
    </button>
  ) : null;

  const toolbarRow = (
    <div className="tw-relative tw-flex tw-min-h-16 tw-items-center tw-gap-2 tw-px-3 sm:tw-gap-4 sm:tw-px-7 lg:tw-px-10">
      {hasMobileNavigation ? (
        <div className="tw-min-w-0 tw-flex-none lg:tw-hidden">
          {mobileNavigation}
        </div>
      ) : null}
      <div
        className={
          hasMobileNavigation
            ? "tw-min-w-0 tw-flex-1 tw-text-center max-[359px]:tw-sr-only lg:tw-text-left"
            : "tw-min-w-0 tw-flex-1"
        }
      >
        {toolbar}
      </div>
      {feedbackToggle}
    </div>
  );

  if (!feedbackAvailable) {
    return (
      <section className="tw-min-w-0">
        <div className="tw-sticky tw-top-[env(safe-area-inset-top,0px)] tw-z-30 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.07] tw-bg-[#0D0D0F]/95 tw-backdrop-blur-xl">
          {toolbarRow}
        </div>
        {content}
      </section>
    );
  }

  const panelContents = (showCloseButton: boolean) => (
    <PublicReviewCommentPanelOpenContext.Provider value={isPanelOpen}>
      <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-iron-950">
        <header className="tw-flex tw-min-h-16 tw-flex-none tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.07] tw-bg-[#101014] tw-px-5">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
            <ChatBubbleLeftRightIcon
              className="tw-size-4 tw-flex-none tw-text-iron-400"
              aria-hidden="true"
            />
            {showCloseButton ? (
              <DialogTitle
                as="h2"
                id={COMMENT_PANEL_HEADING_ID}
                className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-200"
              >
                {t(DEFAULT_LOCALE, "publicReview.comments.title")}
              </DialogTitle>
            ) : (
              <h2
                id={COMMENT_PANEL_HEADING_ID}
                className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-200"
              >
                {t(DEFAULT_LOCALE, "publicReview.comments.title")}
              </h2>
            )}
          </div>
          {showCloseButton ? (
            <button
              aria-label={t(DEFAULT_LOCALE, "publicReview.comments.hide")}
              className="tw-inline-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-white"
              onClick={closePanel}
              type="button"
            >
              <XMarkIcon aria-hidden="true" className="tw-size-5" />
            </button>
          ) : null}
        </header>
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-hidden [&>*]:tw-h-full">
          {panel}
        </div>
      </div>
    </PublicReviewCommentPanelOpenContext.Provider>
  );

  const overlayIsOpen = isOverlayLayout === true && isPanelOpen;
  const inlinePanelIsVisible = isOverlayLayout === false && isPanelOpen;
  const overlayPanel =
    overlayIsOpen && typeof document !== "undefined"
      ? createPortal(
          <Dialog
            className="tailwind-scope tw-relative tw-z-[1000]"
            onClose={closePanel}
            open
          >
            <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-600/60" />
            <div className="tw-fixed tw-inset-0 tw-flex tw-justify-end tw-overflow-hidden">
              <DialogPanel
                className="tw-relative tw-box-border tw-h-[100dvh] tw-w-96 tw-max-w-[calc(100vw-1rem)] tw-border-y-0 tw-border-b-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-white/[0.1] tw-bg-iron-950 tw-pb-[env(safe-area-inset-bottom,0px)] tw-pr-[env(safe-area-inset-right,0px)] tw-pt-[env(safe-area-inset-top,0px)] tw-shadow-2xl tw-shadow-black/60"
                id={COMMENT_PANEL_ID}
                tabIndex={-1}
              >
                {panelContents(true)}
              </DialogPanel>
            </div>
          </Dialog>,
          document.body
        )
      : null;

  return (
    <PublicReviewFeedbackPanelCoordinationContext.Provider
      value={feedbackPanelCoordination}
    >
      <section className="tw-min-w-0 tw-@container" ref={layoutRef}>
        <div className="tw-sticky tw-top-[env(safe-area-inset-top,0px)] tw-z-30 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.07] tw-bg-[#0D0D0F]/95 tw-backdrop-blur-xl">
          {toolbarRow}
        </div>

        <div
          className={`tw-grid tw-min-w-0 ${
            isPanelOpen ? "@[760px]:tw-grid-cols-[minmax(0,1fr)_20rem]" : ""
          }`}
        >
          <div className="tw-order-2 tw-min-w-0 @[760px]:tw-order-1">
            {content}
          </div>

          {overlayIsOpen ? null : (
            <aside
              id={COMMENT_PANEL_ID}
              aria-labelledby={COMMENT_PANEL_HEADING_ID}
              className={`tw-order-1 tw-scroll-mt-[calc(5rem+env(safe-area-inset-top,0px))] tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 @[760px]:tw-sticky @[760px]:tw-top-[calc(4rem+env(safe-area-inset-top,0px))] @[760px]:tw-order-2 @[760px]:tw-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] @[760px]:tw-overflow-hidden @[760px]:tw-border-b-0 @[760px]:tw-border-l ${
                inlinePanelIsVisible ? "tw-block" : "tw-hidden"
              }`}
              hidden={!inlinePanelIsVisible}
              tabIndex={-1}
            >
              {panelContents(false)}
            </aside>
          )}
        </div>
        {overlayPanel}
      </section>
    </PublicReviewFeedbackPanelCoordinationContext.Provider>
  );
}
