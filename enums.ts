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

export enum MEMES_SEASON {
  SZN1 = "SZN1",
  SZN2 = "SZN2",
  SZN3 = "SZN3",
  SZN4 = "SZN4",
  SZN5 = "SZN5",
  SZN6 = "SZN6",
  SZN7 = "SZN7",
  SZN8 = "SZN8",
  SZN9 = "SZN9",
  SZN10 = "SZN10",
  SZN11 = "SZN11",
  SZN12 = "SZN12",
}

export enum MemesSort {
  AGE = "Age",
  EDITION_SIZE = "Edition Size",
  MEME = "Meme",
  HODLERS = "Collectors",
  TDH = "TDH",
  UNIQUE_PERCENT = "Unique %",
  UNIQUE_PERCENT_EX_MUSEUM = "Unique % Exc. Museum",
  FLOOR_PRICE = "Floor Price",
  MARKET_CAP = "Market Cap",
  VOLUME = "Volume",
  HIGHEST_OFFER = "Highest Offer",
}

export const MEMES_EXTENDED_SORT = [
  "age",
  "edition_size",
  "meme",
  "hodlers",
  "tdh",
  "percent_unique",
  "percent_unique_cleaned",
  "floor_price",
  "market_cap",
  "total_volume_last_24_hours",
  "total_volume_last_7_days",
  "total_volume_last_1_month",
  "total_volume",
  "highest_offer",
] as const;

export enum MemeLabSort {
  AGE = "Age",
  EDITION_SIZE = "Edition Size",
  HODLERS = "Collectors",
  ARTISTS = "Artists",
  COLLECTIONS = "Collections",
  UNIQUE_PERCENT = "Unique %",
  UNIQUE_PERCENT_EX_MUSEUM = "Unique % Exc. Museum",
  FLOOR_PRICE = "Floor Price",
  MARKET_CAP = "Market Cap",
  VOLUME = "Volume",
  HIGHEST_OFFER = "Highest Offer",
}

export enum CommunityMembersSortOption {
  DISPLAY = "display",
  LEVEL = "level",
  TDH = "tdh",
  REP = "rep",
  NIC = "nic",
}

export enum AboutSection {
  MEMES = "the-memes",
  MEMES_CALENDAR = "memes-calendar",
  MEME_LAB = "meme-lab",
  GRADIENTS = "6529-gradient",
  FAQ = "faq",
  MISSION = "mission",
  RELEASE_NOTES = "release-notes",
  CONTACT_US = "contact-us",
  TERMS_OF_SERVICE = "terms-of-service",
  PRIVACY_POLICY = "privacy-policy",
  COOKIE_POLICY = "cookie-policy",
  LICENSE = "license",
  MINTING = "minting",
  APPLY = "apply",
  DATA_DECENTR = "data-decentralization",
  GDRC1 = "gdrc1",
  NFT_DELEGATION = "nft-delegation",
  PRIMARY_ADDRESS = "primary-address",
  ENS = "ens",
  SUBSCRIPTIONS = "subscriptions",
  NAKAMOTO_THRESHOLD = "nakamoto-threshold",
  COPYRIGHT = "copyright",
}

export enum GasRoyaltiesCollectionFocus {
  MEMES = "the-memes",
  MEMELAB = "meme-lab",
}

export enum LeaderboardFocus {
  TDH = "Cards Collected",
  INTERACTIONS = "Interactions",
}