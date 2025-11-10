import type { ReactNode } from "react";
import type {
  ContractOverview,
  Suggestion,
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
  tokenIdsRaw: readonly bigint[];
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
  readonly renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  readonly variant?: "card" | "flat";
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
