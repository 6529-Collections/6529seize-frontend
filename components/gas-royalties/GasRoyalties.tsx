"use client";

import DatePickerModal from "@/components/datePickerModal/DatePickerModal";
import DownloadUrlWidget from "@/components/downloadUrlWidget/DownloadUrlWidget";
import { publicEnv } from "@/config/env";
import { DateIntervalsSelection, GasRoyaltiesCollectionFocus } from "@/enums";
import { ApiArtistNameItem } from "@/generated/models/ApiArtistNameItem";
import { getDateFilters } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Container, Dropdown, Row } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import DotLoader from "../dotLoader/DotLoader";
import styles from "./GasRoyalties.module.scss";

interface HeaderProps {
  title: string;
  description?: string;
  fetching: boolean;
  results_count: number;
  date_selection: DateIntervalsSelection;
  selected_artist: string;
  is_primary: boolean;
  is_custom_blocks: boolean;
  focus: GasRoyaltiesCollectionFocus;
  getUrl: () => string;
  setSelectedArtist: (artist: string) => void;
  setIsPrimary: (isPrimary: boolean) => void;
  setIsCustomBlocks: (iCustomBlocks: boolean) => void;
  setDateSelection: (dateSelection: DateIntervalsSelection) => void;
  setDates: (fromDate: Date, toDate: Date) => void;
  setBlocks: (fromBlock: number, toBlock: number) => void;
}

function getUrlParams(
  apiPath: string,
  isPrimary: boolean,
  isCustomBlocks: boolean,
  dateSelection: DateIntervalsSelection,
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
  } else if (isCustomBlocks) {
    if (fromBlock) {
      filters += `&from_block=${fromBlock}`;
    }
    if (toBlock) {
      filters += `&to_block=${toBlock}`;
    }
  } else {
    filters += getDateFilters(dateSelection, fromDate, toDate);
  }

  const collection =
    collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
      ? "memelab"
      : "memes";
  const artistFilter = selectedArtist ? `&artist=${selectedArtist}` : "";
  return `${publicEnv.API_ENDPOINT}/api/${apiPath}/collection/${collection}?${filters}${artistFilter}`;
}

