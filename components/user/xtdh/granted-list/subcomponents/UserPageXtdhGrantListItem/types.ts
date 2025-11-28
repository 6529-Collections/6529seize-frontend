import type { ReactNode } from "react";

import type { TokenRange } from "@/components/nft-picker/NftPicker.types";
import type { ApiTdhGrant } from "@/generated/models/ApiTdhGrant";

import type { SupportedChain } from "@/types/nft";

export interface UserPageXtdhGrantListItemProps {
  readonly grant: ApiTdhGrant;
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
  readonly validFromLabel: ReactNode;
  readonly validUntilLabel: ReactNode;
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
  readonly status: import("@/generated/models/ApiTdhGrantStatus").ApiTdhGrantStatus;
  readonly validFrom?: number | string | null;
  readonly validTo?: number | string | null;

  readonly actions?: ReactNode;
}

export interface GrantItemErrorProps {
  readonly contractLabel: string;
  readonly details: GrantDetails;
  readonly errorDetails?: string | null;
  readonly status: import("@/generated/models/ApiTdhGrantStatus").ApiTdhGrantStatus;
  readonly validFrom?: number | string | null;
  readonly validTo?: number | string | null;
}
