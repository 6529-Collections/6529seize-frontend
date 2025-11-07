"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Royalty } from "@/entities/IRoyalty";
import { fetchUrl } from "@/services/6529api";
import { capitalizeEveryWord, displayDecimal } from "@/helpers/Helpers";
import {
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "./GasRoyalties";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useTitle } from "@/contexts/TitleContext";
import { GasRoyaltiesCollectionFocus } from "@/enums";

const MEMES_SOLD_MANUALLY = [1, 2, 3, 4];

export default function RoyaltiesComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setTitle } = useTitle();

  const {
    setDateSelection,
    isPrimary,
    setIsPrimary,
    setIsCustomBlocks,
    collectionFocus,
    setCollectionFocus,
    fetching,
    setFetching,
    getUrl,
    getSharedProps,
    toBlock,
  } = useSharedState();

  useEffect(() => {
    const routerFocus = searchParams?.get("focus");
    const resolvedFocus = Object.values(GasRoyaltiesCollectionFocus).find(
      (sd) => sd === routerFocus
    );
    if (resolvedFocus) {
      if (resolvedFocus !== collectionFocus) {
        setCollectionFocus(resolvedFocus);
      }
      const title = `Meme Accounting - ${capitalizeEveryWord(
        resolvedFocus.replace("-", " ")
      )}`;
      setTitle(title);
    } else {
      router.push(`${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`);
    }
  }, [
    collectionFocus,
    pathname,
    router,
    searchParams,
    setCollectionFocus,
    setTitle,
  ]);

  const getUrlWithParams = useCallback(() => getUrl("royalties"), [getUrl]);

  const royaltiesUrl = useMemo(
    () => (collectionFocus ? getUrlWithParams() : ""),
    [collectionFocus, getUrlWithParams]
  );

  const { data: royalties = [], isFetching: isRoyaltiesFetching } = useQuery<Royalty[]>({
    queryKey: ["gas-royalties", "royalties", royaltiesUrl],
    placeholderData: [],
    enabled: Boolean(royaltiesUrl),
    queryFn: async () => {
      if (!royaltiesUrl) {
        return [];
      }

      try {
        const res = (await fetchUrl(royaltiesUrl)) as Royalty[];
        return res.map((royalty) => ({
          ...royalty,
          volume: Math.round(royalty.volume * 100000) / 100000,
          proceeds: Math.round(royalty.proceeds * 100000) / 100000,
          artist_split: Math.round(royalty.artist_split * 100000) / 100000,
          artist_take: Math.round(royalty.artist_take * 100000) / 100000,
        }));
      } catch (error) {
        console.error("Failed to fetch royalties", error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (!collectionFocus) {
      setFetching(true);
      return;
    }

    setFetching(isRoyaltiesFetching);
  }, [collectionFocus, isRoyaltiesFetching, setFetching]);

  const { sumVolume, sumProceeds, sumArtistTake } = useMemo(() => {
    if (!royalties.length) {
      return { sumVolume: 0, sumProceeds: 0, sumArtistTake: 0 };
    }

    return {
      sumVolume: royalties.reduce((total, current) => total + current.volume, 0),
      sumProceeds: royalties.reduce(
        (total, current) => total + current.proceeds,
        0
      ),
      sumArtistTake: royalties.reduce(
        (total, current) => total + current.artist_take,
        0
      ),
    };
  }, [royalties]);

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
      <span className="d-flex flex-column gap-1">
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
      <Container className={`no-padding pt-4`}>
        <Row className={`pt-4 ${styles.scrollContainer}`}>
          <Col>
            {royalties.length > 0 && (
              <Table bordered={false} className={styles.royaltiesTable}>
                <thead>
                  <tr>
                    <th>
                      {collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
                        ? "Meme Lab Card"
                        : "Meme Card"}{" "}
                      (x{royalties.length})
                    </th>
                    <th>Artist</th>
                    <th className="text-center">Volume</th>
                    <th className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {isPrimary ? "Primary Proceeds" : "Royalties"}
                        {isPrimary && (
                          <>
                            <FontAwesomeIcon
                              className={styles.infoIcon}
                              icon={faInfoCircle}
                              data-tooltip-id="primary-proceeds-tooltip"></FontAwesomeIcon>
                            <Tooltip
                              id="primary-proceeds-tooltip"
                              style={{
                                backgroundColor: "#1F2937",
                                color: "white",
                                padding: "4px 8px",
                              }}>
                              Total Minter payments less the Manifold fee
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </th>
                    {!isPrimary && (
                      <th className="text-center">Effective Royalty %</th>
                    )}
                    <th className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        Artist Split{" "}
                        <>
                          <FontAwesomeIcon
                            className={styles.infoIcon}
                            icon={faInfoCircle}
                            data-tooltip-id="artist-split-tooltip"></FontAwesomeIcon>
                          <Tooltip
                            id="artist-split-tooltip"
                            style={{
                              backgroundColor: "#1F2937",
                              color: "white",
                              padding: "4px 8px",
                            }}>
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
                      <td className="text-center">
                        {displayDecimal(r.volume, 2)}
                      </td>
                      <td className="text-center">
                        {displayDecimal(r.proceeds, 2)}
                      </td>
                      {!isPrimary && (
                        <td className="text-center">
                          {r.proceeds > 0
                            ? `${((r.proceeds / r.volume) * 100).toFixed(2)}%`
                            : `-`}
                        </td>
                      )}
                      <td>
                        <div className="d-flex justify-content-center">
                          <span className="d-flex align-items-center gap-1">
                            {displayDecimal(r.artist_take, 2)}
                            {collectionFocus ===
                              GasRoyaltiesCollectionFocus.MEMELAB &&
                              r.artist_split > 0 && (
                                <span className="font-smaller font-color-h">
                                  ({displayDecimal(r.artist_split * 100, 2)}
                                  %)
                                </span>
                              )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr key={`royalties-total`}>
                    <td colSpan={2} className="text-right">
                      <b>TOTAL</b>
                    </td>
                    <td className="text-center">
                      {displayDecimal(sumVolume, 2)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(sumProceeds, 2)}
                    </td>
                    {!isPrimary && (
                      <td className="text-center">
                        {sumProceeds > 0
                          ? `${((sumProceeds / sumVolume) * 100).toFixed(2)}%`
                          : `-`}
                      </td>
                    )}
                    <td className="text-center">
                      {displayDecimal(sumArtistTake, 2)}
                      {collectionFocus ===
                        GasRoyaltiesCollectionFocus.MEMELAB &&
                        sumArtistTake > 0 &&
                        ` (${displayDecimal(
                          (sumArtistTake * 100) / sumProceeds,
                          2
                        )}%)`}
                    </td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Col>
        </Row>
        {!fetching && royalties.length === 0 && (
          <Row>
            <Col>
              <h5>No royalties found for selected dates</h5>
            </Col>
          </Row>
        )}
        {!fetching && royalties.length > 0 && (
          <Row className="font-color-h pt-3 pb-3">
            <Col>All values are in ETH</Col>
          </Row>
        )}
      </Container>
    </>
  );
}
