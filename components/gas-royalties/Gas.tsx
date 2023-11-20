import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Gas } from "../../entities/IGas";
import { fetchUrl } from "../../services/6529api";
import { displayDecimal, getDateFilters } from "../../helpers/Helpers";
import DatePickerModal from "../datePickerModal/DatePickerModal";
import { DateIntervalsSelection } from "../../enums";
import { GasRoyaltiesHeader, GasRoyaltiesTokenImage } from "./GasRoyalties";

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
      setSumPrimary(res.map((g) => g.primary_gas).reduce((a, b) => a + b, 0));
      setSumSecondary(
        res.map((g) => g.secondary_gas).reduce((a, b) => a + b, 0)
      );
      setFetching(false);
    });
  }

  useEffect(() => {
    fetchGas();
  }, [dateSelection, fromDate, toDate]);

  return (
    <Container className={`no-padding pt-4`}>
      <GasRoyaltiesHeader
        title={"GAS"}
        fetching={fetching}
        results_count={gas.length}
        date_selection={dateSelection}
        from_date={fromDate}
        to_date={toDate}
        getUrl={getUrl}
        setDateSelection={setDateSelection}
        setShowDatePicker={setShowDatePicker}
      />
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
                {gas.map((g) => (
                  <tr key={`token-${g.token_id}`}>
                    <td>
                      <GasRoyaltiesTokenImage
                        token_id={g.token_id}
                        name={g.name}
                        thumbnail={g.thumbnail}
                      />
                    </td>
                    <td>{g.artist}</td>
                    <td className="text-center">
                      {displayDecimal(g.primary_gas, 3)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(g.secondary_gas, 4)}
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
