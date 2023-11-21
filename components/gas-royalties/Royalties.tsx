import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Royalty } from "../../entities/IRoyalty";
import { fetchUrl } from "../../services/6529api";
import { displayDecimal, getDateFilters } from "../../helpers/Helpers";
import DatePickerModal from "../datePickerModal/DatePickerModal";
import { DateIntervalsSelection } from "../../enums";
import {
  GasRoyaltiesCollectionFocus,
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
} from "./GasRoyalties";

export default function Royalties() {
  const [fetching, setFetching] = useState(true);

  const [collectionFocus, setCollectionFocus] =
    useState<GasRoyaltiesCollectionFocus>(GasRoyaltiesCollectionFocus.MEMES);

  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [sumPrimaryVolume, setSumPrimaryVolume] = useState(0);
  const [sumSecondaryVolume, setSumSecondaryVolume] = useState(0);
  const [sumRoyalties, setSumRoyalties] = useState(0);
  const [sumPrimaryArtistTake, setSumPrimaryArtistTake] = useState(0);
  const [sumSecondaryArtistTake, setSumSecondaryArtistTake] = useState(0);

  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateSelection, setDateSelection] = useState<DateIntervalsSelection>(
    DateIntervalsSelection.TODAY
  );

  function getUrl() {
    const dateFilters = getDateFilters(dateSelection, fromDate, toDate);
    const collection =
      collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
        ? "memelab"
        : "memes";
    return `${process.env.API_ENDPOINT}/api/royalties/collection/${collection}?${dateFilters}`;
  }

  function fetchRoyalties() {
    setFetching(true);
    fetchUrl(getUrl()).then((res: Royalty[]) => {
      res.forEach((r) => {
        r.primary_volume = Math.round(r.primary_volume * 100000) / 100000;
        r.secondary_volume = Math.round(r.secondary_volume * 100000) / 100000;
        r.primary_royalty_split =
          Math.round(r.primary_royalty_split * 100000) / 100000;
        r.secondary_royalty_split =
          Math.round(r.secondary_royalty_split * 100000) / 100000;
        r.royalties = Math.round(r.royalties * 100000) / 100000;
        r.primary_artist_take =
          Math.round(r.primary_artist_take * 100000) / 100000;
        r.secondary_artist_take =
          Math.round(r.secondary_artist_take * 100000) / 100000;
      });
      setRoyalties(res);
      setSumPrimaryVolume(
        res.reduce((prev, current) => prev + current.primary_volume, 0)
      );
      setSumSecondaryVolume(
        res.reduce((prev, current) => prev + current.secondary_volume, 0)
      );
      setSumRoyalties(
        res.reduce((prev, current) => prev + current.royalties, 0)
      );
      setSumPrimaryArtistTake(
        res.reduce((prev, current) => prev + current.primary_artist_take, 0)
      );
      setSumSecondaryArtistTake(
        res.reduce((prev, current) => prev + current.secondary_artist_take, 0)
      );
      setFetching(false);
    });
  }

  useEffect(() => {
    fetchRoyalties();
  }, [dateSelection, fromDate, toDate, collectionFocus]);

  return (
    <Container className={`no-padding pt-4`}>
      <GasRoyaltiesHeader
        title={"Artist Economics"}
        fetching={fetching}
        results_count={royalties.length}
        date_selection={dateSelection}
        from_date={fromDate}
        to_date={toDate}
        focus={collectionFocus}
        setFocus={setCollectionFocus}
        getUrl={getUrl}
        setDateSelection={setDateSelection}
        setShowDatePicker={setShowDatePicker}
      />
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
                  <th className="text-center">Primary Volume</th>
                  <th className="text-center">Secondary Volume</th>
                  <th className="text-center">Royalties</th>
                  <th className="text-center">Primary Artist Split</th>
                  <th className="text-center">Secondary Artist Split</th>
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
                      />
                    </td>
                    <td>{r.artist}</td>
                    <td className="text-center">
                      {displayDecimal(r.primary_volume, 5)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(r.secondary_volume, 5)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(r.royalties, 5)}
                      {r.royalties > 0 &&
                        ` (${displayDecimal(
                          (r.royalties * 100) / r.secondary_volume,
                          2
                        )}
                      %)`}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center">
                        <span className="d-flex align-items-center gap-1">
                          {displayDecimal(r.primary_artist_take, 5)}
                          <span className="font-smaller font-color-h">
                            ({r.primary_royalty_split * 100}%)
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center">
                        <span className="d-flex align-items-center gap-1">
                          {displayDecimal(r.secondary_artist_take, 5)}
                          <span className="font-smaller font-color-h">
                            ({r.secondary_royalty_split * 100}%)
                          </span>
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
                    {displayDecimal(sumPrimaryVolume, 5)}
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumSecondaryVolume, 5)}
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumRoyalties, 5)}
                    {sumRoyalties > 0 &&
                      ` (${displayDecimal(
                        (sumRoyalties * 100) / sumSecondaryVolume,
                        2
                      )}
                      %)`}
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumPrimaryArtistTake, 5)}
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumSecondaryArtistTake, 5)}
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
      {!fetching && royalties.length > 0 && (
        <Row className="pt-3 pb-3">
          <Col className="text-left font-color-h">
            * 6529 and 6529er have a different arrangement on royalties not
            reflected here.
          </Col>
        </Row>
      )}
    </Container>
  );
}
