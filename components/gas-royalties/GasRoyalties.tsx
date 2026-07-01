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

type FilterDropdownItem =
  | {
      type: "item";
      key: string;
      label: ReactNode;
      onSelect: () => void;
    }
  | {
      type: "divider";
      key: string;
    }
  | {
      type: "header";
      key: string;
      label: ReactNode;
    };

function GasRoyaltiesFilterDropdown({
  label,
  ariaLabel,
  disabled,
  items,
}: Readonly<{
  label: ReactNode;
  ariaLabel: string;
  disabled: boolean;
  items: FilterDropdownItem[];
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        event.target instanceof Node &&
        dropdownRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className="tailwind-scope tw-relative tw-inline-flex"
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((current) => !current)}
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg tw-font-bold tw-text-iron-400 tw-shadow-none tw-transition tw-duration-200 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
      >
        <span className="tw-min-w-0 tw-truncate">{label}</span>
        <svg
          className={`tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="tw-absolute tw-right-0 tw-top-full tw-z-[999] tw-mt-2 tw-min-w-[14rem] tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10">
          <ul className="tw-mx-0 tw-mb-0 tw-max-h-80 tw-list-none tw-overflow-y-auto tw-overflow-x-hidden tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-600">
            {items.map((item) => {
              if (item.type === "divider") {
                return (
                  <li key={item.key} aria-hidden="true">
                    <hr className="tw-my-1 tw-h-px tw-border-0 tw-bg-white/10" />
                  </li>
                );
              }

              if (item.type === "header") {
                return (
                  <li key={item.key}>
                    <div className="tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
                      {item.label}
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      item.onSelect();
                      setIsOpen(false);
                    }}
                    className="tw-block tw-w-full tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-200 hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
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
    if (props.is_primary) {
      return "Primary Sales";
    }
    if (props.is_custom_blocks) {
      return (
        [
          fromBlock !== undefined ? `from block: ${fromBlock}` : undefined,
          toBlock !== undefined ? `to block: ${toBlock}` : undefined,
        ]
          .filter(Boolean)
          .join(" ") || "Custom Blocks"
      );
    }
    if (props.date_selection === DateIntervalsSelection.CUSTOM_DATES) {
      return (
        [
          fromDate ? `from: ${fromDate.toISOString().slice(0, 10)}` : undefined,
          toDate ? `to: ${toDate.toISOString().slice(0, 10)}` : undefined,
        ]
          .filter(Boolean)
          .join(" ") || DateIntervalsSelection.CUSTOM_DATES
      );
    }
    return props.date_selection;
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

  const artistItems: FilterDropdownItem[] = [
    {
      type: "item",
      key: "artist-all",
      label: "All",
      onSelect: () => {
        props.setSelectedArtist("");
      },
    },
    ...artists.map((a) => ({
      type: "item" as const,
      key: `artist-${a.name.replaceAll(" ", "-")}`,
      label: a.name,
      onSelect: () => {
        props.setSelectedArtist(a.name);
      },
    })),
  ];

  const dateItems: FilterDropdownItem[] = [
    {
      type: "item",
      key: "primary-sales",
      label: "Primary Sales",
      onSelect: () => props.setIsPrimary(true),
    },
    {
      type: "divider",
      key: "secondary-sales-divider",
    },
    {
      type: "header",
      key: "secondary-sales-header",
      label: "Secondary Sales",
    },
    ...Object.values(DateIntervalsSelection).map((dateSelection) => ({
      type: "item" as const,
      key: dateSelection,
      label: dateSelection,
      onSelect: () => {
        if (dateSelection === DateIntervalsSelection.CUSTOM_DATES) {
          setShowDatePicker(true);
        } else {
          props.setDateSelection(dateSelection);
        }
      },
    })),
    {
      type: "item",
      key: "custom-blocks",
      label: "Custom Blocks",
      onSelect: () => {
        setShowBlockPicker(true);
      },
    },
  ];
  const dateSelectionLabel = getDateSelectionLabel();

  return (
    <>
      <div className="tailwind-scope tw-container tw-mx-auto tw-px-3 tw-pt-4">
        <div className="tw-flex tw-items-center">
          <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            <span className="tw-flex tw-items-center tw-gap-2">
              <h1 className="tw-mb-0 tw-flex tw-items-center tw-gap-2 tw-text-xl tw-font-bold tw-text-white">
                Meme {props.title} {props.fetching && <DotLoader />}
              </h1>
            </span>
            <span className="tw-flex tw-items-center tw-gap-3">
              <button
                type="button"
                className={`tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg tw-font-bold tw-text-iron-400 tw-transition tw-duration-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMES
                    ? styles["collectionFocusActive"]
                    : styles["collectionFocus"]
                }`}
                onClick={() => {
                  router.push(
                    `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`
                  );
                }}
                aria-label="The Memes"
                aria-pressed={props.focus === GasRoyaltiesCollectionFocus.MEMES}
              >
                The Memes
              </button>
              <button
                type="button"
                className={`tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg tw-font-bold tw-text-iron-400 tw-transition tw-duration-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMELAB
                    ? styles["collectionFocusActive"]
                    : styles["collectionFocus"]
                }`}
                onClick={() =>
                  router.push(
                    `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMELAB}`
                  )
                }
                aria-label="Meme Lab"
                aria-pressed={
                  props.focus === GasRoyaltiesCollectionFocus.MEMELAB
                }
              >
                Meme Lab
              </button>
            </span>
          </div>
        </div>
        {props.description && (
          <div className="tw-pt-3">
            <div>{props.description}</div>
          </div>
        )}
        <div className="tw-pt-3">
          <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
            <span className="tw-min-h-6">
              {!props.fetching && props.results_count > 0 && (
                <DownloadUrlWidget
                  preview="Download"
                  name={getFileName()}
                  url={`${props.getUrl()}&download=true`}
                />
              )}
            </span>
            <span className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-4 sm:tw-gap-12">
              <GasRoyaltiesFilterDropdown
                label={`Artist: ${props.selected_artist || "All"}`}
                ariaLabel={`Artist: ${props.selected_artist || "All"}`}
                disabled={props.fetching}
                items={artistItems}
              />
              <GasRoyaltiesFilterDropdown
                label={dateSelectionLabel}
                ariaLabel={`Date selection: ${dateSelectionLabel}`}
                disabled={props.fetching}
                items={dateItems}
              />
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
      <span className="tailwind-scope tw-flex tw-items-center tw-justify-center tw-gap-3">
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
