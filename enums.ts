export enum WalletView {
  CONSOLIDATION = "Consolidation",
  WALLET = "Wallet",
}

export enum DateIntervalsSelection {
  TODAY = "Today",
  YESTERDAY = "Yesterday",
  LAST_7 = "Last 7 Days",
  THIS_MONTH = "Month to Date",
  PREVIOUS_MONTH = "Last Month",
  YEAR_TO_DATE = "Year to Date",
  LAST_YEAR = "Last Year",
  ALL = "All",
  CUSTOM_DATES = "Custom Dates",
}

export type DateIntervalsWithBlocksSelectionType = {
  [key in keyof typeof DateIntervalsSelection | "CUSTOM_BLOCKS"]: string;
};

export const DateIntervalsWithBlocksSelection: DateIntervalsWithBlocksSelectionType =
  {
    ...DateIntervalsSelection,
    CUSTOM_BLOCKS: "Custom Blocks",
  };
