"use client";

import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
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
  ledgerHref,
  panel,
  reviewVersion,
}: {
  readonly content: ReactNode;
  readonly feedbackAvailable: boolean;
  readonly ledgerHref: string;
  readonly panel: ReactNode;
  readonly reviewVersion: string;
}) {
  const isPanelOpen = useSyncExternalStore(
    subscribeToPanelPreference,
    getPanelPreferenceSnapshot,
    () => false
  );

  useEffect(() => {
    if (!feedbackAvailable) {
      return;
    }

    const revealHashTarget = (): void => {
      if (window.location.hash !== `#${COMMENT_PANEL_ID}`) {
        return;
      }
      updatePanelPreference(true);
      window.setTimeout(() => {
        const panelElement = document.getElementById(COMMENT_PANEL_ID);
        panelElement?.focus({ preventScroll: true });
        panelElement?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    };

    const revealTimer = window.setTimeout(revealHashTarget, 0);
    window.addEventListener("hashchange", revealHashTarget);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, [feedbackAvailable]);

  if (!feedbackAvailable) {
    return <>{content}</>;
  }

  return (
    <section className="tw-@container">
      <div className="tw-mb-4 tw-flex tw-justify-end">
        <button
          type="button"
          aria-controls={COMMENT_PANEL_ID}
          aria-expanded={isPanelOpen}
          onClick={() => updatePanelPreference(!isPanelOpen)}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.035] tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.06] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        >
          {isPanelOpen ? (
            <XMarkIcon className="tw-size-4" aria-hidden="true" />
          ) : (
            <ChatBubbleLeftRightIcon className="tw-size-4" aria-hidden="true" />
          )}
          {t(
            DEFAULT_LOCALE,
            isPanelOpen
              ? "publicReview.comments.hide"
              : "publicReview.comments.show"
          )}
        </button>
      </div>

      <div
        className={`tw-grid tw-min-w-0 tw-gap-6 ${
          isPanelOpen
            ? "@[880px]:tw-grid-cols-[minmax(0,1fr)_18rem] @[880px]:tw-gap-6"
            : ""
        }`}
      >
        <div className="tw-order-2 tw-min-w-0 @[880px]:tw-order-1">
          {content}
        </div>

        <aside
          id={COMMENT_PANEL_ID}
          aria-label={t(DEFAULT_LOCALE, "publicReview.comments.title")}
          className={`tw-order-1 tw-scroll-mt-28 tw-outline-none @[880px]:tw-sticky @[880px]:tw-top-28 @[880px]:tw-order-2 @[880px]:tw-max-h-[calc(100vh-8rem)] @[880px]:tw-overflow-y-auto ${
            isPanelOpen ? "tw-block" : "tw-hidden"
          }`}
          tabIndex={-1}
        >
          <PublicReviewCommentPanelOpenContext.Provider value={isPanelOpen}>
            <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-[#08080a] tw-shadow-2xl tw-shadow-black/30">
              <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-p-4">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                  <div>
                    <p className="tw-m-0 tw-font-mono tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-amber-300">
                      {t(DEFAULT_LOCALE, "publicReview.comments.eyebrow", {
                        version: reviewVersion,
                      })}
                    </p>
                    <h2 className="tw-mb-0 tw-mt-2 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-white">
                      {t(DEFAULT_LOCALE, "publicReview.comments.title")}
                    </h2>
                  </div>
                  <ChatBubbleLeftRightIcon
                    className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-500"
                    aria-hidden="true"
                  />
                </div>
                <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-5 tw-text-iron-400">
                  {t(DEFAULT_LOCALE, "publicReview.comments.intro")}
                </p>
                <Link
                  href={ledgerHref}
                  className="hover:tw-text-primary-200 tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-decoration-primary-400/40 tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                >
                  {t(DEFAULT_LOCALE, "publicReview.comments.viewLedger")}
                </Link>
              </header>
              <div className="tw-space-y-5 tw-p-4">{panel}</div>
            </div>
          </PublicReviewCommentPanelOpenContext.Provider>
        </aside>
      </div>
    </section>
  );
}
