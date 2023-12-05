import styles from "./GasRoyalties.module.scss";
import { Row, Col, Dropdown, Container } from "react-bootstrap";
import { DateIntervalsWithBlocksSelection } from "../../enums";
import DotLoader from "../dotLoader/DotLoader";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import Image from "next/image";
import Tippy from "@tippyjs/react";
import { useState, useEffect } from "react";
import { fetchUrl } from "../../services/6529api";
import { capitalizeEveryWord, getDateFilters } from "../../helpers/Helpers";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import router from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export enum GasRoyaltiesCollectionFocus {
  MEMES = "the-memes",
  MEMELAB = "meme-lab",
}

export interface HeaderProps {
  title: string;
  description?: string;
  fetching: boolean;
  results_count: number;
  date_selection: keyof typeof DateIntervalsWithBlocksSelection;
  selected_artist: string;
  is_primary: boolean;
  from_date?: Date;
  to_date?: Date;
  from_block?: number;
  to_block?: number;
  focus: GasRoyaltiesCollectionFocus;
  setFocus: (focus: GasRoyaltiesCollectionFocus) => void;
  getUrl: () => string;
  setSelectedArtist: (artist: string) => void;
  setIsPrimary: (isPrimary: boolean) => void;
  setDateSelection: (
    dateSelection: keyof typeof DateIntervalsWithBlocksSelection
  ) => void;
  setShowDatePicker: (showDatePicker: boolean) => void;
  setShowBlockPicker: (showBlockPicker: boolean) => void;
}

export function getUrlParams(
  apiPath: string,
  isPrimary: boolean,
  dateSelection: keyof typeof DateIntervalsWithBlocksSelection,
  collectionFocus?: GasRoyaltiesCollectionFocus,
  fromDate?: Date,
  toDate?: Date,
  fromBlock?: number,
  toBlock?: number,
  selectedArtist?: string
): string {
  if (!collectionFocus) {
    return "";
  }
  let filters = "";
  if (isPrimary) {
    filters += "&primary=true";
  } else {
    filters += getDateFilters(
      dateSelection,
      fromDate,
      toDate,
      fromBlock,
      toBlock
    );
  }

  const collection =
    collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
      ? "memelab"
      : "memes";
  const artistFilter = selectedArtist ? `&artist=${selectedArtist}` : "";
  return `${process.env.API_ENDPOINT}/api/${apiPath}/collection/${collection}?${filters}${artistFilter}`;
}

