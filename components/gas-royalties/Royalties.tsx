"use client";

import { useTitle } from "@/contexts/TitleContext";
import type { Royalty } from "@/entities/IRoyalty";
import { capitalizeEveryWord, displayDecimal } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { GasRoyaltiesCollectionFocus } from "@/types/enums";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import {
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "./GasRoyalties";
import styles from "./GasRoyalties.module.scss";

const MEMES_SOLD_MANUALLY = [1, 2, 3, 4];

export default function RoyaltiesComponent() {
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

  function getTippyArtistsContent() {
    let content;
    if (isPrimary) {
      content = `Primary mint revenues`;
    } else {
      content = `Secondary royalties`;
    }
    if (collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB) {
      content += ` in Meme Lab are split between the artist and the collection solely at the artist's discretion.`;
    } else {
      content += ` in The Memes are split 50:50 between the artist and the collection.`;
    }
    return (
      <span className="tw-flex tw-flex-col tw-gap-1">
        <span>{content}</span>
        <span>
          6529 and 6529er have custom arrangements not reflected here for
          simplicity.
        </span>
      </span>
    );
  }

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
      <div className="tw-pt-4">
        <div className={`tw-pt-4 ${styles["scrollContainer"]}`}>
          {royalties.length > 0 && (
            <table className={styles["royaltiesTable"]}>
              <thead>
                <tr>
                  <th>
                    {collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
                      ? "Meme Lab Card"
                      : "Meme Card"}{" "}
                    (x{royalties.length})
                  </th>
                  <th>Artist</th>
                  <th className="tw-text-center">Volume</th>
                  <th className="tw-text-center">
                    <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                      {isPrimary ? "Primary Proceeds" : "Royalties"}
                      {isPrimary && (
                        <>
                          <FontAwesomeIcon
                            className={styles["infoIcon"]}
                            icon={faInfoCircle}
                            data-tooltip-id="primary-proceeds-tooltip"
                          ></FontAwesomeIcon>
                          <Tooltip
                            id="primary-proceeds-tooltip"
                            style={{
                              backgroundColor: "#1F2937",
                              color: "white",
                              padding: "4px 8px",
                            }}
                          >
                            Total Minter payments less the Manifold fee
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </th>
                  {!isPrimary && (
                    <th className="tw-text-center">Effective Royalty %</th>
                  )}
                  <th className="tw-text-center">
                    <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                      Artist Split{" "}
                      <>
                        <FontAwesomeIcon
                          className={styles["infoIcon"]}
                          icon={faInfoCircle}
                          data-tooltip-id="artist-split-tooltip"
                        ></FontAwesomeIcon>
                        <Tooltip
                          id="artist-split-tooltip"
                          style={{
                            backgroundColor: "#1F2937",
                            color: "white",
                            padding: "4px 8px",
                          }}
                        >
                          {getTippyArtistsContent()}
                        </Tooltip>
                      </>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {royalties.map((r) => (
                  <tr key={`token-${r.token_id}`}>
                    <td>
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
                            ? "Figures not easily calculable as card was sold manually"
                            : undefined
                        }
                      />
                    </td>
                    <td>{r.artist}</td>
                    <td className="tw-text-center">
                      {displayDecimal(r.volume)}
                    </td>
                    <td className="tw-text-center">
                      {displayDecimal(r.proceeds)}
                    </td>
                    {!isPrimary && (
                      <td className="tw-text-center">
                        {r.proceeds > 0
                          ? `${((r.proceeds / r.volume) * 100).toFixed(2)}%`
                          : `-`}
                      </td>
                    )}
                    <td>
                      <div className="tw-flex tw-justify-center">
                        <span className="tw-flex tw-items-center tw-gap-1">
                          {displayDecimal(r.artist_take)}
                          {collectionFocus ===
                            GasRoyaltiesCollectionFocus.MEMELAB &&
                            r.artist_split > 0 && (
                              <span className="font-smaller font-color-h">
                                ({displayDecimal(r.artist_split * 100)}
                                %)
                              </span>
                            )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr key={`royalties-total`}>
                  <td colSpan={2} className="tw-text-right">
                    <b>TOTAL</b>
                  </td>
                  <td className="tw-text-center">
                    {displayDecimal(sumVolume)}
                  </td>
                  <td className="tw-text-center">
                    {displayDecimal(sumProceeds)}
                  </td>
                  {!isPrimary && (
                    <td className="tw-text-center">
                      {sumProceeds > 0
                        ? `${((sumProceeds / sumVolume) * 100).toFixed(2)}%`
                        : `-`}
                    </td>
                  )}
                  <td className="tw-text-center">
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
          <h5>No royalties found for selected dates</h5>
        )}
        {!fetching && royalties.length > 0 && (
          <div className="font-color-h tw-pb-3 tw-pt-3">
            All values are in ETH
          </div>
        )}
      </div>
    </>
  );
}
