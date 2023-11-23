import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Royalty } from "../../entities/IRoyalty";
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

const MEMES_DESCRIPTION =
  "Primary mint revenues and secondary royalties in The Memes are split 50:50 between the artist and the collection. Cards #1 to #4 were sold manually. 6529 and 6529er have custom arrangements not reflected here for simplicity. All values are in ETH.";
const MEMELAB_DESCRIPTION =
  "Primary mint revenues and secondary royalties in Meme Lab are split between artist the and the collection solely at the artist's discretion. 6529 and 6529er have custom arrangements not reflected here for simplicity. All values are in ETH.";

export default function Royalties() {
  const router = useRouter();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

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
  const [sumPrimaryProceeds, setSumPrimaryProceeds] = useState(0);
  const [sumSecondaryVolume, setSumSecondaryVolume] = useState(0);
  const [sumRoyalties, setSumRoyalties] = useState(0);
  const [sumPrimaryArtistTake, setSumPrimaryArtistTake] = useState(0);
  const [sumSecondaryArtistTake, setSumSecondaryArtistTake] = useState(0);

  const [selectedArtist, setSelectedArtist] = useState<string>("");

  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateSelection, setDateSelection] = useState<DateIntervalsSelection>(
    DateIntervalsSelection.THIS_MONTH
  );

  function getUrl() {
    const dateFilters = getDateFilters(dateSelection, fromDate, toDate);
    const collection =
      collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
        ? "memelab"
        : "memes";
    const artistFilter = selectedArtist ? `&artist=${selectedArtist}` : "";
    return `${process.env.API_ENDPOINT}/api/royalties/collection/${collection}?${dateFilters}${artistFilter}`;
  }

  function fetchRoyalties() {
    setFetching(true);
    fetchUrl(getUrl()).then((res: Royalty[]) => {
      res.forEach((r) => {
        r.primary_volume = Math.round(r.primary_volume * 100000) / 100000;
        r.primary_proceeds = Math.round(r.primary_proceeds * 100000) / 100000;
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
      setSumPrimaryProceeds(
        res.reduce((prev, current) => prev + current.primary_proceeds, 0)
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
    if (collectionFocus) {
      fetchRoyalties();
    }
  }, [dateSelection, fromDate, toDate, selectedArtist]);

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

  useEffect(() => {
    if (collectionFocus) {
      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: "Meme Accounting" },
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
          title={"Meme Accounting"}
          description={description}
          fetching={fetching}
          results_count={royalties.length}
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
                    <th className="text-center">Primary Mint</th>
                    <th className="text-center">Primary Artist Split</th>
                    <th className="text-center">Secondary Volume</th>
                    <th className="text-center">Royalties</th>
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
                        {displayDecimal(r.primary_proceeds, 5)}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center">
                          <span className="d-flex align-items-center gap-1">
                            {displayDecimal(r.primary_artist_take, 5)}
                            {collectionFocus ===
                              GasRoyaltiesCollectionFocus.MEMELAB &&
                              r.primary_royalty_split > 0 && (
                                <span className="font-smaller font-color-h">
                                  (
                                  {displayDecimal(
                                    r.primary_royalty_split * 100,
                                    2
                                  )}
                                  %)
                                </span>
                              )}
                          </span>
                        </div>
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
                          )}%)`}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center">
                          <span className="d-flex align-items-center gap-1">
                            {displayDecimal(r.secondary_artist_take, 5)}
                            {collectionFocus ===
                              GasRoyaltiesCollectionFocus.MEMELAB &&
                              r.secondary_royalty_split > 0 && (
                                <span className="font-smaller font-color-h">
                                  (
                                  {displayDecimal(
                                    r.secondary_royalty_split * 100,
                                    2
                                  )}
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
                      {displayDecimal(sumPrimaryProceeds, 5)}
                    </td>
                    <td className="text-center">
                      {displayDecimal(sumPrimaryArtistTake, 5)}
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
                        )}%)`}
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
      </Container>
    </>
  );
}
