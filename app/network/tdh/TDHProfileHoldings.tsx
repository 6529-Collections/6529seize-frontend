import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { formatInteger, formatList, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { TDH_FOCUS, TDH_TEXT } from "./TDHSection";
import {
  TDH_COLLECTIONS,
  type TdhCollection,
  type TdhProfile,
  type TdhProfileToken,
} from "./tdh-profile.helpers";

const PAGE_SIZE = 20;
const COLUMNS = [
  "token",
  "copies",
  "days",
  "weight",
  "tokenBase",
  "tokenFinal",
] as const;
const CELL =
  "tw-whitespace-nowrap tw-px-3 tw-py-3 tw-text-right first:tw-pl-0 first:tw-text-left last:tw-pr-0";

export default function TDHProfileHoldings({
  profile,
  locale,
}: {
  readonly profile: TdhProfile;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-3">
      {TDH_COLLECTIONS.map((collection) => (
        <Collection
          key={collection}
          tokens={profile[collection]}
          boost={profile.boost}
          collection={collection}
          locale={locale}
        />
      ))}
    </div>
  );
}

function Collection({
  tokens,
  boost,
  collection,
  locale,
}: {
  readonly tokens: TdhProfileToken[];
  readonly boost: number;
  readonly collection: TdhCollection;
  readonly locale: SupportedLocale;
}) {
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(tokens.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const start = currentPage * PAGE_SIZE;
  const visible = tokens.slice(start, start + PAGE_SIZE);
  const collectionName = t(
    locale,
    `network.tdh.profile.collection.${collection}`
  );
  const total = tokens.reduce(
    (sum, token) => sum + Math.round(token.tdh * boost),
    0
  );
  return (
    <details className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0">
      <summary
        className={`tw-cursor-pointer tw-py-3 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100 ${TDH_FOCUS}`}
      >
        {t(locale, "network.tdh.profile.holdings", {
          collection: collectionName,
          count: formatInteger(locale, tokens.length),
          tdh: formatInteger(locale, total),
        })}
      </summary>
      {!tokens.length ? (
        <p className={`${TDH_TEXT} tw-pb-4`}>
          {t(locale, "network.tdh.profile.noHoldings")}
        </p>
      ) : (
        <>
          <div
            role="region"
            aria-label={t(locale, "network.tdh.profile.table", {
              collection: collectionName,
            })}
            tabIndex={0}
            className={`tw-overflow-x-auto ${TDH_FOCUS}`}
          >
            <table className="tw-w-full tw-border-collapse tw-text-sm tw-tabular-nums">
              <caption className="tw-sr-only">
                {t(locale, "network.tdh.profile.table", {
                  collection: collectionName,
                })}
              </caption>
              <thead>
                <tr>
                  {COLUMNS.map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className={`${CELL} tw-font-medium tw-text-iron-400`}
                    >
                      {t(locale, `network.tdh.profile.${key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((token) => (
                  <tr
                    key={token.id}
                    className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-font-mono tw-text-iron-200"
                  >
                    <th scope="row" className={`${CELL} tw-font-medium`}>
                      {t(locale, "network.tdh.profile.tokenId", {
                        id: token.id,
                      })}
                    </th>
                    <td className={CELL}>
                      {formatInteger(locale, token.balance)}
                    </td>
                    <td className={CELL}>
                      {formatInteger(locale, token.tdh__raw)}
                    </td>
                    <td className={CELL}>
                      {formatNumber(locale, token.hodl_rate, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className={CELL}>{formatInteger(locale, token.tdh)}</td>
                    <td className={`${CELL} tw-font-semibold tw-text-iron-50`}>
                      {formatInteger(locale, Math.round(token.tdh * boost))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tokens.length > PAGE_SIZE && (
            <div className="tw-my-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
              <p
                className="tw-m-0 tw-text-xs tw-text-iron-400"
                aria-live="polite"
              >
                {t(locale, "network.tdh.profile.pagination", {
                  start: formatInteger(locale, start + 1),
                  end: formatInteger(
                    locale,
                    Math.min(start + PAGE_SIZE, tokens.length)
                  ),
                  total: formatInteger(locale, tokens.length),
                })}
              </p>
              <div className="tw-flex tw-gap-2">
                <Button
                  variant="tertiary"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() =>
                    setPage((previous) =>
                      Math.max(0, Math.min(previous, lastPage) - 1)
                    )
                  }
                >
                  {t(locale, "network.tdh.profile.previous")}
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  disabled={start + PAGE_SIZE >= tokens.length}
                  onClick={() =>
                    setPage((previous) => Math.min(previous + 1, lastPage))
                  }
                >
                  {t(locale, "network.tdh.profile.next")}
                </Button>
              </div>
            </div>
          )}
          <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "network.tdh.profile.tableNote")}
          </p>
          <details className="tw-my-4">
            <summary
              className={`tw-cursor-pointer tw-py-2 tw-text-xs tw-text-iron-200 ${TDH_FOCUS}`}
            >
              {t(locale, "network.tdh.profile.ages")}
            </summary>
            <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "network.tdh.profile.agesNote")}
            </p>
            <ul className="tw-mb-0 tw-mt-3 tw-space-y-2 tw-pl-5 tw-text-xs tw-leading-5 tw-text-iron-300">
              {visible.map((token) => (
                <li key={token.id}>
                  {t(locale, "network.tdh.profile.agesRow", {
                    token: t(locale, "network.tdh.profile.tokenId", {
                      id: token.id,
                    }),
                    days: formatList(
                      locale,
                      token.days_held_per_edition.map((days) =>
                        formatInteger(locale, days)
                      )
                    ),
                  })}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </details>
  );
}
