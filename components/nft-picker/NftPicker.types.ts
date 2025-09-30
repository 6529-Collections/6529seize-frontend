import type { ReactNode } from "react";

export type SupportedChain = "ethereum";

export type OutputMode = "number" | "bigint";

export type TokenIdBigInt = bigint;

export type TokenRange = { start: TokenIdBigInt; end: TokenIdBigInt };

export type TokenSelection = TokenIdBigInt[];

export type Suggestion = {
  address: `0x${string}`;
  name?: string;
  symbol?: string;
  tokenType?: "ERC721" | "ERC1155";
  totalSupply?: string;
  floorPriceEth?: number | null;
  imageUrl?: string | null;
  isSpam?: boolean;
  safelist?: "verified" | "approved" | "requested" | "not_requested" | undefined;
  deployer?: `0x${string}` | null;
};

export type ContractOverview = Suggestion & {
  description?: string | null;
  bannerImageUrl?: string | null;
};

export type TokenMetadata = {
  tokenId: TokenIdBigInt;
  tokenIdRaw: string;
  name?: string | null;
  imageUrl?: string | null;
  isSpam?: boolean;
};

export type NftPickerSelection =
  | {
      contractAddress: `0x${string}`;
      outputMode: "number";
      tokenIds: number[];
      tokenIdsRaw: TokenIdBigInt[];
    }
  | {
      contractAddress: `0x${string}`;
      outputMode: "bigint";
      tokenIds: string[];
      tokenIdsRaw: TokenIdBigInt[];
    };

export type NftPickerValue = {
  chain: SupportedChain;
  contractAddress?: `0x${string}`;
  selectedIds: TokenSelection;
  allSelected: boolean;
};

export type NftPickerProps = {
  value?: NftPickerValue;
  defaultValue?: Partial<NftPickerValue>;
  onChange: (output: NftPickerSelection | null) => void;
  onContractChange?: (meta: ContractOverview | null) => void;
  chain?: SupportedChain;
  outputMode?: OutputMode;
  hideSpam?: boolean;
  allowAll?: boolean;
  allowRanges?: boolean;
  debounceMs?: number;
  overscan?: number;
  placeholder?: string;
  className?: string;
  renderTokenExtra?: (tokenId: TokenIdBigInt, metadata?: TokenMetadata) => ReactNode;
};

export type ParseError = {
  input: string;
  index: number;
  length: number;
  message: string;
};

export type CanonicalTokenState = {
  ids: TokenSelection;
  ranges: TokenRange[];
};

export type TokenListRow = {
  tokenId: TokenIdBigInt;
  range?: TokenRange;
};

export type SearchQueryParams = {
  query: string;
  chain?: SupportedChain;
  hideSpam?: boolean;
};

export type TokenMetadataRequest = {
  address: `0x${string}`;
  tokenIds: readonly string[];
  chain?: SupportedChain;
};
