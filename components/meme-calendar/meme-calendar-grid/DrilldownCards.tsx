import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import { SZN1_RANGE } from "../meme-calendar.helpers";
import {
  DRILLDOWN_CARD_CLASS,
  getDateRangeLabel,
  getDrilldownCardAriaLabel,
  getMemeRangeLabel,
} from "./calendarText";

interface DrilldownCardProps {
  readonly title: string;
  readonly range: string;
  readonly mints: string;
  readonly isCurrent: boolean;
  readonly onClick: () => void;
  readonly locale: SupportedLocale;
}

export function DrilldownCard({
  title,
  range,
  mints,
  isCurrent,
  onClick,
  locale,
}: DrilldownCardProps) {
  return (
    <button
      type="button"
      aria-label={getDrilldownCardAriaLabel(locale, title, range, mints)}
      className={`${DRILLDOWN_CARD_CLASS} ${
        isCurrent
          ? "tw-border-emerald-400/60 tw-ring-inset tw-ring-emerald-400/20"
          : "tw-border-iron-800 tw-ring-iron-800 desktop-hover:hover:tw-border-iron-700"
      }`}
      onClick={onClick}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2">
        <div className="tw-text-lg tw-font-semibold tw-leading-6">{title}</div>
        {isCurrent && (
          <span className="tw-rounded-full tw-bg-emerald-400/10 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-emerald-300 tw-ring-1 tw-ring-inset tw-ring-emerald-400/30">
            {t(locale, "memeCalendar.grid.current")}
          </span>
        )}
      </div>
      <div className="tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-500">
        {range}
      </div>
      <div className="tw-mt-2 tw-text-sm tw-leading-5 tw-text-cyan-400">
        {mints}
      </div>
    </button>
  );
}

interface HistoricalLaunchDrilldownCardProps {
  readonly title: string;
  readonly isCurrent: boolean;
  readonly onClick: () => void;
  readonly locale: SupportedLocale;
}

export function HistoricalLaunchDrilldownCard({
  title,
  isCurrent,
  onClick,
  locale,
}: HistoricalLaunchDrilldownCardProps) {
  const start = new Date(SZN1_RANGE.start);
  const end = new Date(SZN1_RANGE.end);
  const range = getDateRangeLabel(locale, start, end);
  const mints = getMemeRangeLabel(locale, 1, 47);

  return (
    <div className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3">
      <DrilldownCard
        title={title}
        range={range}
        mints={mints}
        isCurrent={isCurrent}
        locale={locale}
        onClick={onClick}
      />
    </div>
  );
}
