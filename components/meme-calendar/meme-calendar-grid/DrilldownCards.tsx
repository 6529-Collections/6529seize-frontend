import type { SupportedLocale } from "@/i18n/locales";

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

interface HistoricalLaunchDrilldownCardProps {
  readonly title: string;
  readonly isCurrent: boolean;
  readonly onClick: () => void;
  readonly locale: SupportedLocale;
}

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
      className={DRILLDOWN_CARD_CLASS}
      style={{
        borderColor: isCurrent ? "#20fa59" : "#222222",
        borderWidth: isCurrent ? "2px" : "1px",
      }}
      onClick={onClick}
    >
      <div className="tw-font-semibold">{title}</div>
      <div className="tw-text-xs tw-text-gray-500">{range}</div>
      <div className="tw-mt-1 tw-text-sm">{mints}</div>
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
    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4">
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
