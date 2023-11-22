import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Gas } from "../../entities/IGas";
import { fetchUrl } from "../../services/6529api";
import {
  capitalizeEveryWord,
  displayDecimal,
  getDateFilters,
} from "../../helpers/Helpers";
import DatePickerModal from "../datePickerModal/DatePickerModal";
import { DateIntervalsSelection } from "../../enums";
import {
  GasRoyaltiesCollectionFocus,
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
} from "./GasRoyalties";
import { useRouter } from "next/router";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";

export default function Gas() {
  const router = useRouter();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

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
  const [sumPrimary, setSumPrimary] = useState(0);
  const [sumSecondary, setSumSecondary] = useState(0);

  const [selectedArtist, setSelectedArtist] = useState<string>("");

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
    const artistFilter = selectedArtist ? `&artist=${selectedArtist}` : "";
    return `${process.env.API_ENDPOINT}/api/gas/collection/${collection}?${dateFilters}${artistFilter}`;
  }

  function fetchGas() {
    setFetching(true);
    fetchUrl(getUrl()).then((res: Gas[]) => {
      res.forEach((r) => {
        r.primary_gas = Math.round(r.primary_gas * 100000) / 100000;
        r.secondary_gas = Math.round(r.secondary_gas * 100000) / 100000;
      });
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
  }, [dateSelection, fromDate, toDate, selectedArtist]);

  useEffect(() => {
    setGas([]);
    fetchGas();
  }, [collectionFocus]);

  useEffect(() => {
    if (collectionFocus) {
      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: "Gas" },
        {
          display: capitalizeEveryWord(collectionFocus.replaceAll("-", " ")),
        },
      ]);
      router.push(
        {
          pathname: router.pathname,
          query: {
            focus: collectionFocus,
          },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [collectionFocus]);

  if (!collectionFocus) {
    return <></>;
  }

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container className={`no-padding pt-4`}>
        <GasRoyaltiesHeader
          title={"GAS"}
          fetching={fetching}
          results_count={gas.length}
          date_selection={dateSelection}
          selected_artist={selectedArtist}
          from_date={fromDate}
          to_date={toDate}
          focus={collectionFocus}
          setFocus={setCollectionFocus}
          getUrl={getUrl}
          setSelectedArtist={setSelectedArtist}
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
                        {displayDecimal(g.primary_gas, 5)}
                      </td>
                      <td className="text-center">
                        {displayDecimal(g.secondary_gas, 5)}
                      </td>
                    </tr>
                  ))}
                  <tr key={`gas-total`}>
                    <td colSpan={2} className="text-right">
                      <b>TOTAL</b>
                    </td>
                    <td className="text-center">
                      {displayDecimal(sumPrimary, 5)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(sumSecondary, 5)}
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
    </>
  );
}
