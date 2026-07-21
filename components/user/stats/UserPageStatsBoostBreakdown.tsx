import type { ConsolidatedTDH, TDH, TDHBoostBreakdown } from "@/entities/ITDH";
import { formatNumber, roundTo } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useId } from "react";
import { Tooltip } from "react-tooltip";
import {
  STATS_SECTION_HEADING_CLASS,
  STATS_TABLE_CLASS,
  STATS_TABLE_HEADER_CELL_CLASS,
  STATS_TABLE_HEAD_CLASS,
  STATS_TABLE_ROW_CLASS,
  STATS_TABLE_VALUE_CELL_CLASS,
  UserPageStatsTableScroll,
} from "./UserPageStatsTableShared";

const BOOST_VERSION = "1.4";
const BOOST_VALUE_FORMAT_OPTIONS = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} satisfies Intl.NumberFormatOptions;

const BOOST_ROW_HEADER_CLASS =
  "tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-left tw-font-medium tw-text-iron-400";
const BOOST_VALUE_CELL_CLASS = `${STATS_TABLE_VALUE_CELL_CLASS} tw-min-w-36`;

type BoostMessageKey = Extract<
  MessageKey,
  `user.collected.stats.boostBreakdown.${string}`
>;

function boostMessage(
  locale: SupportedLocale,
  key: BoostMessageKey,
  params: Record<string, string | number> = {}
): string {
  return t(locale, key, params);
}

function formatBoostValue(
  locale: SupportedLocale,
  value: number | undefined | null
): string {
  if (value == null) {
    return "-";
  }

  return formatNumber(locale, value, BOOST_VALUE_FORMAT_OPTIONS);
}

function hasBoostValue(value: number | undefined | null): value is number {
  return value != null;
}

