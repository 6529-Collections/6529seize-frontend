import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";

/**
 * The three tiers of network art on 6529.io: 6529 Stream (curated 1/1s),
 * 6529 Stream Editions (editions linked to a Stream 1/1) and Federated
 * (artist-owned contracts). A real table, so it reads row by row. The
 * federated pages and the explainers share it; pass `rows` for a shorter cut.
 */

type Tier = "stream" | "editions" | "federated";

const TIERS: readonly Tier[] = ["stream", "editions", "federated"];

type TierRow =
  | "what"
  | "admission"
  | "contract"
  | "sale"
  | "split"
  | "unbid"
  | "license"
  | "status";

const TIER_ROWS: readonly TierRow[] = [
  "what",
  "admission",
  "contract",
  "sale",
  "split",
  "unbid",
  "license",
  "status",
];

const CELL = "tw-py-2 tw-pr-3 tw-align-top last:tw-pr-0";

export default function TierComparison({
  locale,
  highlight,
  rows = TIER_ROWS,
}: {
  readonly locale: SupportedLocale;
  /** A column to emphasize, for example "federated" on the federated pages. */
  readonly highlight?: Tier;
  /** Which rows to show, in order. Defaults to every row. */
  readonly rows?: readonly TierRow[];
}) {
  return (
    <div className="tw-overflow-x-auto">
      <table className="tw-w-full tw-min-w-[34rem] tw-border-collapse tw-text-left tw-text-sm">
        <caption className="tw-sr-only">
          {t(locale, "stream.tiers.caption")}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className={`${CELL} tw-w-28 tw-text-xs tw-font-medium tw-text-iron-400`}
            >
              <span className="tw-sr-only">
                {t(locale, "stream.tiers.aspect")}
              </span>
            </th>
            {TIERS.map((tier) => (
              <th
                key={tier}
                scope="col"
                className={`${CELL} tw-font-semibold ${highlight === tier ? "tw-text-primary-300" : "tw-text-iron-100"}`}
              >
                {t(locale, `stream.tiers.${tier}.name`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row}
              className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800"
            >
              <th
                scope="row"
                className={`${CELL} tw-text-xs tw-font-medium tw-text-iron-400`}
              >
                {t(locale, `stream.tiers.row.${row}`)}
              </th>
              {TIERS.map((tier) => (
                <td
                  key={tier}
                  className={`${CELL} ${highlight === tier ? "tw-text-iron-50" : "tw-text-iron-300"}`}
                >
                  {t(locale, `stream.tiers.${tier}.${row}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
