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
  contractAddress?: `0x${string}` | undefined;
  outputMode: "number";
};

export type NftPickerChange =
  | NftPickerSelection
  | NftPickerSelectionError
  | null;

type NftPickerOnChange = {
  // Bivariant to accept handlers that only handle the successful selection shape.
  bivarianceHack(output: NftPickerChange): void;
}["bivarianceHack"];

type NftPickerValue = {
  chain: SupportedChain;
  contractAddress?: `0x${string}` | undefined;
  selectedIds: Readonly<TokenSelection>;
  allSelected: boolean;
};

export type NftPickerProps = {
  readonly value?: NftPickerValue | undefined;
  readonly defaultValue?: Partial<NftPickerValue> | undefined;
  readonly onChange: NftPickerOnChange;
  readonly onContractChange?:
    | ((meta: ContractOverview | null) => void)
    | undefined;
  readonly chain?: SupportedChain | undefined;
  readonly outputMode?: OutputMode | undefined;
  readonly hideSpam?: boolean | undefined;
  readonly allowAll?: boolean | undefined;
  readonly allowRanges?: boolean | undefined;
  readonly debounceMs?: number | undefined;
  readonly overscan?: number | undefined;
  readonly placeholder?: string | undefined;
  readonly className?: string | undefined;
  readonly renderTokenExtra?:
    | ((tokenId: bigint, metadata?: TokenMetadata) => ReactNode)
    | undefined;
  readonly variant?: "card" | "flat" | undefined;
};

export type ParseError = {
  code?: string | undefined;
  input: string;
  index: number;
  length: number;
  message: string;
};
