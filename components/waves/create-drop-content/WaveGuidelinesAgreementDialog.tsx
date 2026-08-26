"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useId } from "react";
import { createPortal } from "react-dom";

interface WaveGuidelinesAgreementDialogProps {
  readonly guidelines: string | null;
  readonly onAgree: () => void;
  readonly onDecline: () => void;
}

export default function WaveGuidelinesAgreementDialog({
  guidelines,
  onAgree,
  onDecline,
}: WaveGuidelinesAgreementDialogProps) {
  const locale = useBrowserLocale();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const guidelinesTitleId = useId();
  const isOpen = guidelines !== null;

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Transition show as={Fragment}>
      <Dialog
        as="div"
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000001] tw-cursor-default"
        onClose={onDecline}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-duration-200 tw-ease-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-150 tw-ease-in"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <DialogBackdrop className="tw-fixed tw-inset-0 tw-border-0 tw-bg-iron-600/60 tw-p-0 tw-backdrop-blur-[1px]" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-z-[100] tw-flex tw-min-h-0 tw-items-end tw-justify-center tw-overflow-hidden tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:tw-items-center sm:tw-p-4">
          <TransitionChild
            as={Fragment}
            enter="tw-duration-250 tw-transform tw-transition tw-ease-out"
            enterFrom="tw-translate-y-full tw-opacity-0 sm:tw-translate-y-2"
            enterTo="tw-translate-y-0 tw-opacity-100"
            leave="tw-transform tw-transition tw-duration-150 tw-ease-in"
            leaveFrom="tw-translate-y-0 tw-opacity-100"
            leaveTo="tw-translate-y-full tw-opacity-0 sm:tw-translate-y-2"
          >
            <DialogPanel
              aria-describedby={dialogDescriptionId}
              aria-labelledby={dialogTitleId}
              data-testid="wave-guidelines-panel"
              className="tw-flex tw-max-h-full tw-w-full tw-max-w-xl tw-flex-col tw-overflow-hidden tw-rounded-t-xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl tw-shadow-black/30 sm:tw-max-h-[min(42rem,calc(100dvh-2rem))] sm:tw-rounded-xl sm:tw-border"
            >
              <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-4 tw-py-4 sm:tw-px-6 sm:tw-py-5">
                <DialogTitle
                  id={dialogTitleId}
                  className="tw-m-0 !tw-text-lg !tw-font-semibold !tw-leading-6 !tw-text-iron-50"
                >
                  {t(locale, "waves.chat.guidelinesDialog.title")}
                </DialogTitle>
                <Description
                  id={dialogDescriptionId}
                  className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-leading-5 tw-text-iron-400"
                >
                  {t(locale, "waves.chat.guidelinesDialog.description")}
                </Description>
              </div>

              <div
                aria-labelledby={guidelinesTitleId}
                data-testid="wave-guidelines-scroller"
                role="region"
                tabIndex={0}
                className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-py-4 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600 sm:tw-px-6 sm:tw-py-5"
              >
                <section>
                  <h3
                    id={guidelinesTitleId}
                    className="tw-m-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.08em] !tw-text-iron-400"
                  >
                    {t(locale, "waves.chat.guidelinesDialog.guidelinesLabel")}
                  </h3>
                  <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/70 tw-p-4">
                    <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
                      {guidelines}
                    </p>
                  </div>
                </section>
              </div>

              <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-px-4 tw-pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] tw-pt-4 sm:tw-px-6 sm:tw-pb-5 sm:tw-pt-5">
                <p className="tw-mb-3 tw-mt-0 tw-text-xs tw-leading-4 tw-text-iron-400">
                  {t(locale, "waves.chat.guidelinesDialog.actionHint")}
                </p>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={onDecline}
                  >
                    {t(locale, "waves.chat.guidelinesDialog.decline")}
                  </Button>
                  <Button
                    data-autofocus
                    variant="action"
                    size="lg"
                    fullWidth
                    onClick={onAgree}
                  >
                    {t(locale, "waves.chat.guidelinesDialog.agree")}
                  </Button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>,
    document.body
  );
}
