import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { ot, type OverviewKey } from "./copy";
import type { RecordRow } from "./explain";

/**
 * A record's cards: copies × whole days × rate = base TDH. A table from
 * `md` up; on a phone each card is a short list of label and value, so
 * nothing scrolls sideways.
 */
const NAME: Record<RecordRow["collection"], OverviewKey> = {
  memes: "explain.memeName",
  gradients: "explain.gradientName",
  nextgen: "explain.nextgenName",
};

const HEADS: readonly OverviewKey[] = [
  "explain.colCopies",
  "explain.colDays",
  "explain.colRate",
  "explain.colBase",
];

const CELL = "tw-py-3 tw-pl-4 tw-text-right tw-tabular-nums";

function cells(row: RecordRow, locale: SupportedLocale): string[] {
  const [min, max] = row.days;
  const days =
    max === undefined
      ? formatCount(locale, min)
      : ot(locale, "explain.daysRange", {
          min: formatCount(locale, min),
          max: formatCount(locale, max),
        });
  return [
    formatCount(locale, row.copies),
    days,
    formatCents(locale, row.rateCents / 100),
    formatCount(locale, row.base),
  ];
}

export default function RecordTable({
  rows,
  locale,
}: {
  readonly rows: readonly RecordRow[];
  readonly locale: SupportedLocale;
}) {
  const name = (row: RecordRow) =>
    ot(locale, NAME[row.collection], { id: row.id });
  const edition = (row: RecordRow) =>
    row.edition === null
      ? null
      : ` · ${ot(locale, "explain.cardCopies", { copies: formatCount(locale, row.edition) })}`;
  return (
    <>
      <table className="tw-w-full tw-border-collapse tw-text-base tw-leading-6 tw-text-iron-300 max-md:tw-hidden">
        <thead>
          <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800">
            <th
              scope="col"
              className="tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400"
            >
              {ot(locale, "explain.colCard")}
            </th>
            {HEADS.map((head) => (
              <th
                key={head}
                scope="col"
                className={`${CELL} tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400`}
              >
                {ot(locale, head)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.collection}-${row.id}`}
              className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900"
            >
              <th scope="row" className="tw-py-3 tw-text-left tw-font-normal">
                <b className="tw-font-semibold tw-text-iron-50">{name(row)}</b>
                {edition(row)}
              </th>
              {cells(row, locale).map((value, index) => (
                <td key={HEADS[index]} className={CELL}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-4 tw-p-0 md:tw-hidden">
        {rows.map((row) => (
          <li
            key={`${row.collection}-${row.id}`}
            className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-pb-3"
          >
            <span className="tw-block tw-text-base tw-text-iron-300">
              <b className="tw-font-semibold tw-text-iron-50">{name(row)}</b>
              {edition(row)}
            </span>
            <dl className="tw-m-0 tw-mt-1.5 tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-x-3 tw-gap-y-1 tw-text-[15px] tw-leading-6">
              {cells(row, locale).map((value, index) => (
                <div key={HEADS[index]} className="tw-contents">
                  <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-6 tw-tracking-[0.12em] tw-text-iron-400">
                    {ot(locale, HEADS[index] ?? "explain.colCopies")}
                  </dt>
                  <dd className="tw-m-0 tw-text-right tw-tabular-nums tw-text-iron-300">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
