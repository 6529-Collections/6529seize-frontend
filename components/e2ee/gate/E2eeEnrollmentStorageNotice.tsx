"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useId, useSyncExternalStore } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

const STEP_KEYS: readonly MessageKey[] = [
  "e2ee.enroll.clearOnExit.chrome",
  "e2ee.enroll.clearOnExit.edge",
  "e2ee.enroll.clearOnExit.firefox",
];

const FALLBACK_SITE = "6529.io";
const subscribeNever = () => () => undefined;
const getSite = (): string => {
  try {
    return globalThis.location.hostname || FALLBACK_SITE;
  } catch {
    return FALLBACK_SITE;
  }
};
const getServerSite = (): string => FALLBACK_SITE;

interface E2eeEnrollmentStorageNoticeProps {
  /** This browser seems to delete its data when it closes. */
  readonly clearOnExit: boolean;
  /** The browser didn't agree to keep this site's data (after asking). */
  readonly notPersisted: boolean;
}

/**
 * Warnings on the enrollment card about a browser that won't keep encrypted
 * messages: the clear-on-close pattern (with how to add an exception), or,
 * more softly, storage the browser didn't agree to keep. Both arrive after
 * the card renders, so they sit in one polite live region.
 */
export function E2eeEnrollmentStorageNotice({
  clearOnExit,
  notPersisted,
}: E2eeEnrollmentStorageNoticeProps) {
  const locale = useBrowserLocale();
  const headingId = useId();
  const site = useSyncExternalStore(subscribeNever, getSite, getServerSite);
  let notice = null;
  if (clearOnExit) {
    notice = (
      <section
        aria-labelledby={headingId}
        className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/10 tw-p-3 tw-text-sm tw-leading-6 tw-text-amber-100"
      >
        <h3
          id={headingId}
          className="tw-m-0 tw-flex tw-items-start tw-gap-2 tw-text-sm tw-font-semibold tw-text-amber-50"
        >
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0"
          />
          <span>{t(locale, "e2ee.enroll.clearOnExit.title")}</span>
        </h3>
        <p className="tw-m-0 tw-mt-1">
          {t(locale, "e2ee.enroll.clearOnExit.body")}
        </p>
        <p className="tw-m-0 tw-mt-2">
          {t(locale, "e2ee.enroll.clearOnExit.stepsIntro", { site })}
        </p>
        <ul className="tw-m-0 tw-mt-1 tw-flex tw-list-disc tw-flex-col tw-gap-1 tw-pl-5">
          {STEP_KEYS.map((key) => (
            <li key={key} className="tw-break-words">
              {t(locale, key, { site })}
            </li>
          ))}
        </ul>
        <p className="tw-m-0 tw-mt-2">
          {t(locale, "e2ee.enroll.clearOnExit.backup")}
        </p>
      </section>
    );
  } else if (notPersisted) {
    notice = (
      <p className="tw-m-0 tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "e2ee.enroll.notPersisted")}
      </p>
    );
  }
  return <div aria-live="polite">{notice}</div>;
}
