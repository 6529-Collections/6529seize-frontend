"use client";

import { useTitle } from "@/contexts/TitleContext";
import type { Royalty } from "@/entities/IRoyalty";
import { capitalizeEveryWord, displayDecimal } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import { GasRoyaltiesCollectionFocus } from "@/types/enums";
import { InformationCircleIcon as InformationCircleSolidIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import {
  GAS_ROYALTIES_PAGE_CONTAINER_CLASS_NAME,
  GAS_ROYALTIES_TABLE_CELL_CLASS_NAME,
  GAS_ROYALTIES_TABLE_CLASS_NAME,
  GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME,
  GAS_ROYALTIES_TABLE_ROW_CLASS_NAME,
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "./GasRoyalties";

const MEMES_SOLD_MANUALLY = [1, 2, 3, 4];

const HEADER_TOOLTIP_STYLES = {
  ...TOOLTIP_STYLES,
  lineHeight: 1.5,
  maxWidth: "min(24rem, calc(100vw - 2rem))",
  textAlign: "left" as const,
  whiteSpace: "normal" as const,
};

function TableHeaderInfoTooltip({
  children,
  description,
  label,
  tooltipId,
}: Readonly<{
  children: ReactNode;
  description: string;
  label: string;
  tooltipId: string;
}>) {
  const descriptionId = `${tooltipId}-description`;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-describedby={descriptionId}
        data-tooltip-id={tooltipId}
        className="tw-inline-flex tw-size-6 tw-shrink-0 tw-cursor-help tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-1 tw-text-iron-400 tw-transition-colors hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-1 focus-visible:tw-ring-offset-[#0D0D0F]"
      >
        <InformationCircleSolidIcon aria-hidden="true" className="tw-size-4" />
      </button>
      <span className="tw-sr-only" id={descriptionId}>
        {description}
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        opacity={1}
        style={HEADER_TOOLTIP_STYLES}
      >
        <span aria-hidden="true">{children}</span>
      </Tooltip>
    </>
  );
}

export default function RoyaltiesComponent() {
  const locale = useBrowserLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setTitle } = useTitle();

  useEffect(() => {
    const routerFocus = searchParams?.get("focus") as string;
    const resolvedFocus = Object.values(GasRoyaltiesCollectionFocus).find(
      (sd) => sd === routerFocus
    );
    if (resolvedFocus) {
      setCollectionFocus(resolvedFocus);
      const title = `Meme Accounting - ${capitalizeEveryWord(
        resolvedFocus.replace("-", " ")
      )}`;
      setTitle(title);
    } else {
      router.push(`${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`);
    }
  }, [searchParams]);

  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [sumVolume, setSumVolume] = useState(0);
  const [sumProceeds, setSumProceeds] = useState(0);
  const [sumArtistTake, setSumArtistTake] = useState(0);

  const {
    dateSelection,
    setDateSelection,
    fromDate,
    toDate,
    isPrimary,
    setIsPrimary,
    isCustomBlocks,
    setIsCustomBlocks,
    selectedArtist,
    collectionFocus,
    setCollectionFocus,
    fetching,
    setFetching,
    getUrl,
    getSharedProps,
    fromBlock,
    toBlock,
  } = useSharedState();

  function getUrlWithParams() {
    return getUrl("royalties");
  }

  function fetchRoyalties() {
    setFetching(true);
    fetchUrl<Royalty[]>(getUrlWithParams()).then((res: Royalty[]) => {
      res.forEach((r) => {
        r.volume = Math.round(r.volume * 100000) / 100000;
        r.proceeds = Math.round(r.proceeds * 100000) / 100000;
        r.artist_split = Math.round(r.artist_split * 100000) / 100000;
        r.artist_take = Math.round(r.artist_take * 100000) / 100000;
      });
      setRoyalties(res);
      setSumVolume(res.reduce((prev, current) => prev + current.volume, 0));
      setSumProceeds(res.reduce((prev, current) => prev + current.proceeds, 0));
      setSumArtistTake(
        res.reduce((prev, current) => prev + current.artist_take, 0)
      );
      setFetching(false);
    });
  }

  useEffect(() => {
    if (collectionFocus) {
      fetchRoyalties();
    }
  }, [
    dateSelection,
    fromDate,
    toDate,
    fromBlock,
    toBlock,
    selectedArtist,
    isPrimary,
    isCustomBlocks,
  ]);

  useEffect(() => {
    if (collectionFocus) {
      setRoyalties([]);
      fetchRoyalties();
    }
  }, [collectionFocus]);

  if (!collectionFocus) {
    return <></>;
  }

  function getArtistSplitSummary() {
    if (isPrimary) {
      return t(
        locale,
        collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
          ? "memeData.tooltip.artistSplit.primaryMemeLab"
          : "memeData.tooltip.artistSplit.primaryMemes"
      );
    }

    return t(
      locale,
      collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
        ? "memeData.tooltip.artistSplit.secondaryMemeLab"
        : "memeData.tooltip.artistSplit.secondaryMemes"
    );
  }

  function getArtistSplitTooltipContent() {
    const summary = getArtistSplitSummary();
    const customArrangements = t(
      locale,
      "memeData.tooltip.artistSplit.customArrangements"
    );

    return (
      <span className="tw-flex tw-flex-col tw-gap-1">
        <span>{summary}</span>
        <span>{customArrangements}</span>
      </span>
    );
  }

  const artistSplitDescription = `${getArtistSplitSummary()} ${t(
    locale,
    "memeData.tooltip.artistSplit.customArrangements"
  )}`;

  return (
    <>
      <GasRoyaltiesHeader
        title="Accounting"
        results_count={royalties.length}
        focus={collectionFocus}
        setDateSelection={(date_selection) => {
          setIsPrimary(false);
          setIsCustomBlocks(false);
          setDateSelection(date_selection);
        }}
        getUrl={getUrlWithParams}
        {...getSharedProps()}
      />
      <section
        className={`${GAS_ROYALTIES_PAGE_CONTAINER_CLASS_NAME} tw-mt-2 tw-flow-root lg:tw-mt-3`}
      >
        <div className="tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-600">
          {royalties.length > 0 && (
            <table className={GAS_ROYALTIES_TABLE_CLASS_NAME}>
              <thead>
                <tr>
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-left`}
                    scope="col"
                  >
                    {t(
                      locale,
                      collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
                        ? "memeData.columns.memeLabCardCount"
                        : "memeData.columns.memeCardCount",
                      { count: royalties.length }
                    )}
                  </th>
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-left`}
                    scope="col"
                  >
                    {t(locale, "memeData.columns.artist")}
                  </th>
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-right`}
                    scope="col"
                  >
                    {t(locale, "memeData.columns.volume")}
                  </th>
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-right`}
                    scope="col"
                  >
                    <div className="tw-flex tw-items-center tw-justify-end tw-gap-0">
                      {t(
                        locale,
                        isPrimary
                          ? "memeData.columns.primaryProceeds"
                          : "memeData.columns.royalties"
                      )}
                      {isPrimary && (
                        <TableHeaderInfoTooltip
                          tooltipId="primary-proceeds-tooltip"
                          label={t(
                            locale,
                            "memeData.tooltip.primaryProceeds.label"
                          )}
                          description={t(
                            locale,
                            "memeData.tooltip.primaryProceeds.description"
                          )}
                        >
                          {t(
                            locale,
                            "memeData.tooltip.primaryProceeds.description"
                          )}
                        </TableHeaderInfoTooltip>
                      )}
                    </div>
                  </th>
                  {!isPrimary && (
                    <th
                      className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-right`}
                      scope="col"
                    >
                      {t(locale, "memeData.columns.effectiveRoyalty")}
                    </th>
                  )}
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-right`}
                    scope="col"
                  >
                    <div className="tw-flex tw-items-center tw-justify-end tw-gap-0">
                      {t(locale, "memeData.columns.artistSplit")}
                      <TableHeaderInfoTooltip
                        tooltipId="artist-split-tooltip"
                        label={t(
                          locale,
                          "memeData.tooltip.artistSplit.label"
                        )}
                        description={artistSplitDescription}
                      >
                        {getArtistSplitTooltipContent()}
                      </TableHeaderInfoTooltip>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {royalties.map((r) => (
                  <tr
                    className={GAS_ROYALTIES_TABLE_ROW_CLASS_NAME}
                    key={`token-${r.token_id}`}
                  >
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-left`}
                    >
                      <GasRoyaltiesTokenImage
                        path={
                          collectionFocus ===
                          GasRoyaltiesCollectionFocus.MEMELAB
                            ? "meme-lab"
                            : "the-memes"
                        }
                        token_id={r.token_id}
                        name={r.name}
                        thumbnail={r.thumbnail}
                        note={
                          collectionFocus ===
                            GasRoyaltiesCollectionFocus.MEMES &&
                          isPrimary &&
                          MEMES_SOLD_MANUALLY.includes(r.token_id)
                            ? t(locale, "memeData.token.manualSaleNote")
                            : undefined
                        }
                      />
                    </td>
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-left tw-text-iron-50`}
                    >
                      {r.artist}
                    </td>
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums`}
                    >
                      {displayDecimal(r.volume)}
                    </td>
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums`}
                    >
                      {displayDecimal(r.proceeds)}
                    </td>
                    {!isPrimary && (
                      <td
                        className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums`}
                      >
                        {r.proceeds > 0
                          ? `${((r.proceeds / r.volume) * 100).toFixed(2)}%`
                          : `-`}
                      </td>
                    )}
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums`}
                    >
                      <div className="tw-flex tw-justify-end">
                        <span className="tw-flex tw-items-center tw-gap-1">
                          {displayDecimal(r.artist_take)}
                          {collectionFocus ===
                            GasRoyaltiesCollectionFocus.MEMELAB &&
                            r.artist_split > 0 && (
                              <span className="tw-text-sm tw-text-iron-400">
                                ({displayDecimal(r.artist_split * 100)}
                                %)
                              </span>
                            )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr
                  className={GAS_ROYALTIES_TABLE_ROW_CLASS_NAME}
                  key="royalties-total"
                >
                  <td
                    colSpan={2}
                    className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-font-semibold tw-text-iron-300`}
                  >
                    <b>{t(locale, "memeData.total")}</b>
                  </td>
                  <td
                    className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-font-semibold tw-tabular-nums`}
                  >
                    {displayDecimal(sumVolume)}
                  </td>
                  <td
                    className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-font-semibold tw-tabular-nums`}
                  >
                    {displayDecimal(sumProceeds)}
                  </td>
                  {!isPrimary && (
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-font-semibold tw-tabular-nums`}
                    >
                      {sumProceeds > 0
                        ? `${((sumProceeds / sumVolume) * 100).toFixed(2)}%`
                        : `-`}
                    </td>
                  )}
                  <td
                    className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-font-semibold tw-tabular-nums`}
                  >
                    {displayDecimal(sumArtistTake)}
                    {collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB &&
                      sumArtistTake > 0 &&
                      ` (${displayDecimal(
                        (sumArtistTake * 100) / sumProceeds
                      )}%)`}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {!fetching && royalties.length === 0 && (
          <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-px-4 tw-py-8 tw-text-center">
            <p
              className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400"
              role="status"
            >
              {t(locale, "memeData.royalties.empty")}
            </p>
          </div>
        )}
        {!fetching && royalties.length > 0 && (
          <div className="tw-pb-3 tw-pt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "memeData.ethFootnote")}
          </div>
        )}
      </section>
    </>
  );
}