export function GasRoyaltiesHeader(props: Readonly<HeaderProps>) {
  const [artists, setArtists] = useState<{ name: string; cards: number[] }[]>(
    []
  );

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  useEffect(() => {
    if (props.focus) {
      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: props.title },
        {
          display: capitalizeEveryWord(props.focus.replaceAll("-", " ")),
        },
      ]);
      router.push(
        {
          pathname: router.pathname,
          query: {
            focus: props.focus,
          },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [props.focus]);

  useEffect(() => {
    const path =
      props.focus === GasRoyaltiesCollectionFocus.MEMES ? "memes" : "memelab";
    fetchUrl(`${process.env.API_ENDPOINT}/api/${path}/artists_names`).then(
      (
        res: {
          name: string;
          cards: number[];
        }[]
      ) => {
        setArtists(res);
      }
    );
  }, [props.focus]);

  function getDateSelectionLabel() {
    let label = "";
    if (props.is_primary) {
      label += "Primary Sales";
    } else if (
      props.date_selection === DateIntervalsWithBlocksSelection.CUSTOM_DATES
    ) {
      if (props.from_date) {
        label += `from: ${props.from_date.toISOString().slice(0, 10)} `;
      }
      if (props.to_date) {
        label += `to: ${props.to_date.toISOString().slice(0, 10)}`;
      }
    } else if (
      props.date_selection == DateIntervalsWithBlocksSelection.CUSTOM_BLOCKS
    ) {
      if (props.from_block) {
        label += `from block: ${props.from_block} `;
      }
      if (props.to_block) {
        label += `to block: ${props.to_block} `;
      }
    } else {
      label += `${props.date_selection}`;
    }
    return <span>{label}</span>;
  }

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container className="pt-4">
        <Row className="d-flex align-items-center">
          <Col className="d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center gap-2">
              <h1>
                {props.title.toUpperCase()} {props.fetching && <DotLoader />}
              </h1>
            </span>
            <span className="d-flex align-items-center gap-3">
              <span
                className={`font-larger font-bolder font-color-h ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMES
                    ? styles.collectionFocusActive
                    : styles.collectionFocus
                }`}
                onClick={() =>
                  props.setFocus(GasRoyaltiesCollectionFocus.MEMES)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setFocus(GasRoyaltiesCollectionFocus.MEMES);
                  }
                }}
                aria-label="The Memes">
                The Memes
              </span>
              <span
                className={`font-larger font-bolder font-color-h ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMELAB
                    ? styles.collectionFocusActive
                    : styles.collectionFocus
                }`}
                onClick={() =>
                  props.setFocus(GasRoyaltiesCollectionFocus.MEMELAB)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setFocus(GasRoyaltiesCollectionFocus.MEMELAB);
                  }
                }}
                aria-label="Meme Lab">
                Meme Lab
              </span>
            </span>
          </Col>
        </Row>
        {props.description && (
          <Row className="pt-3">
            <Col>{props.description}</Col>
          </Row>
        )}
        <Row className="pt-3">
          <Col className="d-flex align-items-center justify-content-between">
            <span>
              {!props.fetching && props.results_count > 0 && (
                <DownloadUrlWidget
                  preview=""
                  name={`${props.title.toLowerCase().replaceAll(" ", "-")}_${
                    props.focus
                  }_${props.date_selection.toLowerCase().replaceAll(" ", "-")}`}
                  url={`${props.getUrl()}&download=true`}
                />
              )}
            </span>
            <span className="d-flex align-items-center gap-5">
              <Dropdown className={styles.filterDropdown} drop={"down"}>
                <Dropdown.Toggle disabled={props.fetching}>
                  Artist: {props.selected_artist || "All"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => {
                      props.setSelectedArtist("");
                    }}>
                    All
                  </Dropdown.Item>
                  {artists.map((a) => (
                    <Dropdown.Item
                      key={`artist-${a.name.replaceAll(" ", "-")}`}
                      onClick={() => {
                        props.setSelectedArtist(a.name);
                      }}>
                      {a.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown className={styles.filterDropdown} drop={"down"}>
                <Dropdown.Toggle disabled={props.fetching}>
                  {getDateSelectionLabel()}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => props.setIsPrimary(true)}>
                    Primary Sales
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Header>Secondary Sales</Dropdown.Header>
                  {Object.entries(DateIntervalsWithBlocksSelection).map(
                    ([key, value]) => (
                      <Dropdown.Item
                        key={key}
                        onClick={() => {
                          if (
                            value ===
                            DateIntervalsWithBlocksSelection.CUSTOM_DATES
                          ) {
                            props.setShowDatePicker(true);
                          } else if (
                            value ===
                            DateIntervalsWithBlocksSelection.CUSTOM_BLOCKS
                          ) {
                            props.setShowBlockPicker(true);
                          } else {
                            props.setDateSelection(
                              key as keyof typeof DateIntervalsWithBlocksSelection
                            );
                          }
                        }}>
                        {value}
                      </Dropdown.Item>
                    )
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </span>
          </Col>
        </Row>
      </Container>
    </>
  );
}

interface TokenImageProps {
  path: string;
  token_id: number;
  name: string;
  thumbnail: string;
  note?: string;
}

export function GasRoyaltiesTokenImage(props: Readonly<TokenImageProps>) {
  return (
    <a
      href={`/${props.path}/${props.token_id}`}
      target="_blank"
      rel="noreferrer">
      <span className="d-flex justify-content-center aling-items-center gap-3">
        <span>{props.token_id} -</span>
        <Tippy
          content={`${props.name}`}
          delay={0}
          placement={"auto"}
          theme={"light"}>
          <Image
            loading={"lazy"}
            width={0}
            height={0}
            style={{ width: "auto", height: "40px" }}
            src={props.thumbnail}
            alt={props.name}
            className={styles.nftImage}
          />
        </Tippy>
        {props.note && (
          <Tippy content={props.note} placement={"auto"} theme={"light"}>
            <span>
              <FontAwesomeIcon
                className={styles.infoIcon}
                icon="info-circle"></FontAwesomeIcon>
            </span>
          </Tippy>
        )}
      </span>
    </a>
  );
}

export function useSharedState() {
  const [selectedArtist, setSelectedArtist] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromBlock, setFromBlock] = useState<number>();
  const [toBlock, setToBlock] = useState<number>();
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [dateSelection, setDateSelection] = useState<
    keyof typeof DateIntervalsWithBlocksSelection
  >(
    DateIntervalsWithBlocksSelection.THIS_MONTH as keyof typeof DateIntervalsWithBlocksSelection
  );
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [collectionFocus, setCollectionFocus] =
    useState<GasRoyaltiesCollectionFocus>();
  const [fetching, setFetching] = useState(true);

  function getUrl(type: string) {
    return getUrlParams(
      type,
      isPrimary,
      dateSelection,
      collectionFocus,
      fromDate,
      toDate,
      fromBlock,
      toBlock,
      selectedArtist
    );
  }

  function getSharedProps() {
    return {
      fetching,
      date_selection: dateSelection,
      selected_artist: selectedArtist,
      is_primary: isPrimary,
      from_date: fromDate,
      to_date: toDate,
      from_block: fromBlock,
      to_block: toBlock,
      setFocus: setCollectionFocus,
      setSelectedArtist,
      setIsPrimary,
      setShowDatePicker,
      setShowBlockPicker,
    };
  }

  return {
    selectedArtist,
    setSelectedArtist,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    showDatePicker,
    setShowDatePicker,
    dateSelection,
    setDateSelection,
    isPrimary,
    setIsPrimary,
    collectionFocus,
    setCollectionFocus,
    fetching,
    setFetching,
    getUrl,
    getSharedProps,
    showBlockPicker,
    setShowBlockPicker,
    fromBlock,
    setFromBlock,
    toBlock,
    setToBlock,
  };
}
