import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Royalty } from "../../entities/IRoyalty";
import { fetchUrl } from "../../services/6529api";
import { displayDecimal } from "../../helpers/Helpers";
import DatePickerModal from "../datePickerModal/DatePickerModal";
import { DateIntervalsWithBlocksSelection } from "../../enums";
import {
  GasRoyaltiesCollectionFocus,
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "./GasRoyalties";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import BlockPickerModal from "../blockPickerModal/BlockPickerModal";

const MEMES_DESCRIPTION =
  "Primary mint revenues and secondary royalties in The Memes are split 50:50 between the artist and the collection. Cards #1 to #4 were sold manually. 6529 and 6529er have custom arrangements not reflected here for simplicity. All values are in ETH.";
const MEMELAB_DESCRIPTION =
  "Primary mint revenues and secondary royalties in Meme Lab are split between artist the and the collection solely at the artist's discretion. 6529 and 6529er have custom arrangements not reflected here for simplicity. All values are in ETH.";

const MEMES_SOLD_MANUALLY = [1, 2, 3, 4];

export default function Royalties() {
  const router = useRouter();

  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [sumVolume, setSumVolume] = useState(0);
  const [sumProceeds, setSumProceeds] = useState(0);
  const [sumArtistTake, setSumArtistTake] = useState(0);

  const {
    dateSelection,
    setDateSelection,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    isPrimary,
    setIsPrimary,
    selectedArtist,
    showDatePicker,
    setShowDatePicker,
    collectionFocus,
    setCollectionFocus,
    fetching,
    setFetching,
    getUrl,
    getSharedProps,
    showBlockPicker,
    setShowBlockPicker,
    fromBlock,
    setFromBlock,
    toBlock,
    setToBlock,
  } = useSharedState();

  useEffect(() => {
    if (router.isReady) {
      const routerFocus = router.query.focus as string;
      const resolvedFocus = Object.values(GasRoyaltiesCollectionFocus).find(
        (sd) => sd === routerFocus
      );
      if (resolvedFocus) {
        setCollectionFocus(resolvedFocus);
      } else {
        setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      }
    }
  }, [router.isReady]);

  function getUrlWithParams() {
    return getUrl("royalties");
  }

  function fetchRoyalties() {
    setFetching(true);
    fetchUrl(getUrlWithParams()).then((res: Royalty[]) => {
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
        title="Meme Accounting"
        results_count={royalties.length}
        focus={collectionFocus}
        setDateSelection={(date_selection) => {
          setIsPrimary(false);
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
                          <Tippy
                            content="Total Minter payments less the Manifold fee"
                            placement={"auto"}
                            theme={"light"}>
                            <FontAwesomeIcon
                              className={styles.infoIcon}
                              icon="info-circle"></FontAwesomeIcon>
                          </Tippy>
                        )}
                      </div>
                    </th>
                    {!isPrimary && (
                      <th className="text-center">Effective Royalty %</th>
                    )}
                    <th className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        Artist Split{" "}
                        <Tippy
                          content={getTippyArtistsContent()}
                          placement={"auto"}
                          theme={"light"}>
                          <FontAwesomeIcon
                            className={styles.infoIcon}
                            icon="info-circle"></FontAwesomeIcon>
                        </Tippy>
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
                              ? "Card sold manually"
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
                            ? ((r.proceeds / r.volume) * 100).toFixed(2)
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
                          ? ((sumProceeds / sumVolume) * 100).toFixed(2)
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
        <DatePickerModal
          show={showDatePicker}
          initial_from={fromDate}
          initial_to={toDate}
          onApply={(fromDate, toDate) => {
            setIsPrimary(false);
            setFromDate(fromDate);
            setToDate(toDate);
            setDateSelection(
              DateIntervalsWithBlocksSelection.CUSTOM_DATES as keyof typeof DateIntervalsWithBlocksSelection
            );
          }}
          onHide={() => setShowDatePicker(false)}
        />
        <BlockPickerModal
          show={showBlockPicker}
          initial_from={fromBlock}
          initial_to={toBlock}
          onApply={(fromBlock, toBlock) => {
            setIsPrimary(false);
            setFromBlock(fromBlock);
            setToBlock(toBlock);
            setDateSelection(
              DateIntervalsWithBlocksSelection.CUSTOM_BLOCKS as keyof typeof DateIntervalsWithBlocksSelection
            );
          }}
          onHide={() => setShowBlockPicker(false)}
        />
      </Container>
    </>
  );
}
function getSharedProps(): import("react").JSX.IntrinsicAttributes &
  Readonly<import("./GasRoyalties").HeaderProps> {
  throw new Error("Function not implemented.");
}
