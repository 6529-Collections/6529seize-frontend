import type { ReactNode } from "react";

import type { TokenRange } from "@/components/nft-picker/NftPicker.types";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";

import type { ContractOverview, SupportedChain } from "@/types/nft";
import type { ApiXTdhGrantToken } from "@/generated/models/ApiXTdhGrantToken";
import type { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";

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
  readonly tdhRatePerTokenLabel?: ReactNode | undefined;
  readonly tdhRatePerTokenHint?: string | null | undefined;
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
  readonly tokens: ApiXTdhGrantToken[];
  readonly errorMessage: string;
  readonly onRetry: () => void;
  readonly contractAddress: `0x${string}` | null;
  readonly chain: SupportedChain | null;
  readonly grantId: string;
  readonly onEndReached?: (() => void) | undefined;
  readonly isFetchingNextPage: boolean;
}

export interface GrantItemContentProps {
  readonly contract: ContractOverview;
  readonly details: GrantDetails;
  readonly errorDetails?: string | null | undefined;
  readonly status: ApiXTdhGrantStatus;
  readonly validFrom?: number | string | null | undefined;
  readonly validTo?: number | string | null | undefined;

  readonly actions?: ReactNode | undefined;
}

export interface GrantItemErrorProps {
  readonly contractLabel: string;
  readonly details: GrantDetails;
  readonly errorDetails?: string | null | undefined;
  readonly status: ApiXTdhGrantStatus;
  readonly validFrom?: number | string | null | undefined;
  readonly validTo?: number | string | null | undefined;
}
