import type { ReactNode } from "react";

import type { TokenRange } from "@/components/nft-picker/NftPicker.types";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";

import type { SupportedChain } from "@/types/nft";

export interface UserPageXtdhGrantListItemProps {
  readonly grant: ApiXTdhGrant;
  readonly isSelf: boolean;
}

export interface GrantDetails {
  readonly tokenTypeLabel: ReactNode;
  readonly totalSupplyLabel: ReactNode;
  readonly floorPriceLabel: ReactNode;
  readonly tokensCountLabel: ReactNode;
  readonly tdhRateLabel: ReactNode;
  readonly tdhRatePerTokenLabel?: ReactNode;
  readonly tdhRatePerTokenHint?: string | null;
  readonly totalGrantedLabel: ReactNode;
  readonly validFromLabel: ReactNode;

}

export type GrantItemVariant = "contract" | "error";

export type TokenPanelState =
  | { type: "all" }
  | { type: "count"; label: string; count: number }
  | { type: "unknown"; label: string };

export interface GrantTokensDisclosureState {
  readonly showInitialLoading: boolean;
  readonly showInitialError: boolean;
  readonly tokenRanges: TokenRange[];
  readonly tokens: readonly import("@/generated/models/ApiXTdhGrantToken").ApiXTdhGrantToken[];
  readonly errorMessage: string;
  readonly onRetry: () => void;
  readonly contractAddress: `0x${string}` | null;
  readonly chain: SupportedChain | null;
  readonly grantId: string;
  readonly onEndReached?: () => void;
  readonly isFetchingNextPage: boolean;
}

export interface GrantItemContentProps {
  readonly contract: import("@/types/nft").ContractOverview;
  readonly details: GrantDetails;
  readonly errorDetails?: string | null;
  readonly status: import("@/generated/models/ApiXTdhGrantStatus").ApiXTdhGrantStatus;
  readonly validFrom?: number | string | null;
  readonly validTo?: number | string | null;

  readonly actions?: ReactNode;
}

export interface GrantItemErrorProps {
  readonly contractLabel: string;
  readonly details: GrantDetails;
  readonly errorDetails?: string | null;
  readonly status: import("@/generated/models/ApiXTdhGrantStatus").ApiXTdhGrantStatus;
  readonly validFrom?: number | string | null;
  readonly validTo?: number | string | null;
}
