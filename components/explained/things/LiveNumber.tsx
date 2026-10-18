import type { SupportedLocale } from "@/i18n/locales";
import type { FactEntry } from "@/lib/explained/facts";
import FactValue from "../facts/FactValue";
import AsOf from "../marks/AsOf";

/**
 * A live number (EXPLAINED.md §6.5): a fact with its unit and its time, at
 * one of the number sizes. It changes only when its source does; an
 * unavailable source shows "not available", never a stale figure.
 */
const SIZE = {
  xl: "tw-text-[40px] tw-leading-[44px] md:tw-text-[60px] md:tw-leading-[64px]",
  l: "tw-text-[30px] tw-leading-9 md:tw-text-[40px] md:tw-leading-[46px]",
  m: "tw-text-[26px] tw-leading-8",
} as const;

export default function LiveNumber({
  fact,
  unit,
  locale,
  size = "l",
  tone = "ink",
  showAsOf = true,
}: {
  readonly fact: FactEntry | null;
  /** The unit after the number: "TDH". */
  readonly unit?: string;
  readonly locale: SupportedLocale;
  readonly size?: keyof typeof SIZE;
  readonly tone?: "ink" | "you";
  readonly showAsOf?: boolean;
}) {
  return (
    <span className="tw-inline-flex tw-flex-col tw-gap-1">
      <span
        className={`tw-font-semibold tw-tabular-nums tw-tracking-[-0.02em] ${SIZE[size]} ${tone === "you" ? "tw-text-primary-300" : "tw-text-iron-50"}`}
      >
        <FactValue fact={fact} locale={locale} />
        {unit ? ` ${unit}` : ""}
      </span>
      {showAsOf && fact && <AsOf fact={fact} locale={locale} />}
    </span>
  );
}
