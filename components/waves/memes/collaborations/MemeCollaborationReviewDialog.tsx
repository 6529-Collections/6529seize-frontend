"use client";

import AgreementStepAgreement from "@/components/waves/memes/submission/steps/AgreementStepAgreement";

import { useCallback, useId, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Button from "@/components/utils/button/Button";
import type { ApiMemeCollaborationState } from "@/generated/models/ApiMemeCollaborationState";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import styles from "./MemeCollaborationReviewDialog.module.css";

function reviewMediaUrls(state: ApiMemeCollaborationState): string[] {
  return [
    ...new Set(
      [state.artwork?.image_url, state.artwork?.animation_url]
        .filter((url): url is string => !!url)
        .map(resolveIpfsUrlSync)
        .filter((url) => {
          try {
            return ["https:", "http:"].includes(
              new URL(url, "https://6529.io").protocol
            );
          } catch {
            return false;
          }
        })
    ),
  ];
}

export function MemeCollaborationReviewDialog({
  state,
  saving,
  initialArtistName,
  onClose,
  onAccept,
}: {
  readonly state: ApiMemeCollaborationState;
  readonly saving: boolean;
  readonly initialArtistName: string;
  readonly onClose: () => void;
  readonly onAccept: (artistName: string) => void;
}) {
  const locale = useBrowserLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [artistName, setArtistName] = useState(initialArtistName);
  const artistNameId = useId();
  const trimmedArtistName = artistName.trim();
  const viewportRef = useCallback((element: HTMLDivElement | null) => {
    const viewport = globalThis.visualViewport;
    if (!element || !viewport) return;
    let focusFrame: number | undefined;
    const revealFocusedField = () => {
      if (focusFrame !== undefined) globalThis.cancelAnimationFrame(focusFrame);
      // Focus can move between keyboard layouts without a delivered size change.
      focusFrame = globalThis.requestAnimationFrame(() => {
        focusFrame = undefined;
        const focused = document.activeElement;
        if (focused instanceof HTMLInputElement && element.contains(focused)) {
          focused.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      });
    };
    const fitViewport = () => {
      // Preserve browser zoom; native shells also retain their own inset.
      if (viewport.scale > 1) {
        element.style.removeProperty("--review-viewport-height");
        element.style.removeProperty("--review-viewport-top");
        return;
      }
      element.style.setProperty(
        "--review-viewport-height",
        `${viewport.height}px`
      );
      element.style.setProperty(
        "--review-viewport-top",
        `${viewport.offsetTop}px`
      );
      revealFocusedField();
    };
    fitViewport();
    const observer = new ResizeObserver(revealFocusedField);
    observer.observe(element);
    element.addEventListener("focusin", revealFocusedField);
    viewport.addEventListener("resize", fitViewport);
    viewport.addEventListener("scroll", fitViewport, { passive: true });
    return () => {
      observer.disconnect();
      if (focusFrame !== undefined) globalThis.cancelAnimationFrame(focusFrame);
      element.removeEventListener("focusin", revealFocusedField);
      viewport.removeEventListener("resize", fitViewport);
      viewport.removeEventListener("scroll", fitViewport);
    };
  }, []);
  return (
    <Dialog
      initialFocus={headingRef}
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000001]"
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-600/60 tw-backdrop-blur-[1px]" />
      <div
        ref={viewportRef}
        className="tw-fixed tw-inset-x-0 tw-top-[var(--review-viewport-top,0px)] tw-flex tw-h-[min(var(--review-viewport-height,100dvh),calc(100dvh-var(--native-keyboard-inset-bottom,0px)))] tw-items-end tw-justify-center tw-overflow-hidden tw-pt-[env(safe-area-inset-top,0px)] sm:tw-items-center md:tw-p-4"
      >
        <DialogPanel
          className={clsx(
            styles["panel"],
            "tw-flex tw-h-full tw-max-h-full tw-w-full tw-max-w-screen-xl tw-flex-col tw-overflow-hidden tw-rounded-t-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl sm:tw-rounded-xl"
          )}
        >
          <div className="tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-py-3 md:tw-px-8">
            <DialogTitle
              ref={headingRef}
              tabIndex={-1}
              className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100"
            >
              {t(locale, "memes.collaborations.review")}
            </DialogTitle>
            <Button
              variant="ghost"
              size={null}
              className="tw-size-11"
              disabled={saving}
              aria-label={t(locale, "memes.collaborations.closeReview")}
              onClick={onClose}
            >
              <XMarkIcon aria-hidden="true" className="tw-size-5" />
            </Button>
          </div>
          <div
            className={clsx(
              styles["layout"],
              "tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden"
            )}
          >
            <section
              aria-label={t(locale, "memes.collaborations.reviewContents")}
              className={clsx(
                styles["body"],
                "tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-py-5 tw-text-sm tw-leading-6 tw-text-iron-200 md:tw-px-8"
              )}
            >
              <div className="tw-mx-auto tw-max-w-5xl tw-space-y-5">
                {state.artwork && (
                  <div className="tw-space-y-2">
                    <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
                      {state.artwork.name}
                    </h3>
                    <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words">
                      {state.artwork.description}
                    </p>
                    {reviewMediaUrls(state).map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tw-block tw-text-primary-300 hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                      >
                        {t(locale, "memes.collaborations.reviewMedia")}
                      </a>
                    ))}
                  </div>
                )}
                <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words">
                  {state.acceptance_copy}
                </p>
                {state.terms && (
                  <section className="tw-space-y-2">
                    <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                      {t(locale, "memes.collaborations.terms")}
                    </h3>
                    <AgreementStepAgreement
                      text={state.terms}
                      scrollable={false}
                    />
                  </section>
                )}
              </div>
            </section>
            <div className="tw-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] tw-pt-3 md:tw-px-8">
              <div className="tw-mx-auto tw-max-w-5xl tw-space-y-3 tw-text-sm tw-text-iron-200">
                <div className="tw-space-y-1">
                  <label
                    htmlFor={artistNameId}
                    className="tw-block tw-font-medium tw-text-iron-100"
                  >
                    {t(locale, "memes.collaborations.artistName")}
                  </label>
                  <input
                    id={artistNameId}
                    type="text"
                    required
                    maxLength={200}
                    value={artistName}
                    disabled={saving}
                    aria-describedby={`${artistNameId}-hint`}
                    onChange={(event) => {
                      setArtistName(event.target.value);
                      setConfirmed(false);
                    }}
                    className="tw-form-input tw-block tw-min-h-11 tw-w-full tw-scroll-my-2 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-base tw-text-iron-100 tw-ring-1 tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 md:tw-max-w-md"
                  />
                  <p
                    id={`${artistNameId}-hint`}
                    className="tw-m-0 tw-text-iron-400"
                  >
                    {t(locale, "memes.collaborations.artistNameHint")}
                  </p>
                </div>
                <div className="tw-grid tw-items-center tw-gap-3 md:tw-grid-cols-[minmax(0,1fr)_auto]">
                  <label className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-start tw-gap-3 md:tw-items-center">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      disabled={saving}
                      onChange={(event) => setConfirmed(event.target.checked)}
                      className="tw-form-checkbox tw-mt-1 tw-size-5 tw-shrink-0 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400 md:tw-mt-0"
                    />
                    <span>{t(locale, "memes.collaborations.confirm")}</span>
                  </label>
                  <div className="tw-flex tw-flex-wrap tw-justify-end tw-gap-3 tw-pb-0">
                    <Button
                      variant="secondary"
                      size="md"
                      className="tw-min-h-11"
                      disabled={saving}
                      onClick={onClose}
                    >
                      {t(locale, "memes.collaborations.notNow")}
                    </Button>
                    <Button
                      variant="action"
                      size="md"
                      className="tw-min-h-11"
                      loading={saving}
                      disabled={
                        !confirmed ||
                        !trimmedArtistName ||
                        trimmedArtistName.length > 200
                      }
                      onClick={() => onAccept(trimmedArtistName)}
                    >
                      {t(locale, "memes.collaborations.accept")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
