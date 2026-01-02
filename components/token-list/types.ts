import type { ReactNode } from "react";
import type {
  SupportedChain,
  TokenMetadata,
  TokenRange,
} from "@/components/nft-picker/NftPicker.types";

export type TokenListAction = {
  label: string;
  onClick: (tokenId: bigint, metadata?: TokenMetadata) => void;
  getAriaLabel?: ((tokenLabel: string) => string) | undefined;
};

export type TokenWindowEntry = {
  tokenId: bigint;
  decimalId: string;
  xtdh?: number | undefined;
};

export interface VirtualizedTokenListProps {
  readonly contractAddress?: `0x${string}` | undefined;
  readonly chain: SupportedChain | null;
  readonly ranges: TokenRange[];
  readonly scrollKey: string;
  readonly overscan?: number | undefined;
  readonly renderTokenExtra?:
    | ((tokenId: bigint, metadata?: TokenMetadata) => ReactNode)
    | undefined
    | undefined;
  readonly action?: TokenListAction | undefined;
  readonly className?: string | undefined;
  readonly scrollContainerClassName?: string | undefined;
  readonly rowClassName?: string | undefined;
  readonly footerContent?: ReactNode | undefined;
  readonly footerClassName?: string | undefined;
  readonly emptyState?: ReactNode | undefined;
  readonly onEndReached?:
    | ((info: { lastVisibleIndex: number; totalCount: number }) => void)
    | undefined
    | undefined;
  readonly endReachedOffset?: number | undefined;
  readonly layout?: "list" | "grid" | undefined;
  readonly columns?: number | undefined;

  readonly tokens?: readonly { tokenId: bigint; xtdh: number }[] | undefined;
}

export type VirtualizedTokenListContentProps = Readonly<
  Omit<VirtualizedTokenListProps, "emptyState"> & {
    totalCount: number;
    emptyState: ReactNode;
  }
>;
