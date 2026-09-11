import {
  DATA_TABLE_HEADER_TEXT_CLASS_NAME,
  DATA_TABLE_INTERACTIVE_ROW_CLASS_NAME,
} from "@/components/utils/table/tableStyles";

export const LEADERBOARD_TABLE_CLASS_NAME =
  "tw-mb-0 tw-w-full tw-border-collapse";

export const LEADERBOARD_ROW_CLASS_NAME = `tw-group ${DATA_TABLE_INTERACTIVE_ROW_CLASS_NAME}`;

export const LEADERBOARD_HEADER_CELL_CLASS_NAME = `tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-align-middle tw-font-semibold tw-text-iron-400 md:tw-px-4 md:tw-py-3 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`;

export const LEADERBOARD_BODY_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-align-middle tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-100 md:tw-px-4 md:tw-py-3 md:tw-text-sm";

export const LEADERBOARD_HEADER_CONTENT_CLASS_NAME =
  "tw-flex tw-items-center tw-justify-center";