export function GasRoyaltiesHeader(props: Readonly<HeaderProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [artists, setArtists] = useState<ApiArtistNameItem[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [fromBlock, setFromBlock] = useState<number>();
  const [toBlock, setToBlock] = useState<number>();

  useEffect(() => {
    const path =
      props.focus === GasRoyaltiesCollectionFocus.MEMES ? "memes" : "memelab";
    fetchUrl(`${publicEnv.API_ENDPOINT}/api/${path}/artists_names`).then(
      (res: ApiArtistNameItem[]) => {
        setArtists(res);
      }
    );
  }, [props.focus]);

  function getDateSelectionLabel() {
    let label = "";
    if (props.is_primary) {
      label += "Primary Sales";
    } else if (props.is_custom_blocks) {
      if (fromBlock) {
        label += `from block: ${fromBlock} `;
      }
      if (toBlock) {
        label += `to block: ${toBlock} `;
      }
    } else if (props.date_selection === DateIntervalsSelection.CUSTOM_DATES) {
      if (fromDate) {
        label += `from: ${fromDate.toISOString().slice(0, 10)} `;
      }
      if (toDate) {
        label += `to: ${toDate.toISOString().slice(0, 10)}`;
      }
    } else {
      label += `${props.date_selection}`;
    }
    return <span>{label}</span>;
  }

  function getFileName() {
    const title = props.title.toLowerCase().replaceAll(" ", "-");
    const focus = props.focus.toLowerCase().replaceAll(" ", "-");
    let filters = "all";
    if (props.is_primary) {
      filters = "primary-sales";
    } else if (props.is_custom_blocks) {
      filters = `blocks_${fromBlock}-${toBlock}`;
    } else if (props.date_selection === DateIntervalsSelection.CUSTOM_DATES) {
      filters = `dates_${fromDate?.toISOString().slice(0, 10)}-${toDate
        ?.toISOString()
        .slice(0, 10)}`;
    } else {
      filters = `${props.date_selection.toLowerCase().replaceAll(" ", "-")}`;
    }
    return `${title}_${focus}_${filters}.csv`;
  }

  return (
    <>
      <Container className="pt-4">
        <Row className="d-flex align-items-center">
          <Col className="d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center gap-2">
              <h1>
                <span className="font-lightest">Meme</span> {props.title}{" "}
                {props.fetching && <DotLoader />}
              </h1>
            </span>
            <span className="d-flex align-items-center gap-3">
              <span
                className={`font-larger font-bolder font-color-h ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMES
                    ? styles.collectionFocusActive
                    : styles.collectionFocus
                }`}
                onClick={() => {
                  router.push(
                    `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(
                      `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`
                    );
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
                  router.push(
                    `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMELAB}`
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(
                      `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMELAB}`
                    );
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
                  preview="Download"
                  name={getFileName()}
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
                  {Object.values(DateIntervalsSelection).map(
                    (dateSelection) => (
                      <Dropdown.Item
                        key={dateSelection}
                        onClick={() => {
                          if (
                            dateSelection ===
                            DateIntervalsSelection.CUSTOM_DATES
                          ) {
                            setShowDatePicker(true);
                          } else {
                            props.setDateSelection(dateSelection);
                          }
                        }}>
                        {dateSelection}
                      </Dropdown.Item>
                    )
                  )}
                  <Dropdown.Item
                    onClick={() => {
                      setShowBlockPicker(true);
                    }}>
                    Custom Blocks
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </span>
          </Col>
        </Row>
      </Container>
      <DatePickerModal
        mode="date"
        show={showDatePicker}
        initial_from_date={fromDate}
        initial_to_date={toDate}
        onApplyDate={(fromDate, toDate) => {
          setFromDate(fromDate);
          setToDate(toDate);
          props.setDates(fromDate, toDate);
        }}
        onHide={() => setShowDatePicker(false)}
      />
      <DatePickerModal
        mode="block"
        show={showBlockPicker}
        initial_from_block={fromBlock}
        initial_to_block={toBlock}
        onApplyBlock={(fromBlock, toBlock) => {
          setFromBlock(fromBlock);
          setToBlock(toBlock);
          props.setBlocks(fromBlock, toBlock);
        }}
        onHide={() => setShowBlockPicker(false)}
      />
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
        <Image
          unoptimized
          loading={"lazy"}
          width={0}
          height={0}
          style={{ width: "auto", height: "40px" }}
          src={props.thumbnail}
          alt={props.name}
          className={styles.nftImage}
          data-tooltip-id={`token-image-${props.token_id}`}
        />
        {props.note && (
          <span>
            <FontAwesomeIcon
              className={styles.infoIcon}
              icon={faInfoCircle}
              data-tooltip-id={`token-info-${props.token_id}`}
            />
          </span>
        )}
      </span>
      <Tooltip
        id={`token-image-${props.token_id}`}
        content={props.name}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      />
      {props.note && (
        <Tooltip
          id={`token-info-${props.token_id}`}
          content={props.note}
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "4px 8px",
          }}
        />
      )}
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
  const [dateSelection, setDateSelection] = useState<DateIntervalsSelection>(
    DateIntervalsSelection.THIS_MONTH
  );
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isCustomBlocks, setIsCustomBlocks] = useState<boolean>(false);
  const [collectionFocus, setCollectionFocus] =
    useState<GasRoyaltiesCollectionFocus>();
  const [fetching, setFetching] = useState(true);

  function getUrl(type: string) {
    return getUrlParams(
      type,
      isPrimary,
      isCustomBlocks,
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
      is_custom_blocks: isCustomBlocks,
      setSelectedArtist,
      setIsPrimary,
      setIsCustomBlocks,
      setDates: (fromDate: Date, toDate: Date) => {
        setFromDate(fromDate);
        setToDate(toDate);
        setIsPrimary(false);
        setIsCustomBlocks(false);
        setDateSelection(DateIntervalsSelection.CUSTOM_DATES);
      },
      setBlocks: (fromBlock: number, toBlock: number) => {
        setFromBlock(fromBlock);
        setToBlock(toBlock);
        setIsPrimary(false);
        setIsCustomBlocks(true);
      },
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
    isCustomBlocks,
    setIsCustomBlocks,
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
