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

type BaseSelection = {
  contractAddress: `0x${string}`;
  allSelected: boolean;
  tokenIdsRaw: readonly TokenIdBigInt[];
};

export type NftPickerSelection =
  | (BaseSelection & {
      outputMode: "number";
      tokenIds: readonly number[];
    })
  | (BaseSelection & {
      outputMode: "bigint";
      tokenIds: readonly string[];
    });

export type NftSelectionOutput = NftPickerSelection;

export type NftPickerValue = {
  chain: SupportedChain;
  contractAddress?: `0x${string}`;
  selectedIds: Readonly<TokenSelection>;
  allSelected: boolean;
};

export type NftPickerProps = {
  readonly value?: NftPickerValue;
  readonly defaultValue?: Partial<NftPickerValue>;
  readonly onChange: (output: NftPickerSelection | null) => void;
  readonly onContractChange?: (meta: ContractOverview | null) => void;
  readonly chain?: SupportedChain;
  readonly outputMode?: OutputMode;
  readonly hideSpam?: boolean;
  readonly allowAll?: boolean;
  readonly allowRanges?: boolean;
  readonly debounceMs?: number;
  readonly overscan?: number;
  readonly placeholder?: string;
  readonly className?: string;
  readonly renderTokenExtra?: (tokenId: TokenIdBigInt, metadata?: TokenMetadata) => ReactNode;
};

export type ParseError = {
  code?: string;
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
