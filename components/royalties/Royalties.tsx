import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Dropdown,
  Form,
  Badge,
} from "react-bootstrap";
import styles from "./Royalties.module.scss";
import DotLoader from "../dotLoader/DotLoader";
import { Royalty } from "../../entities/IRoyalty";
import { fetchUrl } from "../../services/6529api";
import { displayDecimal } from "../../helpers/Helpers";
import Image from "next/image";
import DatePickerModal from "../datePickerModal/DatePickerModal";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import { DateIntervalsSelection } from "../../enums";

const MEMES_ARTIST_SPLIT = 0.5;

export default function Royalties() {
  const [fetching, setFetching] = useState(true);

  const [royalties, setRoyalties] = useState<Royalty[]>([]);

  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateSelection, setDateSelection] = useState<DateIntervalsSelection>(
    DateIntervalsSelection.TODAY
  );

  function formatDate(d: Date) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getUrl() {
    let filters = "";
    switch (dateSelection) {
      case DateIntervalsSelection.ALL:
        break;
      case DateIntervalsSelection.TODAY:
        filters += `&from_date=${formatDate(new Date())}`;
        break;
      case DateIntervalsSelection.YESTERDAY:
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        filters += `&from_date=${formatDate(yesterday)}`;
        filters += `&to_date=${formatDate(yesterday)}`;
        break;
      case DateIntervalsSelection.LAST_7:
        const weekAgo = new Date();
        weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
        filters += `&from_date=${formatDate(weekAgo)}`;
        break;
      case DateIntervalsSelection.THIS_MONTH:
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setUTCDate(1);
        filters += `&from_date=${formatDate(firstDayOfMonth)}`;
        break;
      case DateIntervalsSelection.PREVIOUS_MONTH:
        const firstDayOfPreviousMonth = new Date();
        firstDayOfPreviousMonth.setUTCMonth(
          firstDayOfPreviousMonth.getUTCMonth() - 1
        );
        firstDayOfPreviousMonth.setUTCDate(1);
        const lastDayOfPreviousMonth = new Date();
        lastDayOfPreviousMonth.setUTCDate(0);
        filters += `&from_date=${formatDate(firstDayOfPreviousMonth)}`;
        filters += `&to_date=${formatDate(lastDayOfPreviousMonth)}`;
        break;
      case DateIntervalsSelection.YEAR_TO_DATE:
        const firstDayOfYear = new Date();
        firstDayOfYear.setUTCMonth(0);
        firstDayOfYear.setUTCDate(1);
        filters += `&from_date=${formatDate(firstDayOfYear)}`;
        break;
      case DateIntervalsSelection.LAST_YEAR:
        const firstDayOfLastYear = new Date();
        firstDayOfLastYear.setUTCFullYear(
          firstDayOfLastYear.getUTCFullYear() - 1
        );
        firstDayOfLastYear.setUTCMonth(0);
        firstDayOfLastYear.setUTCDate(1);
        const lastDayOfLastYear = new Date();
        lastDayOfLastYear.setUTCMonth(0);
        lastDayOfLastYear.setUTCDate(0);
        filters += `&from_date=${formatDate(firstDayOfLastYear)}`;
        filters += `&to_date=${formatDate(lastDayOfLastYear)}`;
        break;
      case DateIntervalsSelection.CUSTOM:
        if (fromDate) {
          filters += `&from_date=${formatDate(fromDate)}`;
        }
        if (toDate) {
          filters += `&to_date=${formatDate(toDate)}`;
        }
        break;
    }
    return `${process.env.API_ENDPOINT}/api/royalties_memes?${filters}`;
  }

  function fetchRoyalties() {
    setFetching(true);
    fetchUrl(getUrl()).then((res: Royalty[]) => {
      setRoyalties(res);
      setFetching(false);
    });
  }

  useEffect(() => {
    fetchRoyalties();
  }, [dateSelection, fromDate, toDate]);

  return (
    <Container className={`no-padding pt-4`}>
      <Row className="d-flex align-items-center">
        <Col className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2">
            <h1>ROYALTIES {fetching && <DotLoader />}</h1>
            {!fetching && royalties.length > 0 && (
              <DownloadUrlWidget
                preview=""
                name={`royalties-memes-${dateSelection.toLowerCase()}`}
                url={`${getUrl()}&download=true`}
              />
            )}
          </span>
          <Dropdown className={styles.filterDropdown} drop={"down"}>
            <Dropdown.Toggle>
              {dateSelection == DateIntervalsSelection.CUSTOM ? (
                <span>
                  {fromDate && `from: ${fromDate.toISOString().slice(0, 10)}`}{" "}
                  {toDate && `to: ${toDate.toISOString().slice(0, 10)}`}
                </span>
              ) : (
                dateSelection
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(DateIntervalsSelection).map((dateSelection) => (
                <Dropdown.Item
                  key={dateSelection}
                  onClick={() => {
                    if (dateSelection !== DateIntervalsSelection.CUSTOM) {
                      setDateSelection(dateSelection);
                    } else {
                      setShowDatePicker(true);
                    }
                  }}>
                  {dateSelection}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
      <Row className={`pt-3 ${styles.scrollContainer}`}>
        <Col>
          {royalties.length > 0 && (
            <Table bordered={false} className={styles.royaltiesTable}>
              <thead>
                <tr>
                  <th>Meme Card (x{royalties.length})</th>
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
                      <span className="d-flex aling-items-center gap-2">
                        <span>
                          {r.token_id} - {r.name}
                        </span>
                        <Image
                          loading={"lazy"}
                          width={0}
                          height={0}
                          style={{ width: "auto", height: "40px" }}
                          src={r.thumbnail}
                          alt={r.name}
                          className={styles.nftImage}
                        />
                      </span>
                    </td>
                    <td>{r.artist}</td>
                    <td className="text-center">
                      {displayDecimal(r.total_volume, 4)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(r.total_royalties, 6)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(
                        (r.total_royalties * 100) / r.total_volume,
                        5
                      )}
                    </td>
                    <td className="text-center">
                      {displayDecimal(
                        r.total_royalties * MEMES_ARTIST_SPLIT,
                        6
                      )}
                    </td>
                  </tr>
                ))}
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
