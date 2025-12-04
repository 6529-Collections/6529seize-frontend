import type { ReactNode } from "react";
import type {
  SupportedChain,
  TokenMetadata,
  TokenRange,
} from "@/components/nft-picker/NftPicker.types";

export type TokenListAction = {
  label: string;
  onClick: (tokenId: bigint, metadata?: TokenMetadata) => void;
  getAriaLabel?: (tokenLabel: string) => string;
};

export type TokenWindowEntry = {
  tokenId: bigint;
  decimalId: string;
  xtdh?: number;
};

export interface VirtualizedTokenListProps {
  readonly contractAddress?: `0x${string}`;
  readonly chain: SupportedChain | null;
  readonly ranges: TokenRange[];
  readonly scrollKey: string;
  readonly overscan?: number;
  readonly renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  readonly action?: TokenListAction;
  readonly className?: string;
  readonly scrollContainerClassName?: string;
  readonly rowClassName?: string;
  readonly footerContent?: ReactNode;
  readonly footerClassName?: string;
  readonly emptyState?: ReactNode;
  readonly onEndReached?: (info: { lastVisibleIndex: number; totalCount: number }) => void;
  readonly endReachedOffset?: number;
  readonly layout?: "list" | "grid";
  readonly columns?: number;

  readonly tokens?: readonly { tokenId: bigint; xtdh: number }[];
}

export type VirtualizedTokenListContentProps = Readonly<
  Omit<VirtualizedTokenListProps, "emptyState"> & { totalCount: number; emptyState: ReactNode }
>;
