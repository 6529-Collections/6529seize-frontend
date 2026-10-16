"use client";

import { useRef, useState } from "react";
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
  onClose,
  onAccept,
}: {
  readonly state: ApiMemeCollaborationState;
  readonly saving: boolean;
  readonly onClose: () => void;
  readonly onAccept: () => void;
}) {
  const locale = useBrowserLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Dialog
      initialFocus={headingRef}
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      className="tailwind-scope tw-relative tw-z-[1000001]"
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-600/60 tw-backdrop-blur-[1px]" />
      <div className="tw-fixed tw-inset-0 tw-flex tw-items-end tw-justify-center tw-overflow-hidden tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:tw-items-center sm:tw-p-4">
        <DialogPanel className="tw-flex tw-max-h-full tw-w-full tw-max-w-xl tw-flex-col tw-overflow-hidden tw-rounded-t-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl sm:tw-max-h-[calc(100dvh-2rem)] sm:tw-rounded-xl">
          <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-5 tw-py-4">
            <DialogTitle
              ref={headingRef}
              tabIndex={-1}
              className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100"
            >
              {t(locale, "memes.collaborations.review")}
            </DialogTitle>
          </div>
          <div className="tw-min-h-0 tw-space-y-5 tw-overflow-y-auto tw-overscroll-contain tw-p-5 tw-text-sm tw-leading-6 tw-text-iron-200">
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
                <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-iron-900 tw-p-4">
                  {state.terms}
                </p>
              </section>
            )}
            <label className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-start tw-gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={saving}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="tw-form-checkbox tw-mt-1 tw-size-5 tw-shrink-0 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400"
              />
              <span>{t(locale, "memes.collaborations.confirm")}</span>
            </label>
          </div>
          <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-justify-end tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-px-5 tw-pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] tw-pt-4 sm:tw-pb-4">
            <Button
              variant="secondary"
              size="lg"
              disabled={saving}
              onClick={onClose}
            >
              {t(locale, "memes.collaborations.notNow")}
            </Button>
            <Button
              variant="action"
              size="lg"
              loading={saving}
              disabled={!confirmed}
              onClick={onAccept}
            >
              {t(locale, "memes.collaborations.accept")}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
