import { formatEth } from "@/components/stream/ui/EthAmount";
import { STREAM_FOCUS, STREAM_LABEL } from "@/components/stream/ui/styles";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { EditionStepTotal } from "@/lib/stream/types";

const STATUS_CLASS: Readonly<Record<EditionStepTotal["status"], string>> = {
  in: "tw-text-success",
  part: "tw-text-amber-300",
  out: "tw-text-iron-500",
};

/**
 * The edition auction's order book: one row per used price, highest first,
 * with the editions bid there, the running total and in/part/out, and the
 * price line under the clearing row. A plain table; `onSelectStep` turns each
 * price into a button that pre-fills a bid.
 */
export default function OrderBookTable({
  rows,
  count,
  clearingStep,
  locale,
  mine,
  onSelectStep,
}: {
  /** `stepTotals`, ascending by step. */
  readonly rows: readonly EditionStepTotal[];
  /** k, for the price line. */
  readonly count: number;
  readonly clearingStep: number | null;
  readonly locale: SupportedLocale;
  /** Units the viewer has at each step. */
  readonly mine?: ReadonlyMap<number, number>;
  readonly onSelectStep?: (step: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "stream.book.empty")}
      </p>
    );
  }
  const descending = [...rows].reverse();
  return (
    <div className="tw-overflow-x-auto">
      <table className="tw-w-full tw-border-collapse tw-text-left tw-text-sm tw-tabular-nums">
        <caption className="tw-sr-only">
          {t(locale, "stream.book.caption")}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={`${STREAM_LABEL} tw-py-2 tw-pr-3`}>
              {t(locale, "stream.book.price")}
            </th>
            <th
              scope="col"
              className={`${STREAM_LABEL} tw-py-2 tw-pr-3 tw-text-right`}
            >
              {t(locale, "stream.book.editions")}
            </th>
            <th
              scope="col"
              className={`${STREAM_LABEL} tw-py-2 tw-pr-3 tw-text-right`}
            >
              {t(locale, "stream.book.total")}
            </th>
            <th scope="col" className={`${STREAM_LABEL} tw-py-2`}>
              <span className="tw-sr-only">
                {t(locale, "stream.book.status")}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {descending.map((row) => {
            const yours = mine?.get(row.step) ?? 0;
            const price = formatEth(locale, row.price);
            return [
              <tr
                key={row.step}
                className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07]"
              >
                <td className="tw-whitespace-nowrap tw-py-2 tw-pr-3 tw-text-iron-50">
                  {onSelectStep === undefined ? (
                    price
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectStep(row.step)}
                      className={`tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-iron-50 hover:tw-underline ${STREAM_FOCUS}`}
                      aria-label={t(locale, "stream.book.select", { price })}
                    >
                      {price}
                    </button>
                  )}
                </td>
                <td className="tw-py-2 tw-pr-3 tw-text-right tw-text-iron-200">
                  {formatInteger(locale, row.units)}
                  {yours > 0 ? (
                    <span className="tw-ml-1.5 tw-text-xs tw-text-primary-300">
                      {t(locale, "stream.book.yours", {
                        units: formatInteger(locale, yours),
                      })}
                    </span>
                  ) : null}
                </td>
                <td className="tw-py-2 tw-pr-3 tw-text-right tw-text-iron-300">
                  {formatInteger(locale, row.cumulative)}
                </td>
                <td
                  className={`tw-py-2 tw-text-xs tw-font-medium ${STATUS_CLASS[row.status]}`}
                >
                  {row.status === "part"
                    ? t(locale, "stream.book.status.part", {
                        won: formatInteger(locale, row.won),
                        units: formatInteger(locale, row.units),
                      })
                    : t(locale, `stream.book.status.${row.status}`)}
                </td>
              </tr>,
              row.step === clearingStep ? (
                <tr key={`${row.step}-line`}>
                  <td colSpan={4} className="tw-py-1">
                    <p className="tw-m-0 tw-border-0 tw-border-t-2 tw-border-dashed tw-border-primary-400 tw-pt-1 tw-text-xs tw-font-medium tw-text-primary-300">
                      {t(locale, "stream.book.priceLine", {
                        count: formatInteger(locale, count),
                        price,
                      })}
                    </p>
                  </td>
                </tr>
              ) : null,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
