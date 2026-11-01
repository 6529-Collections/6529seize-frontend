import type { ReactNode } from "react";

import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";

/** One card of the edition auction panel: an 11px label heading and an aside. */
export function PanelCard({
  id,
  title,
  aside,
  className = "",
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly aside?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`${STREAM_CARD} tw-min-w-0 tw-px-4 tw-py-4 sm:tw-px-5 ${className}`}
    >
      <div className="tw-mb-3 tw-flex tw-items-baseline tw-justify-between tw-gap-2">
        <h2 id={id} className={STREAM_LABEL}>
          {title}
        </h2>
        {aside === undefined ? null : (
          <span className="tw-text-right tw-text-xs tw-tabular-nums tw-text-iron-400">
            {aside}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

type Standing = "in" | "partly" | "out";

export function standingOf(won: number, qty: number): Standing {
  if (won >= qty) {
    return "in";
  }
  return won > 0 ? "partly" : "out";
}

const STANDING_CLASS: Readonly<Record<Standing, string>> = {
  in: "tw-bg-success/15 tw-text-success",
  partly: "tw-bg-amber-400/10 tw-text-amber-300",
  out: "tw-bg-white/[0.06] tw-text-iron-400",
};

/** In / 3 of 5 in / Out: a small square-cornered tag, not a pill. */
export function StandingTag({
  won,
  qty,
  locale,
}: {
  readonly won: number;
  readonly qty: number;
  readonly locale: SupportedLocale;
}) {
  const standing = standingOf(won, qty);
  return (
    <span
      className={`tw-inline-flex tw-h-5 tw-flex-none tw-items-center tw-whitespace-nowrap tw-rounded tw-px-1.5 tw-text-xs tw-font-semibold tw-tabular-nums ${STANDING_CLASS[standing]}`}
    >
      {standing === "partly"
        ? t(locale, "stream.editionAuction.tag.partly", {
            won: formatInteger(locale, won),
            qty: formatInteger(locale, qty),
          })
        : t(locale, `stream.editionAuction.tag.${standing}`)}
    </span>
  );
}

/** A full-width secondary action inside a card (raise, use a price, show more). */
export const PANEL_ACTION = `tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-left tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-50 hover:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${STREAM_FOCUS}`;

/** The panel's main button (bid, settle, claim). */
export const PANEL_PRIMARY = `tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-[15px] tw-font-semibold tw-tabular-nums tw-text-white hover:tw-bg-primary-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${STREAM_FOCUS}`;

/** Muted helper text, one line per idea. */
export const PANEL_NOTE = "tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400";