export default function UserPageStatsBoostBreakdown({
  tdh,
  locale = DEFAULT_LOCALE,
}: {
  readonly tdh: ConsolidatedTDH | TDH | undefined;
  readonly locale?: SupportedLocale | undefined;
}) {
  if (!tdh?.boost_breakdown || tdh.boost == null) {
    return null;
  }

  const boostBreakdown = tdh.boost_breakdown;
  const boost = tdh.boost;
  const caption = boostMessage(
    locale,
    "user.collected.stats.boostBreakdown.tableCaption"
  );

  function getMemeRow(name: string, breakdown: TDHBoostBreakdown | undefined) {
    return (
      <tr key={name} className={STATS_TABLE_ROW_CLASS}>
        <th scope="row" className={`${BOOST_ROW_HEADER_CLASS} tw-pl-8`}>
          {name}
        </th>
        <BoostValueCell
          value={breakdown?.available}
          info={breakdown?.available_info}
          locale={locale}
        />
        <BoostValueCell
          value={breakdown?.acquired}
          info={breakdown?.acquired_info}
          locale={locale}
        />
      </tr>
    );
  }

  function getMemesRows() {
    const headerRow = (
      <tr key="memes" className="tw-bg-white/[0.02]">
        <th
          scope="rowgroup"
          colSpan={3}
          className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300"
        >
          {boostMessage(
            locale,
            "user.collected.stats.boostBreakdown.groups.memes"
          )}
        </th>
      </tr>
    );

    const baseRows = [
      headerRow,
      getMemeRow(
        boostMessage(
          locale,
          "user.collected.stats.boostBreakdown.rows.fullCollectionSet"
        ),
        boostBreakdown.memes_card_sets
      ),
    ];

    if (boostBreakdown.memes_card_sets?.acquired !== 0) {
      return baseRows;
    }

    const seasonKeys = Object.keys(boostBreakdown)
      .filter((key): key is `memes_szn${number}` => /^memes_szn\d+$/.test(key))
      .sort((a, b) => {
        const numA = Number.parseInt(a.replace("memes_szn", ""), 10);
        const numB = Number.parseInt(b.replace("memes_szn", ""), 10);
        return numA - numB;
      });

    const extraRows = seasonKeys.flatMap((key) => {
      const seasonNumber = key.replace("memes_szn", "");
      const rows = [
        getMemeRow(
          boostMessage(
            locale,
            "user.collected.stats.boostBreakdown.seasonLabel",
            { seasonNumber }
          ),
          boostBreakdown[key]
        ),
      ];
      if (key === "memes_szn1" && !boostBreakdown[key]?.acquired) {
        rows.push(
          getMemeRow(
            boostMessage(
              locale,
              "user.collected.stats.boostBreakdown.rows.genesisSet"
            ),
            boostBreakdown.memes_genesis
          ),
          getMemeRow(
            boostMessage(
              locale,
              "user.collected.stats.boostBreakdown.rows.nakamoto"
            ),
            boostBreakdown.memes_nakamoto
          )
        );
      }
      return rows;
    });

    return [...baseRows, ...extraRows];
  }

  function getBaseBoostRow(name: string, breakdown?: TDHBoostBreakdown) {
    if (!breakdown) {
      return null;
    }

    return (
      <tr key={name} className={STATS_TABLE_ROW_CLASS}>
        <th scope="row" className={BOOST_ROW_HEADER_CLASS}>
          {name}
        </th>
        <BoostValueCell
          value={breakdown.available}
          info={breakdown.available_info}
          locale={locale}
        />
        <BoostValueCell
          value={breakdown.acquired}
          info={breakdown.acquired_info}
          locale={locale}
        />
      </tr>
    );
  }

  return (
    <section aria-labelledby="boost-breakdown-heading" className="tw-space-y-3">
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
        <h3
          className={STATS_SECTION_HEADING_CLASS}
          id="boost-breakdown-heading"
        >
          {boostMessage(locale, "user.collected.stats.boostBreakdown.title")}
        </h3>
        <Link
          href="/network/tdh#tdh-1-4"
          className="tw-text-xs tw-font-medium tw-text-iron-500 tw-no-underline hover:tw-text-iron-300 hover:tw-underline"
        >
          {boostMessage(
            locale,
            "user.collected.stats.boostBreakdown.versionLink",
            { version: BOOST_VERSION }
          )}
        </Link>
      </div>
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.02]">
        <UserPageStatsTableScroll label={caption}>
          <table className={`${STATS_TABLE_CLASS} tw-min-w-[34rem]`}>
            <caption className="tw-sr-only">{caption}</caption>
            <thead className={STATS_TABLE_HEAD_CLASS}>
              <tr>
                <th
                  scope="col"
                  className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-text-left`}
                >
                  {boostMessage(
                    locale,
                    "user.collected.stats.boostBreakdown.columns.type"
                  )}
                </th>
                <th
                  scope="col"
                  className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-text-right`}
                >
                  {boostMessage(
                    locale,
                    "user.collected.stats.boostBreakdown.columns.potential"
                  )}
                </th>
                <th
                  scope="col"
                  className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-text-right`}
                >
                  {boostMessage(
                    locale,
                    "user.collected.stats.boostBreakdown.columns.actual"
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {getMemesRows()}
              {getBaseBoostRow(
                boostMessage(
                  locale,
                  "user.collected.stats.boostBreakdown.rows.gradients"
                ),
                boostBreakdown.gradients
              )}
              <tr className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.1] tw-bg-white/[0.02]">
                <th
                  scope="row"
                  className={`${BOOST_ROW_HEADER_CLASS} tw-font-semibold tw-text-iron-100`}
                >
                  {boostMessage(
                    locale,
                    "user.collected.stats.boostBreakdown.rows.total"
                  )}
                </th>
                <BoostValueCell
                  value={
                    (boostBreakdown.memes_card_sets?.available ?? 0) +
                    (boostBreakdown.gradients?.available ?? 0)
                  }
                  info={[
                    boostMessage(
                      locale,
                      "user.collected.stats.boostBreakdown.info.totalPotential"
                    ),
                  ]}
                  locale={locale}
                  emphasized
                />
                <BoostValueCell
                  value={roundTo(boost - 1, 2)}
                  info={[
                    boostMessage(
                      locale,
                      "user.collected.stats.boostBreakdown.info.totalActual"
                    ),
                  ]}
                  locale={locale}
                  emphasized
                />
              </tr>
            </tbody>
          </table>
        </UserPageStatsTableScroll>
      </div>
    </section>
  );
}

function BoostValueCell({
  value,
  info,
  locale,
  emphasized = false,
}: {
  readonly value: number | undefined | null;
  readonly info: string[] | undefined;
  readonly locale: SupportedLocale;
  readonly emphasized?: boolean;
}) {
  return (
    <td
      className={`${BOOST_VALUE_CELL_CLASS}${
        emphasized ? "tw-font-semibold" : ""
      }`}
    >
      {hasBoostValue(value) ? (
        <span className="tw-flex tw-items-center tw-justify-end tw-gap-2">
          {formatBoostValue(locale, value)}
          <BoostBreakdownInfo info={info ?? []} locale={locale} />
        </span>
      ) : (
        "-"
      )}
    </td>
  );
}

function BoostBreakdownInfo({
  info,
  locale,
}: {
  readonly info: string[];
  readonly locale: SupportedLocale;
}) {
  const tooltipId = `boost-info-${useId().replaceAll(":", "")}`;

  if (info.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="tw-inline-flex tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        aria-label={boostMessage(
          locale,
          "user.collected.stats.boostBreakdown.info.ariaLabel"
        )}
        data-tooltip-id={tooltipId}
      >
        <FontAwesomeIcon icon={faInfoCircle} height={16} aria-hidden="true" />
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        className="!tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-iron-50"
      >
        {info.length > 1 ? (
          <ul className="tw-mb-0 tw-pl-4 tw-text-left">
            {info.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          info[0]
        )}
      </Tooltip>
    </>
  );
}
