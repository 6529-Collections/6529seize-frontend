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

enum DateSelection {
  TODAY = "Today",
  WEEK = "Week",
  MONTH = "Month",
  YEAR = "Year",
  ALL = "All",
  CUSTOM = "Custom",
}

const MEMES_ARTIST_SPLIT = 0.5;

export default function Royalties() {
  const [fetching, setFetching] = useState(true);

  const [royalties, setRoyalties] = useState<Royalty[]>([]);

  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateSelection, setDateSelection] = useState<DateSelection>(
    DateSelection.TODAY
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
      case DateSelection.TODAY:
        filters += `&from_date=${formatDate(new Date())}`;
        break;
      case DateSelection.WEEK:
        const weekAgo = new Date();
        weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
        filters += `&from_date=${formatDate(weekAgo)}`;
        break;
      case DateSelection.MONTH:
        const monthAgo = new Date();
        monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
        filters += `&from_date=${formatDate(monthAgo)}`;
        break;
      case DateSelection.YEAR:
        const yearAgo = new Date();
        yearAgo.setUTCDate(yearAgo.getUTCDate() - 365);
        filters += `&from_date=${formatDate(yearAgo)}`;
        break;
      case DateSelection.CUSTOM:
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
          <h1>ROYALTIES {fetching && <DotLoader />}</h1>
          <Dropdown className={styles.filterDropdown} drop={"down"}>
            <Dropdown.Toggle>
              {dateSelection == DateSelection.CUSTOM ? (
                <span>
                  {fromDate && `from: ${fromDate.toISOString().slice(0, 10)}`}{" "}
                  {toDate && `to: ${toDate.toISOString().slice(0, 10)}`}
                </span>
              ) : (
                dateSelection
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(DateSelection).map((dateSelection) => (
                <Dropdown.Item
                  key={dateSelection}
                  onClick={() => {
                    if (dateSelection !== DateSelection.CUSTOM) {
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
                      {displayDecimal(r.total_volume, 3)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(r.total_royalties, 4)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(
                        (r.total_royalties * 100) / r.total_volume,
                        2
                      )}
                    </td>
                    <td className="text-center">
                      {displayDecimal(
                        r.total_royalties * MEMES_ARTIST_SPLIT,
                        4
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
      {royalties.length > 0 && (
        <Row className="pt-3 pb-3">
          <Col className="d-flex justify-content-end">
            <DownloadUrlWidget
              preview=""
              name={`royalties-memes-${dateSelection.toLowerCase()}`}
              url={`${getUrl()}&download=true`}
            />
          </Col>
        </Row>
      )}
      <DatePickerModal
        show={showDatePicker}
        initial_from={fromDate}
        initial_to={toDate}
        min={new Date("2023-03-20")}
        onApply={(fromDate, toDate) => {
          setFromDate(fromDate);
          setToDate(toDate);
          setDateSelection(DateSelection.CUSTOM);
        }}
        onHide={() => setShowDatePicker(false)}
      />
    </Container>
  );
}
