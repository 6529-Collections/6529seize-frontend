import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Gas } from "../../entities/IGas";
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

export default function Gas() {
  const router = useRouter();

  const [fetching, setFetching] = useState(true);

  const [collectionFocus, setCollectionFocus] =
    useState<GasRoyaltiesCollectionFocus>(GasRoyaltiesCollectionFocus.MEMES);

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

  const [gas, setGas] = useState<Gas[]>([]);
  const [sumGas, setSumGas] = useState(0);

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
      "gas",
      isPrimary,
      dateSelection,
      collectionFocus,
      fromDate,
      toDate,
      selectedArtist
    );
  }

  function fetchGas() {
    setFetching(true);
    fetchUrl(getUrl()).then((res: Gas[]) => {
      res.forEach((r) => {
        r.gas = Math.round(r.gas * 100000) / 100000;
      });
      setGas(res);
      setSumGas(res.map((g) => g.gas).reduce((a, b) => a + b, 0));
      setFetching(false);
    });
  }

  useEffect(() => {
    if (collectionFocus) {
      fetchGas();
    }
  }, [dateSelection, fromDate, toDate, selectedArtist, isPrimary]);

  useEffect(() => {
    if (collectionFocus) {
      setGas([]);
      fetchGas();
    }
  }, [collectionFocus]);

  if (!collectionFocus) {
    return <></>;
  }

  return (
    <>
      <GasRoyaltiesHeader
        title={"Gas"}
        fetching={fetching}
        results_count={gas.length}
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
        <Row className={`pt-3 ${styles.scrollContainer}`}>
          <Col>
            {gas.length > 0 && (
              <Table bordered={false} className={styles.gasTable}>
                <thead>
                  <tr>
                    <th>Meme Card (x{gas.length})</th>
                    <th>Artist</th>
                    <th className="text-center">Gas (ETH)</th>
                  </tr>
                </thead>
                <tbody>
                  {gas.map((g) => (
                    <tr key={`token-${g.token_id}`}>
                      <td>
                        <GasRoyaltiesTokenImage
                          path={
                            collectionFocus ===
                            GasRoyaltiesCollectionFocus.MEMELAB
                              ? "meme-lab"
                              : "the-memes"
                          }
                          token_id={g.token_id}
                          name={g.name}
                          thumbnail={g.thumbnail}
                        />
                      </td>
                      <td>{g.artist}</td>
                      <td className="text-center">
                        {displayDecimal(g.gas, 5)}
                      </td>
                    </tr>
                  ))}
                  <tr key={`gas-total`}>
                    <td colSpan={2} className="text-right">
                      <b>TOTAL</b>
                    </td>
                    <td className="text-center">{displayDecimal(sumGas, 5)}</td>
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
    </>
  );
}
