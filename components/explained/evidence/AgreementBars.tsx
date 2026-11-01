import { Fragment, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { tRich } from "@/i18n/messages";
import { isFact, type FactEntry } from "@/lib/explained/facts";
import FactValue from "../facts/FactValue";
import { kt } from "../i18n";

/**
 * The agreement view (EXPLAINED.md §6.4, §9): only the comparisons the run
 * makes, each a bar as long as the share that agrees, green where it holds.
 * A share below the whole leaves its rest in rose.
 */
export interface AgreementPair {
  readonly who: string;
  readonly sub: string;
  readonly equal: FactEntry | null;
  readonly total: FactEntry | null;
  /** "identities equal" */
  readonly unit: string;
}

function numberOf(entry: FactEntry | null): number | null {
  return entry && isFact(entry) && typeof entry.value === "number"
    ? entry.value
    : null;
}

export default function AgreementBars({
  pairs,
  locale,
}: {
  readonly pairs: readonly AgreementPair[];
  readonly locale: SupportedLocale;
}) {
  return (
    <ul
      className="tw-m-0 tw-list-none tw-p-0"
      aria-label={kt(locale, "explained.kit.agree.label")}
      data-agreement=""
    >
      {pairs.map((pair) => {
        const equal = numberOf(pair.equal);
        const total = numberOf(pair.total);
        // An unread count is not a difference: it draws a dashed neutral
        // track (EXPLAINED.md §3 rule 8), never a rose bar.
        const share =
          equal !== null && total !== null && total > 0 ? equal / total : null;
        // Each count is printed through its fact, so it carries its source.
        const count =
          pair.equal && isFact(pair.equal) && pair.total && isFact(pair.total)
            ? tRich<ReactNode>(locale, "explained.kit.agree.of", {
                equal: <FactValue fact={pair.equal} locale={locale} />,
                total: <FactValue fact={pair.total} locale={locale} />,
              }).map((part, index) => (
                // The parts are the message's fixed segments, in order.
                <Fragment key={index}>{part}</Fragment>
              ))
            : kt(locale, "explained.kit.facts.unavailable");
        return (
          <li
            key={`${pair.who}-${pair.sub}`}
            className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 tw-text-base max-[359px]:tw-grid-cols-1 lg:tw-grid-cols-[250px_minmax(0,1fr)_190px] lg:tw-gap-[18px]"
            data-agree-share={share === null ? "unread" : share.toFixed(4)}
          >
            <span className="tw-font-semibold tw-text-iron-50">
              {pair.who}
              <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-400">
                {pair.sub}
              </span>
            </span>
            <span
              className={`tw-col-span-2 tw-row-start-2 tw-flex tw-h-2.5 tw-overflow-hidden tw-rounded-[5px] max-[359px]:tw-col-span-1 max-[359px]:tw-row-start-3 lg:tw-col-span-1 lg:tw-row-start-auto ${share === null ? "tw-border tw-border-dashed tw-border-iron-600 tw-bg-transparent" : "tw-bg-iron-800"}`}
              aria-hidden="true"
            >
              {share !== null && (
                <>
                  <span
                    className="tw-h-full tw-bg-green tw-transition-[width] tw-duration-[400ms] tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none"
                    style={{ width: `${share * 100}%` }}
                  />
                  {share < 1 && (
                    <span className="tw-h-full tw-flex-1 tw-bg-error" />
                  )}
                </>
              )}
            </span>
            <span className="tw-text-right tw-font-semibold tw-text-iron-50 max-[359px]:tw-text-left lg:tw-col-start-3">
              {count}
              <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-400">
                {pair.unit}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
