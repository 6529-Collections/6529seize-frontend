import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";

/**
 * The three tiers of network art (6529chain D79): The Memes; 6529 Stream with
 * 6529 Stream Editions; Federated. A real table, so it reads row by row.
 */

type Tier = "memes" | "stream" | "federated";

const TIERS: readonly Tier[] = ["memes", "stream", "federated"];

const ROWS = [
  "contract",
  "split",
  "curation",
  "tdh",
  "discovery",
  "license",
  "status",
] as const;

export default function TierComparison({
  locale,
  highlight,
}: {
  readonly locale: SupportedLocale;
  /** A column to emphasize, for example "federated" on the federated pages. */
  readonly highlight?: Tier;
}) {
  return (
    <div className="tw-overflow-x-auto">
      <table className="tw-w-full tw-min-w-[36rem] tw-border-collapse tw-text-left tw-text-sm">
        <caption className="tw-sr-only">
          {t(locale, "stream.tiers.caption")}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="tw-w-32 tw-py-2 tw-pr-3 tw-text-xs tw-font-medium tw-text-iron-400"
            >
              <span className="tw-sr-only">
                {t(locale, "stream.tiers.aspect")}
              </span>
            </th>
            {TIERS.map((tier) => (
              <th
                key={tier}
                scope="col"
                className={`tw-py-2 tw-pr-3 tw-text-sm tw-font-semibold ${highlight === tier ? "tw-text-primary-300" : "tw-text-iron-100"}`}
              >
                {t(locale, `stream.tiers.${tier}.name`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr
              key={row}
              className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800"
            >
              <th
                scope="row"
                className="tw-py-2 tw-pr-3 tw-align-top tw-text-xs tw-font-medium tw-text-iron-400"
              >
                {t(locale, `stream.tiers.row.${row}`)}
              </th>
              {TIERS.map((tier) => (
                <td
                  key={tier}
                  className="tw-py-2 tw-pr-3 tw-align-top tw-text-iron-200"
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
