import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Royalty } from "../../entities/IRoyalty";
import { fetchUrl } from "../../services/6529api";
import { displayDecimal } from "../../helpers/Helpers";
import DatePickerModal from "../datePickerModal/DatePickerModal";
import { DateIntervalsSelection } from "../../enums";
import {
  GasRoyaltiesCollectionFocus,
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  getUrlParams,
} from "./GasRoyalties";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";

const MEMES_DESCRIPTION =
  "Primary mint revenues and secondary royalties in The Memes are split 50:50 between the artist and the collection. Cards #1 to #4 were sold manually. 6529 and 6529er have custom arrangements not reflected here for simplicity. All values are in ETH.";
const MEMELAB_DESCRIPTION =
  "Primary mint revenues and secondary royalties in Meme Lab are split between artist the and the collection solely at the artist's discretion. 6529 and 6529er have custom arrangements not reflected here for simplicity. All values are in ETH.";

const MEMES_SOLD_MANUALLY = [1, 2, 3, 4];

export default function Royalties() {
  const router = useRouter();

  const [description, setDescription] = useState<string>(MEMES_DESCRIPTION);

  const [fetching, setFetching] = useState(true);

  const [collectionFocus, setCollectionFocus] =
    useState<GasRoyaltiesCollectionFocus>();

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

  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [sumVolume, setSumVolume] = useState(0);
  const [sumProceeds, setSumProceeds] = useState(0);
  const [sumArtistTake, setSumArtistTake] = useState(0);

  const [selectedArtist, setSelectedArtist] = useState<string>("");

  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateSelection, setDateSelection] = useState<DateIntervalsSelection>(
    DateIntervalsSelection.THIS_MONTH
  );

  const [isPrimary, setIsPrimary] = useState<boolean>(false);

  function getUrl() {
    return getUrlParams(
      "royalties",
      isPrimary,
      dateSelection,
      collectionFocus,
      fromDate,
      toDate,
      selectedArtist
    );
  }

  function fetchRoyalties() {
    setFetching(true);
    fetchUrl(getUrl()).then((res: Royalty[]) => {
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
  }, [dateSelection, fromDate, toDate, selectedArtist, isPrimary]);

  useEffect(() => {
    if (collectionFocus) {
      setRoyalties([]);
      setDescription(
        collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
          ? MEMELAB_DESCRIPTION
          : MEMES_DESCRIPTION
      );
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
      content += ` in Meme Lab are split between artist the and the collection solely at the artist's discretion.`;
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
        title={"Meme Accounting"}
        // description={description}
        fetching={fetching}
        results_count={royalties.length}
        date_selection={dateSelection}
        is_primary={isPrimary}
        selected_artist={selectedArtist}
        from_date={fromDate}
        to_date={toDate}
        focus={collectionFocus}
        setFocus={setCollectionFocus}
        getUrl={getUrl}
        setSelectedArtist={setSelectedArtist}
        setIsPrimary={setIsPrimary}
        setDateSelection={(date_selection) => {
          setIsPrimary(false);
          setDateSelection(date_selection);
        }}
        setShowDatePicker={setShowDatePicker}
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
                      {isPrimary ? "Primary Proceeds" : "Royalties"}
                    </th>
                    <th className="d-flex align-items-center justify-content-center gap-2">
                      Artist Split{" "}
                      <Tippy
                        content={getTippyArtistsContent()}
                        placement={"auto"}
                        theme={"light"}>
                        <FontAwesomeIcon
                          className={styles.infoIcon}
                          icon="info-circle"></FontAwesomeIcon>
                      </Tippy>
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
                            MEMES_SOLD_MANUALLY.includes(r.token_id)
                              ? "Card sold manually"
                              : undefined
                          }
                        />
                      </td>
                      <td>{r.artist}</td>
                      <td className="text-center">
                        {displayDecimal(r.volume, 5)}
                      </td>
                      <td className="text-center">
                        {displayDecimal(r.proceeds, 5)}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center">
                          <span className="d-flex align-items-center gap-1">
                            {displayDecimal(r.artist_take, 5)}
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
                      {displayDecimal(sumVolume, 5)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(sumProceeds, 5)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(sumArtistTake, 5)}
                      {sumArtistTake > 0 &&
                        ` (${displayDecimal(
                          (sumArtistTake * 100) / sumProceeds,
                          2
                        )}%)`}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <b></b>
                    </td>
                    <td className="text-center" colSpan={3}>
                      <div className="font-color-h">
                        <b>All values are in ETH</b>
                      </div>
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
        <DatePickerModal
          show={showDatePicker}
          initial_from={fromDate}
          initial_to={toDate}
          onApply={(fromDate, toDate) => {
            setFromDate(fromDate);
            setToDate(toDate);
            setDateSelection(DateIntervalsSelection.CUSTOM);
          }}
          onHide={() => setShowDatePicker(false)}
        />
      </Container>
    </>
  );
}
