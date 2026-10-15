"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { TDH_BUTTON, TDH_FOCUS_RING } from "../../shared/tdhStyles";

export interface DayOption {
  readonly cycleDay: number;
  readonly label: string;
}

const NAV_LINK = `tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-px-3 tw-text-sm tw-font-medium tw-no-underline tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-iron-50 ${TDH_FOCUS_RING}`;
const NAV_DISABLED =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-px-3 tw-text-sm tw-font-medium tw-text-iron-600";

export function verificationDayHref(cycleDay: number): string {
  return `/network/tdh/verification/${cycleDay}`;
}

/**
 * Previous, next and latest links plus a list of every published day. The
 * select only navigates on "Show day", so moving through it with the keyboard
 * never changes the page by itself (WCAG 3.2.2). "Latest" always holds its
 * place, so the toolbar does not shift between days.
 */
export default function VerificationDayPicker({
  locale,
  options,
  selected,
  previous,
  next,
  latest,
}: {
  readonly locale: SupportedLocale;
  readonly options: readonly DayOption[];
  readonly selected: number;
  readonly previous: number | null;
  readonly next: number | null;
  readonly latest: number | null;
}) {
  const router = useRouter();
  const selectId = useId();
  const [choice, setChoice] = useState(String(selected));

  const latestLink =
    latest === null || latest === selected ? (
      <span className={NAV_DISABLED} aria-disabled="true">
        {t(locale, "network.tdh.verify.picker.latest")}
      </span>
    ) : (
      <Link href="/network/tdh/verification" className={NAV_LINK}>
        {t(locale, "network.tdh.verify.picker.latest")}
      </Link>
    );

  return (
    <nav
      aria-label={t(locale, "network.tdh.verify.picker.nav")}
      className="tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1">
        {previous === null ? (
          <span className={NAV_DISABLED} aria-disabled="true">
            <ArrowLeftIcon aria-hidden="true" className="tw-size-4" />
            {t(locale, "network.tdh.verify.picker.previous")}
          </span>
        ) : (
          <Link href={verificationDayHref(previous)} className={NAV_LINK}>
            <ArrowLeftIcon aria-hidden="true" className="tw-size-4" />
            {t(locale, "network.tdh.verify.picker.previous")}
          </Link>
        )}
        {next === null ? (
          <span
            className={NAV_DISABLED}
            aria-disabled="true"
            title={t(locale, "network.tdh.verify.picker.nextNone")}
          >
            {t(locale, "network.tdh.verify.picker.next")}
            <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
            <span className="tw-sr-only">
              {t(locale, "network.tdh.verify.picker.nextNone")}
            </span>
          </span>
        ) : (
          <Link href={verificationDayHref(next)} className={NAV_LINK}>
            {t(locale, "network.tdh.verify.picker.next")}
            <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
          </Link>
        )}
        {latestLink}
      </div>
      {options.length > 1 && (
        <form
          className="tw-flex tw-w-full tw-items-center tw-gap-2 sm:tw-w-auto"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(verificationDayHref(Number(choice)));
          }}
        >
          <label htmlFor={selectId} className="tw-sr-only">
            {t(locale, "network.tdh.verify.picker.label")}
          </label>
          <select
            id={selectId}
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
            className={`tw-min-h-11 tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-pr-8 tw-text-sm tw-text-iron-100 sm:tw-flex-none ${TDH_FOCUS_RING}`}
          >
            {options.map((option) => (
              <option key={option.cycleDay} value={option.cycleDay}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className={`${TDH_BUTTON} tw-shrink-0`}>
            {t(locale, "network.tdh.verify.picker.go")}
          </button>
        </form>
      )}
    </nav>
  );
}
