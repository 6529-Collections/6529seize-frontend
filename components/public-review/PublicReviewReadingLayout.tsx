"use client";

import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const COMMENT_PANEL_ID = "public-review-feedback";
const COMMENT_PANEL_STORAGE_KEY = "public-review-comment-panel-open";
const COMMENT_PANEL_PREFERENCE_EVENT = "public-review-comment-panel-preference";
const PublicReviewCommentPanelOpenContext = createContext(true);
let inMemoryPanelPreference: boolean | null = null;

export function usePublicReviewCommentPanelOpen(): boolean {
  return useContext(PublicReviewCommentPanelOpenContext);
}

function getPanelPreferenceSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const storedPreference = window.localStorage.getItem(
      COMMENT_PANEL_STORAGE_KEY
    );
    if (storedPreference !== null) {
      return storedPreference === "true";
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  if (inMemoryPanelPreference !== null) {
    return inMemoryPanelPreference;
  }
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 1280px)").matches
  );
}

function subscribeToPanelPreference(onStoreChange: () => void): () => void {
  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 1280px)")
      : null;
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === COMMENT_PANEL_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(COMMENT_PANEL_PREFERENCE_EVENT, onStoreChange);
  mediaQuery?.addEventListener("change", onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(COMMENT_PANEL_PREFERENCE_EVENT, onStoreChange);
    mediaQuery?.removeEventListener("change", onStoreChange);
  };
}

function updatePanelPreference(isOpen: boolean): void {
  inMemoryPanelPreference = isOpen;
  try {
    window.localStorage.setItem(COMMENT_PANEL_STORAGE_KEY, String(isOpen));
  } catch {
    // Keep the in-memory preference when storage is unavailable.
  }
  window.dispatchEvent(new Event(COMMENT_PANEL_PREFERENCE_EVENT));
}

export function PublicReviewReadingLayout({
  content,
  feedbackAvailable,
  panel,
  toolbar,
}: {
  readonly content: ReactNode;
  readonly feedbackAvailable: boolean;
  readonly panel: ReactNode;
  readonly toolbar: ReactNode;
}) {
  const isPanelOpen = useSyncExternalStore(
    subscribeToPanelPreference,
    getPanelPreferenceSnapshot,
    () => false
  );
  const [focusRequest, setFocusRequest] = useState(0);
  const handledFocusRequestRef = useRef(0);

  useLayoutEffect(() => {
    if (
      !feedbackAvailable ||
      !isPanelOpen ||
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
    panelElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [feedbackAvailable, focusRequest, isPanelOpen]);

  useEffect(() => {
    if (!feedbackAvailable) {
      return;
    }

    const revealHashTarget = (): void => {
      if (window.location.hash !== `#${COMMENT_PANEL_ID}`) {
        return;
      }
      setFocusRequest((request) => request + 1);
      updatePanelPreference(true);
    };

    const revealTimer = window.setTimeout(revealHashTarget, 0);
    window.addEventListener("hashchange", revealHashTarget);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, [feedbackAvailable]);

  if (!feedbackAvailable) {
    return (
      <section className="tw-min-w-0">
        <div className="tw-sticky tw-top-0 tw-z-30 tw-flex tw-min-h-16 tw-items-center tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.07] tw-bg-[#0D0D0F]/95 tw-px-4 tw-backdrop-blur-xl sm:tw-px-7 lg:tw-px-10">
          {toolbar}
        </div>
        {content}
      </section>
    );
  }

  return (
    <section className="tw-min-w-0 tw-@container">
      <div className="tw-sticky tw-top-0 tw-z-30 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.07] tw-bg-[#0D0D0F]/95 tw-backdrop-blur-xl">
        <div className="tw-flex tw-min-h-16 tw-items-center tw-justify-between tw-gap-4 tw-px-4 sm:tw-px-7 lg:tw-px-10">
          {toolbar}
          <button
            type="button"
            aria-controls={COMMENT_PANEL_ID}
            aria-expanded={isPanelOpen}
            onClick={() => updatePanelPreference(!isPanelOpen)}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-10 tw-flex-none tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-400/[0.08] tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-primary-300 tw-transition-colors tw-duration-200 tw-ease-out hover:tw-border-primary-300/35 hover:tw-bg-primary-400/[0.12] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          >
            {isPanelOpen ? (
              <XMarkIcon className="tw-size-4" aria-hidden="true" />
            ) : (
              <ChatBubbleLeftRightIcon
                className="tw-size-4"
                aria-hidden="true"
              />
            )}
            {t(
              DEFAULT_LOCALE,
              isPanelOpen
                ? "publicReview.comments.hide"
                : "publicReview.comments.show"
            )}
          </button>
        </div>
      </div>

      <div
        className={`tw-grid tw-min-w-0 ${
          isPanelOpen ? "@[960px]:tw-grid-cols-[minmax(0,1fr)_24rem]" : ""
        }`}
      >
        <div className="tw-order-2 tw-min-w-0 @[960px]:tw-order-1">
          {content}
        </div>

        <aside
          id={COMMENT_PANEL_ID}
          aria-label={t(DEFAULT_LOCALE, "publicReview.comments.title")}
          className={`tw-order-1 tw-scroll-mt-20 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.08] tw-bg-[#08080a] tw-outline-none @[960px]:tw-sticky @[960px]:tw-top-16 @[960px]:tw-order-2 @[960px]:tw-h-[calc(100dvh-4rem)] @[960px]:tw-overflow-hidden @[960px]:tw-border-b-0 @[960px]:tw-border-l ${
            isPanelOpen ? "tw-block" : "tw-hidden"
          }`}
          tabIndex={-1}
        >
          <PublicReviewCommentPanelOpenContext.Provider value={isPanelOpen}>
            <div className="tw-bg-[#08080a] @[960px]:tw-flex @[960px]:tw-h-full @[960px]:tw-flex-col">
              <header className="tw-flex tw-flex-none tw-items-center tw-gap-2.5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.08] tw-px-5 tw-py-4">
                <ChatBubbleLeftRightIcon
                  className="tw-size-4 tw-flex-none tw-text-iron-500"
                  aria-hidden="true"
                />
                <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-tracking-tight tw-text-white">
                  {t(DEFAULT_LOCALE, "publicReview.comments.title")}
                </h2>
              </header>
              <div className="tw-min-h-0 tw-flex-1">{panel}</div>
            </div>
          </PublicReviewCommentPanelOpenContext.Provider>
        </aside>
      </div>
    </section>
  );
}
