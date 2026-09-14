"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export function SubmissionSigningNote() {
  const locale = useBrowserLocale();

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-leading-5 tw-text-iron-400">
      <p className="tw-m-0">{t(locale, "memes.submission.signing.notice")}</p>
      <Popover>
        <PopoverButton
          type="button"
          className="tw-inline-flex tw-min-h-6 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100"
        >
          <InformationCircleIcon aria-hidden="true" className="tw-size-4" />
          <span className="tw-underline tw-decoration-iron-600 tw-underline-offset-4">
            {t(locale, "memes.submission.signing.explain")}
          </span>
        </PopoverButton>
        <PopoverPanel
          anchor={{ to: "top start", gap: 10, padding: 16 }}
          role="region"
          aria-label={t(locale, "memes.submission.signing.title")}
          className="tailwind-scope tw-z-[1030] tw-w-80 tw-max-w-[calc(100vw-2rem)] tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-shadow-xl"
        >
          <div className="tw-space-y-3 tw-text-left tw-text-sm tw-leading-5">
            <p className="tw-m-0 tw-font-semibold tw-text-iron-100">
              {t(locale, "memes.submission.signing.title")}
            </p>
            <p className="tw-m-0 tw-text-iron-300">
              {t(locale, "memes.submission.signing.review")}
            </p>
            <dl className="tw-m-0 tw-space-y-3">
              <div>
                <dt className="tw-font-medium tw-text-iron-100">
                  {t(locale, "memes.submission.signing.metamask")}
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-iron-300">
                  {t(locale, "memes.submission.signing.metamaskDescription")}
                </dd>
              </div>
              <div>
                <dt className="tw-font-medium tw-text-iron-100">
                  {t(locale, "memes.submission.signing.rabby")}
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-iron-300">
                  {t(locale, "memes.submission.signing.rabbyDescription")}
                </dd>
              </div>
            </dl>
            <p className="tw-m-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3 tw-text-iron-300">
              {t(locale, "memes.submission.signing.mismatch")}
            </p>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  );
}
