import type { ReactNode } from "react";
import type {
  ContractOverview,
  SupportedChain,
  TokenMetadata,
} from "@/types/nft";

export type {
  ContractOverview,
  Suggestion,
  SupportedChain,
  TokenMetadata,
} from "@/types/nft";

export type OutputMode = "number" | "bigint";

export type TokenRange = { start: bigint; end: bigint };

export type TokenSelection = bigint[];

type BaseSelection = {
  contractAddress: `0x${string}`;
  allSelected: boolean;
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

// Emitted when the picker cannot safely emit number output because token IDs exceed Number.MAX_SAFE_INTEGER.
export type NftPickerSelectionError = {
  type: "error";
  error: string;
  unsafeCount: number;
  contractAddress?: `0x${string}`;
  outputMode: "number";
};

export type NftPickerChange = NftPickerSelection | NftPickerSelectionError | null;

export type NftPickerOnChange = {
  // Bivariant to accept handlers that only handle the successful selection shape.
  bivarianceHack(output: NftPickerChange): void;
}["bivarianceHack"];

export type NftPickerValue = {
  chain: SupportedChain;
  contractAddress?: `0x${string}`;
  selectedIds: Readonly<TokenSelection>;
  allSelected: boolean;
};

export type NftPickerProps = {
  readonly value?: NftPickerValue;
  readonly defaultValue?: Partial<NftPickerValue>;
  readonly onChange: NftPickerOnChange;
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
  readonly renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  readonly variant?: "card" | "flat";
};

export type ParseErrorArray = ParseError[] & { message: string; name: string };
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
  tokenId: bigint;
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
