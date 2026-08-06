"use client";

import { ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME } from "@/components/about/AboutLayout";
import DatePickerModal from "@/components/datePickerModal/DatePickerModal";
import DownloadUrlWidget from "@/components/downloadUrlWidget/DownloadUrlWidget";
import {
  DATA_TABLE_HEADER_TEXT_CLASS_NAME,
  DATA_TABLE_INTERACTIVE_ROW_CLASS_NAME,
} from "@/components/utils/table/tableStyles";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
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
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import DotLoader from "../dotLoader/DotLoader";

export const GAS_ROYALTIES_PAGE_CONTAINER_CLASS_NAME = `tailwind-scope tw-container tw-mx-auto ${ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME}`;

export const GAS_ROYALTIES_TABLE_CLASS_NAME =
  "tw-mb-4 tw-min-w-full tw-border-collapse";

export const GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME = `tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-align-middle tw-font-semibold tw-text-iron-400 md:tw-px-4 md:tw-py-3 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`;

export const GAS_ROYALTIES_TABLE_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-align-middle tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-100 md:tw-px-4 md:tw-py-3 md:tw-text-sm";

export const GAS_ROYALTIES_TABLE_ROW_CLASS_NAME = `tw-group ${DATA_TABLE_INTERACTIVE_ROW_CLASS_NAME}`;

export const GAS_ROYALTIES_INFO_ICON_CLASS_NAME =
  "tw-h-[18px] tw-cursor-pointer tw-text-iron-400 tw-transition-colors hover:tw-text-iron-50";

const COLLECTION_FOCUS_ITEMS: CommonSelectItem<GasRoyaltiesCollectionFocus>[] =
  [
    {
      key: "collection-the-memes",
      label: "The Memes",
      value: GasRoyaltiesCollectionFocus.MEMES,
    },
    {
      key: "collection-meme-lab",
      label: "Meme Lab",
      value: GasRoyaltiesCollectionFocus.MEMELAB,
    },
  ];

const PRIMARY_SALES_SELECTION = "Primary Sales";
const CUSTOM_BLOCKS_SELECTION = "Custom Blocks";

type DateFilterSelection =
  | DateIntervalsSelection
  | typeof PRIMARY_SALES_SELECTION
  | typeof CUSTOM_BLOCKS_SELECTION;

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

  const artistItems: CommonSelectItem<string>[] = [
    {
      key: "artist-all",
      label: "All",
      value: "",
    },
    ...artists.map((a) => ({
      key: `artist-${a.name.replaceAll(" ", "-")}`,
      label: a.name,
      value: a.name,
    })),
  ];

  let activeDateSelection: DateFilterSelection = props.date_selection;
  if (props.is_primary) {
    activeDateSelection = PRIMARY_SALES_SELECTION;
  } else if (props.is_custom_blocks) {
    activeDateSelection = CUSTOM_BLOCKS_SELECTION;
  }
  const dateItems: CommonSelectItem<DateFilterSelection>[] = [
    {
      key: "primary-sales",
      label: PRIMARY_SALES_SELECTION,
      value: PRIMARY_SALES_SELECTION,
    },
    ...Object.values(DateIntervalsSelection).map((dateSelection) => ({
      key: `date-${dateSelection}`,
      label:
        dateSelection === activeDateSelection
          ? getDateSelectionLabel()
          : dateSelection,
      value: dateSelection,
    })),
    {
      key: "custom-blocks",
      label:
        activeDateSelection === CUSTOM_BLOCKS_SELECTION
          ? getDateSelectionLabel()
          : CUSTOM_BLOCKS_SELECTION,
      value: CUSTOM_BLOCKS_SELECTION,
    },
  ];

  const setDateFilter = (dateFilter: DateFilterSelection) => {
    if (dateFilter === PRIMARY_SALES_SELECTION) {
      props.setIsPrimary(true);
    } else if (dateFilter === CUSTOM_BLOCKS_SELECTION) {
      setShowBlockPicker(true);
    } else if (dateFilter === DateIntervalsSelection.CUSTOM_DATES) {
      setShowDatePicker(true);
    } else {
      props.setDateSelection(dateFilter);
    }
  };

  return (
    <>
      <div className={`${GAS_ROYALTIES_PAGE_CONTAINER_CLASS_NAME} tw-pt-4`}>
        <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-5">
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
            <h1 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
              Meme {props.title} {props.fetching && <DotLoader />}
            </h1>
            <div className="tw-w-fit tw-min-w-0 tw-max-w-full">
              <CommonTabs
                items={COLLECTION_FOCUS_ITEMS}
                activeItem={props.focus}
                setSelected={(focus) => {
                  router.push(`${pathname}?focus=${focus}`);
                }}
                filterLabel="Collection"
                fill={false}
                size="sm"
              />
            </div>
          </div>
          <div className="tw-flex tw-w-full tw-justify-start sm:tw-w-auto">
            <div className="tw-flex tw-w-full tw-flex-col tw-items-start tw-gap-y-3 sm:tw-w-auto sm:tw-flex-row sm:tw-items-center sm:tw-gap-x-5">
              <div className="tw-no-scrollbar tw-flex tw-max-w-full tw-flex-nowrap tw-items-start tw-gap-x-5 tw-overflow-x-auto tw-pb-1">
                <CommonDropdown
                  filterLabel="Artist"
                  disabled={props.fetching}
                  items={artistItems}
                  activeItem={props.selected_artist}
                  setSelected={props.setSelectedArtist}
                  size="sm"
                  variant="editorial"
                  showFilterLabel
                  menuMinWidth={224}
                />
                <CommonDropdown
                  filterLabel="Period"
                  disabled={props.fetching}
                  items={dateItems}
                  activeItem={activeDateSelection}
                  setSelected={setDateFilter}
                  size="sm"
                  variant="editorial"
                  showFilterLabel
                  menuMinWidth={224}
                />
              </div>
              {!props.fetching && props.results_count > 0 && (
                <div className="tw-flex-none [&>button]:tw-rounded-md [&>button]:tw-px-0.5 [&>button]:tw-py-1 [&>button]:tw-text-sm [&>button]:tw-font-semibold [&>button]:!tw-text-iron-300 hover:[&>button]:!tw-text-iron-100 focus-visible:[&>button]:tw-outline focus-visible:[&>button]:tw-outline-2 focus-visible:[&>button]:tw-outline-primary-400 [&_svg]:!tw-w-4 [&_svg]:!tw-text-current">
                  <DownloadUrlWidget
                    preview="Download"
                    name={getFileName()}
                    url={`${props.getUrl()}&download=true`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {props.description && (
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {props.description}
          </p>
        )}
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
      className="tw-block tw-w-fit tw-rounded-sm tw-text-iron-50 tw-no-underline tw-transition tw-duration-200 group-focus-within:tw-text-iron-300 group-hover:tw-text-iron-300 hover:tw-text-iron-300 hover:tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      <span className="tailwind-scope tw-flex tw-items-center tw-justify-start tw-gap-3">
        <span>{props.token_id} -</span>
        <Image
          unoptimized
          loading={"lazy"}
          width={0}
          height={0}
          style={{ width: "auto", height: "40px" }}
          src={props.thumbnail}
          alt={props.name}
          className="tw-block tw-max-w-16 tw-object-contain"
          data-tooltip-id={`token-image-${props.token_id}`}
        />
        {props.note && (
          <span>
            <FontAwesomeIcon
              className={GAS_ROYALTIES_INFO_ICON_CLASS_NAME}
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
