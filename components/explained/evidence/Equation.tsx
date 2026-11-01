import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactEntry } from "@/lib/explained/facts";
import { kt } from "../i18n";
import FactValue from "../facts/FactValue";

/**
 * Three totals as an equation (EXPLAINED.md §6.4): the first as computed,
 * the next ones with = in green when they equal it, ≠ in rose when not.
 * The relation is read from the values, never set by hand.
 */
export interface EquationRow {
  readonly who: string;
  readonly sub: string;
  readonly value: FactEntry | null;
  /** A constructed value (a simulated day) in place of a fact. */
  readonly simulated?: ReactNode;
}

function valueOf(row: EquationRow): unknown {
  return row.value && "value" in row.value ? row.value.value : undefined;
}

const NONE_FORCED: readonly number[] = [];

export default function Equation({
  rows,
  label,
  locale,
  forceDiffers = NONE_FORCED,
}: {
  readonly rows: readonly EquationRow[];
  /** "Total TDH, cycle 20,744". */
  readonly label: ReactNode;
  readonly locale: SupportedLocale;
  /** Rows shown as differing (a simulated day), by index. */
  readonly forceDiffers?: readonly number[];
}) {
  const first = rows[0] ? valueOf(rows[0]) : undefined;
  return (
    <div data-equation="">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {label}
      </span>
      <div className="tw-mt-2">
        {rows.map((row, index) => {
          const differs =
            forceDiffers.includes(index) ||
            (index > 0 && valueOf(row) !== first);
          let relation = differs ? "differs" : "equal";
          if (index === 0) relation = "first";
          return (
            <div
              key={row.who}
              className="tw-grid tw-grid-cols-1 tw-items-baseline tw-gap-1 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-3 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-gap-3"
              data-relation={relation}
            >
              <div className="tw-text-[15px] tw-font-semibold tw-text-iron-50">
                {row.who}
                <span className="tw-block tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
                  {row.sub}
                </span>
              </div>
              <div className="tw-whitespace-nowrap tw-text-[22px] tw-font-semibold tw-leading-[30px] tw-tracking-[-0.02em] tw-text-iron-50 max-[359px]:tw-text-lg md:tw-text-[26px]">
                {index > 0 && (
                  <span
                    className={`tw-mr-2 ${differs ? "tw-text-error" : "tw-text-green"}`}
                    aria-label={kt(
                      locale,
                      differs
                        ? "explained.kit.equation.differs"
                        : "explained.kit.equation.equal"
                    )}
                  >
                    {differs ? "≠" : "="}
                  </span>
                )}
                {row.simulated ?? (
                  <FactValue fact={row.value} locale={locale} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
