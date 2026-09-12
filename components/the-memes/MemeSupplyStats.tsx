import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function MemeSupplyStats({
  nftMeta,
  locale,
}: {
  readonly nftMeta: ApiMemesExtendedData;
  readonly locale: SupportedLocale;
}) {
  const reserveSupplyRows = [
    {
      label: t(locale, "theMemes.detail.live.edition.exResearch"),
      value: nftMeta.edition_size_ex_research,
      rank: nftMeta.edition_size_ex_research_rank,
    },
    {
      label: t(locale, "theMemes.detail.live.edition.exMuseumAndResearch"),
      value: nftMeta.edition_size_ex_museum_and_research,
      rank: nftMeta.edition_size_ex_museum_and_research_rank,
    },
  ];
  const total = nftMeta.ranked_collection_size ?? nftMeta.collection_size;
  const count = (value: number | null | undefined) =>
    value === null || value === undefined
      ? t(locale, "theMemes.detail.live.edition.notComputed")
      : formatInteger(locale, value);

  return (
    <section className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-6 md:tw-py-8">
      <dl className="tw-m-0 tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-6">
        {[
          {
            label: t(locale, "theMemes.detail.live.edition.editionSize"),
            value: nftMeta.edition_size,
          },
          ...reserveSupplyRows,
          {
            label: t(locale, "theMemes.detail.live.edition.holdingWallets"),
            value: nftMeta.hodlers,
          },
        ].map((row) => (
          <div key={row.label} className="tw-min-w-0">
            <dt className="tw-mb-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 md:tw-mb-2">
              {row.label}
            </dt>
            <dd className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6">
              {count(row.value)}
            </dd>
          </div>
        ))}
      </dl>
      <details className="tw-group tw-mt-4">
        <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
          {t(locale, "theMemes.detail.live.edition.supplyDetails")}
          <ChevronDownIcon
            aria-hidden="true"
            className="tw-h-4 tw-w-4 tw-shrink-0 group-open:tw-rotate-180"
          />
        </summary>
        <div className="tw-space-y-4 tw-pt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          <p className="tw-m-0">
            {t(locale, "theMemes.detail.live.edition.exclusionsHelp")}
          </p>
          <dl className="tw-m-0 tw-space-y-2">
            {[
              {
                label: t(
                  locale,
                  "theMemes.detail.live.edition.researchReserve"
                ),
                value: nftMeta.research_holdings,
              },
              {
                label: t(locale, "theMemes.detail.live.collectors.museum"),
                value: nftMeta.museum_holdings,
              },
              {
                label: t(locale, "theMemes.detail.live.edition.burnt"),
                value: nftMeta.burnt,
              },
              {
                label: t(locale, "theMemes.detail.live.edition.exMuseum"),
                value: nftMeta.edition_size_cleaned,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="tw-flex tw-justify-between tw-gap-4"
              >
                <dt>{row.label}</dt>
                <dd className="tw-m-0 tw-text-iron-100">{count(row.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="tw-m-0">
            {t(locale, "theMemes.detail.live.edition.rankHelp")}
          </p>
          {nftMeta.recorded_in_tdh === false ? (
            <p className="tw-m-0">
              {t(locale, "theMemes.detail.live.rankUnranked")}
            </p>
          ) : (
            <dl className="tw-m-0 tw-space-y-2">
              {reserveSupplyRows.map((row) => (
                <div
                  key={row.label}
                  className="tw-flex tw-justify-between tw-gap-4"
                >
                  <dt>
                    {t(locale, "theMemes.detail.live.edition.rankLabel", {
                      label: row.label,
                    })}
                  </dt>
                  <dd className="tw-m-0 tw-text-right tw-text-iron-100">
                    {row.rank !== undefined &&
                    row.rank !== null &&
                    row.rank > 0 &&
                    total > 0
                      ? t(locale, "theMemes.detail.live.rank", {
                          rank: formatInteger(locale, row.rank),
                          total: formatInteger(locale, total),
                        })
                      : t(locale, "theMemes.detail.live.rankUnranked")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </details>
    </section>
  );
}
