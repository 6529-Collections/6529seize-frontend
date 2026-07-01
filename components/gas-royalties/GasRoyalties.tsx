"use client";

import DatePickerModal from "@/components/datePickerModal/DatePickerModal";
import DownloadUrlWidget from "@/components/downloadUrlWidget/DownloadUrlWidget";
import { publicEnv } from "@/config/env";
import type { ApiArtistNameItem } from "@/generated/models/ApiArtistNameItem";
import { getDateFilters } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import {
  DateIntervalsSelection,
  GasRoyaltiesCollectionFocus,
} from "@/types/enums";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import DotLoader from "../dotLoader/DotLoader";
import styles from "./GasRoyalties.module.scss";

interface HeaderProps {
  title: string;
  description?: string | undefined;
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

function FilterDropdown({
  children,
  disabled,
  label,
}: Readonly<{
  children: ReactNode;
  disabled?: boolean;
  label: ReactNode;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <span ref={dropdownRef} className={styles["filterDropdown"]}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        {label}
      </button>
      {isOpen && (
        <span
          className={styles["filterDropdownMenu"]}
          role="menu"
          onClick={() => setIsOpen(false)}
        >
          {children}
        </span>
      )}
    </span>
  );
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
    fetchUrl<ApiArtistNameItem[]>(
      `${publicEnv.API_ENDPOINT}/api/${path}/artists_names`
    ).then((res: ApiArtistNameItem[]) => {
      setArtists(res);
    });
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
      <div className="tw-pt-4">
        <div className="tw-flex tw-items-center">
          <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
            <span className="tw-flex tw-items-center tw-gap-2">
              <h1>
                Meme {props.title} {props.fetching && <DotLoader />}
              </h1>
            </span>
            <span className="tw-flex tw-items-center tw-gap-3">
              <span
                className={`font-larger font-bolder font-color-h ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMES
                    ? styles["collectionFocusActive"]
                    : styles["collectionFocus"]
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
                aria-label="The Memes"
              >
                The Memes
              </span>
              <span
                className={`font-larger font-bolder font-color-h ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMELAB
                    ? styles["collectionFocusActive"]
                    : styles["collectionFocus"]
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
                aria-label="Meme Lab"
              >
                Meme Lab
              </span>
            </span>
          </div>
        </div>
        {props.description && (
          <div className="tw-pt-3">{props.description}</div>
        )}
        <div className="tw-pt-3">
          <div className="tw-flex tw-items-center tw-justify-between">
            <span>
              {!props.fetching && props.results_count > 0 && (
                <DownloadUrlWidget
                  preview="Download"
                  name={getFileName()}
                  url={`${props.getUrl()}&download=true`}
                />
              )}
            </span>
            <span className="tw-flex tw-items-center tw-gap-12">
              <FilterDropdown
                disabled={props.fetching}
                label={`Artist: ${props.selected_artist || "All"}`}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={styles["filterDropdownItem"]}
                  onClick={() => {
                    props.setSelectedArtist("");
                  }}
                >
                  All
                </button>
                {artists.map((a) => (
                  <button
                    type="button"
                    role="menuitem"
                    key={`artist-${a.name.replaceAll(" ", "-")}`}
                    className={styles["filterDropdownItem"]}
                    onClick={() => {
                      props.setSelectedArtist(a.name);
                    }}
                  >
                    {a.name}
                  </button>
                ))}
              </FilterDropdown>
              <FilterDropdown
                disabled={props.fetching}
                label={getDateSelectionLabel()}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={styles["filterDropdownItem"]}
                  onClick={() => props.setIsPrimary(true)}
                >
                  Primary Sales
                </button>
                <span className={styles["filterDropdownDivider"]} />
                <span className={styles["filterDropdownHeader"]}>
                  Secondary Sales
                </span>
                {Object.values(DateIntervalsSelection).map((dateSelection) => (
                  <button
                    type="button"
                    role="menuitem"
                    key={dateSelection}
                    className={styles["filterDropdownItem"]}
                    onClick={() => {
                      if (
                        dateSelection === DateIntervalsSelection.CUSTOM_DATES
                      ) {
                        setShowDatePicker(true);
                      } else {
                        props.setDateSelection(dateSelection);
                      }
                    }}
                  >
                    {dateSelection}
                  </button>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  className={styles["filterDropdownItem"]}
                  onClick={() => {
                    setShowBlockPicker(true);
                  }}
                >
                  Custom Blocks
                </button>
              </FilterDropdown>
            </span>
          </div>
        </div>
      </div>
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
  note?: string | undefined;
}

export function GasRoyaltiesTokenImage(props: Readonly<TokenImageProps>) {
  return (
    <a
      href={`/${props.path}/${props.token_id}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="tw-flex tw-items-center tw-justify-center tw-gap-3">
        <span>{props.token_id} -</span>
        <Image
          unoptimized
          loading={"lazy"}
          width={0}
          height={0}
          style={{ width: "auto", height: "40px" }}
          src={props.thumbnail}
          alt={props.name}
          className={styles["nftImage"]}
          data-tooltip-id={`token-image-${props.token_id}`}
        />
        {props.note && (
          <span>
            <FontAwesomeIcon
              className={styles["infoIcon"]}
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
