import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";
import type { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";
import type { TokenMetadata } from "@/types/nft";

export type ApiXtdhCollection = ApiXTdhCollectionsPage["data"][number];

export type ApiXtdhToken = ApiXTdhTokensPage["data"][number];

export interface XtdhCollectionTokensPanelProps {
  readonly identity: string | null;
  readonly contract: string | null;
  readonly normalizedContract: string | null;
  readonly collection?: ApiXtdhCollection | undefined;
  readonly onBack: () => void;
  readonly requireIdentity?: boolean | undefined;
}

export interface XtdhSelectedTokenDescriptor {
  readonly token: ApiXtdhToken;
  readonly metadata?: TokenMetadata | undefined;
  readonly isMetadataLoading: boolean;
  readonly hasMetadataError: boolean;
}

export interface XtdhTokensListProps {
  readonly tokens: ApiXTdhTokensPage["data"];
  readonly contractAddress: `0x${string}` | null;
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string | undefined;
  readonly onRetry: () => void;
  readonly onTokenSelect?:
    | ((descriptor: XtdhSelectedTokenDescriptor) => void)
    | undefined
    | undefined;
}

export interface UseXtdhTokensListStateParams
  extends Pick<
    XtdhTokensListProps,
    "tokens" | "isEnabled" | "isLoading" | "isError"
  > {}

export interface XtdhTokensListState {
  readonly isDisabled: boolean;
  readonly showInitialLoading: boolean;
  readonly showInitialError: boolean;
  readonly showEmptyState: boolean;
  readonly hasTokens: boolean;
}
