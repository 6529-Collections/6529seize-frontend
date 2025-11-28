import { InlineRetry, ListError, ListMessage } from "./subcomponents/XtdhTokensFallbacks";
import { XtdhTokenListItem } from "./subcomponents/XtdhTokenListItem";
import { XtdhTokensSkeleton } from "./subcomponents/XtdhTokensSkeleton";
import { getTokenKey } from "./utils/getTokenKey";
import { useXtdhTokensListState } from "./hooks/useXtdhTokensListState";
import { useXtdhTokenMetadataMap } from "./useXtdhTokenMetadataMap";
import type { XtdhTokensListProps } from "./types";

export function XtdhTokensList({
  tokens,
  contractAddress,
  isEnabled,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onTokenSelect,
}: Readonly<XtdhTokensListProps>) {
  const {
    metadataMap,
    isFetching: isFetchingMetadata,
    hasError: hasMetadataError,
  } = useXtdhTokenMetadataMap(contractAddress, tokens);
  const {
    isDisabled,
    showInitialLoading,
    showInitialError,
    showEmptyState,
  } = useXtdhTokensListState({ tokens, isEnabled, isLoading, isError });

  if (isDisabled) {
    return (
      <ListMessage>
        Unable to load token details for this collection.
      </ListMessage>
    );
  }

  if (showInitialLoading) {
    return <XtdhTokensSkeleton />;
  }

  if (showInitialError) {
    return <ListError message={errorMessage} onRetry={onRetry} />;
  }

  if (showEmptyState) {
    return (
      <ListMessage>
        No individual token allocations were returned for this collection.
      </ListMessage>
    );
  }

  return (
    <div className="tw-space-y-3">
      <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
        {tokens.map((token) => {
          const decimalId = Number.isFinite(token.token)
            ? Math.trunc(token.token).toString()
            : "";
          const metadata = decimalId ? metadataMap.get(decimalId) : undefined;
          const isMetadataLoading = !!decimalId && !metadata && isFetchingMetadata;
          const metadataError = !!decimalId && !metadata && hasMetadataError;
          const handleSelect = () => {
            onTokenSelect?.({
              token,
              metadata,
              isMetadataLoading,
              hasMetadataError: metadataError,
            });
          };
          return (
            <XtdhTokenListItem
              key={getTokenKey(token)}
              token={token}
              metadata={metadata}
              isMetadataLoading={isMetadataLoading}
              hasMetadataError={metadataError}
              onSelect={handleSelect}
            />
          );
        })}
      </ul>
      {isError ? (
        <InlineRetry message={errorMessage} onRetry={onRetry} />
      ) : null}
    </div>
  );
}
