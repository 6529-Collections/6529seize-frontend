import type { ConsolidatedTDH, TDH, TDHBoostBreakdown } from "@/entities/ITDH";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatNumber, roundTo } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import Link from "next/link";
import { Tooltip } from "react-tooltip";

const BOOST_VERSION = "1.4";
const BOOST_VALUE_FORMAT_OPTIONS = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} satisfies Intl.NumberFormatOptions;

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
  if (!tdh?.boost_breakdown || !tdh.boost) {
    return <></>;
  }

  function getMemeRow(name: string, breakdown: TDHBoostBreakdown | undefined) {
    return (
      <tr key={getRandomObjectId()}>
        <th
          scope="row"
          className="tw-group tw-whitespace-nowrap tw-px-8 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-10 sm:tw-text-md lg:tw-pr-4"
        >
          {name}
        </th>
        <td className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4">
          {hasBoostValue(breakdown?.available) ? (
            <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
              {formatBoostValue(locale, breakdown.available)}
              <BoostBreakdownInfo
                info={breakdown.available_info}
                locale={locale}
              />
            </span>
          ) : (
            "-"
          )}
        </td>
        <td className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4">
          {hasBoostValue(breakdown?.acquired) ? (
            <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
              {formatBoostValue(locale, breakdown.acquired)}
              <BoostBreakdownInfo
                info={breakdown.acquired_info}
                locale={locale}
              />
            </span>
          ) : (
            "-"
          )}
        </td>
      </tr>
    );
  }

  function getMemesRows() {
    const headerRow = (
      <tr key={getRandomObjectId()}>
        <th
          scope="rowgroup"
          colSpan={3}
          className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-px-4 tw-pt-3 tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4"
        >
          {boostMessage(
            locale,
            "user.collected.stats.boostBreakdown.groups.memes"
          )}
        </th>
      </tr>
    );

    const bb = tdh?.boost_breakdown;
    if (!bb) return [headerRow];

    const baseRows = [
      headerRow,
      getMemeRow(
        boostMessage(
          locale,
          "user.collected.stats.boostBreakdown.rows.fullCollectionSet"
        ),
        bb.memes_card_sets
      ),
    ];

    if (bb.memes_card_sets?.acquired !== 0) {
      return baseRows;
    }

    const seasonKeys = Object.keys(bb)
      .filter((key): key is `memes_szn${number}` => /^memes_szn\d+$/.test(key))
      .sort((a, b) => {
        const numA = Number.parseInt(a.replace("memes_szn", ""), 10);
        const numB = Number.parseInt(b.replace("memes_szn", ""), 10);
        return numA - numB;
      });

    const extraRows = seasonKeys.flatMap((key) => {
      const sznNum = key.replace("memes_szn", "");
      const rows = [
        getMemeRow(
          boostMessage(
            locale,
            "user.collected.stats.boostBreakdown.seasonLabel",
            {
              seasonNumber: sznNum,
            }
          ),
          bb[key]
        ),
      ];
      if (key === "memes_szn1" && !bb[key]?.acquired) {
        rows.push(
          getMemeRow(
            boostMessage(
              locale,
              "user.collected.stats.boostBreakdown.rows.genesisSet"
            ),
            bb.memes_genesis
          ),
          getMemeRow(
            boostMessage(
              locale,
              "user.collected.stats.boostBreakdown.rows.nakamoto"
            ),
            bb.memes_nakamoto
          )
        );
      }
      return rows;
    });

    return [...baseRows, ...extraRows];
  }

  function getBaseBoostRow(name: string, breakdown?: TDHBoostBreakdown) {
    if (breakdown) {
      return (
        <tr key={getRandomObjectId()}>
          <th
            scope="row"
            className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4"
          >
            {name}
          </th>
          <td className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4">
            {hasBoostValue(breakdown.available) ? (
              <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                {formatBoostValue(locale, breakdown.available)}
                <BoostBreakdownInfo
                  info={breakdown.available_info}
                  locale={locale}
                />
              </span>
            ) : (
              "-"
            )}
          </td>
          <td className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4">
            {hasBoostValue(breakdown.acquired) ? (
              <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                {formatBoostValue(locale, breakdown.acquired)}
                <BoostBreakdownInfo
                  info={breakdown.acquired_info}
                  locale={locale}
                />
              </span>
            ) : (
              "-"
            )}
          </td>
        </tr>
      );
    }

    return <></>;
  }

  return (
    <div className="tw-mt-6 lg:tw-mt-8">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {boostMessage(locale, "user.collected.stats.boostBreakdown.title")}
        </h3>
        <span>
          <Link
            href="/network/tdh#tdh-1-4"
            className="decoration-hover-underline tw-text-sm"
          >
            {boostMessage(
              locale,
              "user.collected.stats.boostBreakdown.versionLink",
              {
                version: BOOST_VERSION,
              }
            )}
          </Link>
        </span>
      </div>
      <div className="tw-mt-2 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 lg:tw-mt-4">
        <div className="tw-flow-root">
          <div className="tw-inline-block tw-min-w-full tw-align-middle">
            <table className="tw-min-w-full">
              <caption className="tw-sr-only">
                {boostMessage(
                  locale,
                  "user.collected.stats.boostBreakdown.tableCaption"
                )}
              </caption>
              <thead className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-iron-700 tw-bg-iron-900">
                <tr key={getRandomObjectId()}>
                  <th
                    scope="col"
                    className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pr-4"
                  >
                    {boostMessage(
                      locale,
                      "user.collected.stats.boostBreakdown.columns.type"
                    )}
                  </th>
                  <th
                    scope="col"
                    className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pr-4"
                  >
                    {boostMessage(
                      locale,
                      "user.collected.stats.boostBreakdown.columns.potential"
                    )}
                  </th>
                  <th
                    scope="col"
                    className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pr-4"
                  >
                    {boostMessage(
                      locale,
                      "user.collected.stats.boostBreakdown.columns.actual"
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tdh?.boost_breakdown && (
                  <>
                    {getMemesRows()}
                    {getBaseBoostRow(
                      boostMessage(
                        locale,
                        "user.collected.stats.boostBreakdown.rows.gradients"
                      ),
                      tdh?.boost_breakdown.gradients
                    )}
                    <tr key={getRandomObjectId()}>
                      <th
                        scope="row"
                        className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold sm:tw-px-6 sm:tw-text-md lg:tw-pr-4"
                      >
                        {boostMessage(
                          locale,
                          "user.collected.stats.boostBreakdown.rows.total"
                        )}
                      </th>
                      <td className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4">
                        {tdh?.boost ? (
                          <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                            {formatBoostValue(
                              locale,
                              (tdh.boost_breakdown.memes_card_sets?.available ??
                                0) +
                                (tdh.boost_breakdown.gradients?.available ?? 0)
                            )}
                            <BoostBreakdownInfo
                              info={[
                                boostMessage(
                                  locale,
                                  "user.collected.stats.boostBreakdown.info.totalPotential"
                                ),
                              ]}
                              locale={locale}
                            />
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="tw-text-white-400 tw-group tw-whitespace-nowrap tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-md lg:tw-pr-4">
                        {tdh?.boost ? (
                          <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                            {formatBoostValue(
                              locale,
                              roundTo(tdh.boost - 1, 2)
                            )}
                            <BoostBreakdownInfo
                              info={[
                                boostMessage(
                                  locale,
                                  "user.collected.stats.boostBreakdown.info.totalActual"
                                ),
                              ]}
                              locale={locale}
                            />
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoostBreakdownInfo({
  info,
  locale,
}: {
  readonly info: string[];
  readonly locale: SupportedLocale;
}) {
  if (!info || info.length === 0) {
    return <></>;
  }

  const tooltipId = `boost-info-${getRandomObjectId()}`;

  return (
    <>
      <button
        type="button"
        className="tw-inline-flex tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        aria-label={boostMessage(
          locale,
          "user.collected.stats.boostBreakdown.info.ariaLabel"
        )}
        data-tooltip-id={tooltipId}
      >
        <FontAwesomeIcon
          icon={faInfoCircle}
          height={16}
          color="lightgrey"
          aria-hidden="true"
        />
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
          zIndex: 10,
        }}
      >
        {info.length > 1 ? (
          <ul
            className="tw-mb-0"
            style={{ paddingLeft: "1rem", textAlign: "left" }}
          >
            {info.map((i) => (
              <li key={getRandomObjectId()} className="tw-text-left">
                {i}
              </li>
            ))}
          </ul>
        ) : (
          info[0]
        )}
      </Tooltip>
    </>
  );
}
