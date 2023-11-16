import { useEffect, useState } from "react";
import { Container, Row, Col, Table, Dropdown } from "react-bootstrap";
import styles from "./Gas.module.scss";
import DotLoader from "../dotLoader/DotLoader";
import { Gas } from "../../entities/IGas";
import { fetchUrl } from "../../services/6529api";
import { displayDecimal, getDateFilters } from "../../helpers/Helpers";
import Image from "next/image";
import DatePickerModal from "../datePickerModal/DatePickerModal";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import { DateIntervalsSelection } from "../../enums";

export default function Gas() {
  const [fetching, setFetching] = useState(true);

  const [gas, setGas] = useState<Gas[]>([]);
  const [sumPrimary, setSumPrimary] = useState(0);
  const [sumSecondary, setSumSecondary] = useState(0);

  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateSelection, setDateSelection] = useState<DateIntervalsSelection>(
    DateIntervalsSelection.TODAY
  );

  function getUrl() {
    const dateFilters = getDateFilters(dateSelection, fromDate, toDate);
    return `${process.env.API_ENDPOINT}/api/gas/memes?${dateFilters}`;
  }

  function fetchGas() {
    setFetching(true);
    fetchUrl(getUrl()).then((res: Gas[]) => {
      setGas(res);
      setSumPrimary(res.map((r) => r.primary_gas).reduce((a, b) => a + b, 0));
      setSumSecondary(
        res.map((r) => r.secondary_gas).reduce((a, b) => a + b, 0)
      );
      setFetching(false);
    });
  }

  useEffect(() => {
    fetchGas();
  }, [dateSelection, fromDate, toDate]);

  return (
    <Container className={`no-padding pt-4`}>
      <Row className="d-flex align-items-center">
        <Col className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2">
            <h1>GAS {fetching && <DotLoader />}</h1>
            {!fetching && gas.length > 0 && (
              <DownloadUrlWidget
                preview=""
                name={`gas-memes-${dateSelection.toLowerCase()}`}
                url={`${getUrl()}&download=true`}
              />
            )}
          </span>
          <Dropdown className={styles.filterDropdown} drop={"down"}>
            <Dropdown.Toggle disabled={fetching}>
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
          {gas.length > 0 && (
            <Table bordered={false} className={styles.gasTable}>
              <thead>
                <tr>
                  <th>Meme Card (x{gas.length})</th>
                  <th>Artist</th>
                  <th className="text-center">Gas Primary (ETH)</th>
                  <th className="text-center">Gas Secondary (ETH)</th>
                </tr>
              </thead>
              <tbody>
                {gas.map((r) => (
                  <tr key={`token-${r.token_id}`}>
                    <td>
                      <a
                        href={`/the-memes/${r.token_id}`}
                        target="_blank"
                        rel="noreferrer">
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
                      </a>
                    </td>
                    <td>{r.artist}</td>
                    <td className="text-center">
                      {displayDecimal(r.primary_gas, 3)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(r.secondary_gas, 4)}
                    </td>
                  </tr>
                ))}
                <tr key={`gas-total`}>
                  <td colSpan={2} className="text-right">
                    <b>TOTAL</b>
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumPrimary, 3)}
                  </td>
                  <td className="text-center">
                    {displayDecimal(sumSecondary, 3)}
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
      {!fetching && gas.length === 0 && (
        <Row>
          <Col>
            <h5>No gas info found for selected dates</h5>
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
