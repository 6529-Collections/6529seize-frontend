import type { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";

export type ApiXtdhToken = ApiXTdhTokensPage["data"][number];

export interface XtdhTokensListProps {
  readonly tokens: ApiXTdhTokensPage["data"];
  readonly contractAddress: `0x${string}` | null;
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly onRetry: () => void;
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
