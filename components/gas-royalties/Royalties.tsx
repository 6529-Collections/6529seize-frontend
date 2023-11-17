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
  const [sumTotalVolume, setSumTotalVolume] = useState(0);
  const [sumTotalRoyalties, setSumTotalRoyalties] = useState(0);
  const [sumTotalArtistTake, setSumTotalArtistTake] = useState(0);

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
      setRoyalties(res);
      setSumTotalVolume(
        res.reduce((prev, current) => prev + current.total_volume, 0)
      );
      setSumTotalRoyalties(
        res.reduce((prev, current) => prev + current.total_royalties, 0)
      );
      setSumTotalArtistTake(
        res.reduce((prev, current) => prev + current.artist_take, 0)
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
        title={"ROYALTIES"}
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
                  <th className="text-center">Volume (ETH)</th>
                  <th className="text-center">Royalties (ETH)</th>
                  <th className="text-center">Rate (%)</th>
                  <th className="text-center">Artist Split (ETH)</th>
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
                      {displayDecimal(r.total_volume, 4)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(r.total_royalties, 4)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(
                        (r.total_royalties * 100) / r.total_volume,
                        4
                      )}
                    </td>
                    <td className="d-flex justify-content-center">
                      <span className="d-flex align-items-center gap-1">
                        {displayDecimal(r.artist_take, 4)}
                        {r.total_royalties > 0 && r.royalty_split > 0 && (
                          <span className="font-smaller font-color-h">
                            ({r.royalty_split * 100}%)
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr key={`royalties-total`}>
                  <td colSpan={2} className="text-right">
                    <b>TOTAL</b>
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumTotalVolume, 4)}
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumTotalRoyalties, 4)}
                  </td>
                  <td className="text-center">
                    {displayDecimal(
                      (sumTotalRoyalties * 100) / sumTotalVolume,
                      4
                    )}
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumTotalArtistTake, 4)}
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
  );
}
