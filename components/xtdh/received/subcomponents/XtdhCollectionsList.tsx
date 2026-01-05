import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";

import { EmptyState } from "@/components/common/EmptyState";
import {
  InlineRetry,
  ListError,
  ListMessage,
} from "../collection-tokens/subcomponents/XtdhTokensFallbacks";
import { XtdhReceivedCollectionCard } from "../collection-card-content";

type ApiXtdhCollection = Omit<
  ApiXTdhCollectionsPage["data"][number],
  "contract"
> & {
  readonly contract?: string | null | undefined;
};

interface XtdhCollectionsListProps {
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly collections: ApiXTdhCollectionsPage["data"];
  readonly errorMessage?: string | undefined;
  readonly onRetry: () => void;
  readonly selectedContract?: string | null | undefined;
  readonly onSelectCollection?:
    | ((contract: string | null) => void)
    | undefined
    | undefined;
  readonly isIdentityScoped?: boolean | undefined;
}

export function XtdhCollectionsList({
  isEnabled,
  isLoading,
  isError,
  collections,
  errorMessage,
  onRetry,
  selectedContract,
  onSelectCollection,
  isIdentityScoped = true,
}: Readonly<XtdhCollectionsListProps>) {
  const targetLabel = isIdentityScoped ? "this identity" : "the ecosystem";
  if (!isEnabled) {
    return (
      <ListMessage>
        Unable to load xTDH collections for {targetLabel}.
      </ListMessage>
    );
  }

  const showInitialLoading = isLoading && collections.length === 0;
  if (showInitialLoading) {
    return <CollectionsSkeleton />;
  }

  const showInitialError = isError && collections.length === 0;
  if (showInitialError) {
    return (
      <ListError
        message={errorMessage ?? "Failed to load received collections."}
        onRetry={onRetry}
      />
    );
  }

  if (!collections.length) {
    return (
      <EmptyState
        title={isIdentityScoped ? "No xTDH received" : "No collections found"}
        message={
          isIdentityScoped
            ? "This identity will automatically accrue xTDH by holding eligible tokens from collections receiving grants."
            : "No xTDH collections to show yet. When grants are issued, collections receiving xTDH will appear here."
        }
      />
    );
  }

  const normalizedSelected = selectedContract?.trim().toLowerCase() ?? null;

  return (
    <div>
      <ul className="tw-m-0 tw-p-0 tw-flex tw-flex-col tw-divide-y tw-divide-iron-800 tw-divide-x-0 tw-divide-solid">
        {collections.map((collection, index) => (
          <XtdhReceivedCollectionCard
            key={getCollectionKey(collection, index)}
            collection={collection}
            onSelect={onSelectCollection}
            isSelected={
              normalizedSelected !== null &&
              (collection.contract?.trim().toLowerCase() ?? null) ===
                normalizedSelected
            }
          />
        ))}
      </ul>
      {isError ? (
        <InlineRetry
          message={errorMessage ?? "Unable to load more collections."}
          onRetry={onRetry}
        />
      ) : null}
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="tw-px-6 tw-pb-6">
      <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
        {SKELETON_INDICES.map((index) => (
          <li
            key={`skeleton-${index}`}
            className="tw-list-none tw-animate-pulse tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4"
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-h-14 tw-w-14 tw-rounded-lg tw-bg-iron-800" />
              <div className="tw-flex-1 tw-space-y-2">
                <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-3 tw-w-48 tw-rounded tw-bg-iron-850" />
              </div>
            </div>
            <div className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
              {SKELETON_METRIC_KEYS.map((metricKey) => (
                <div key={metricKey} className="tw-space-y-2">
                  <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
                  <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-850" />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SKELETON_INDICES = [0, 1, 2];
const SKELETON_METRIC_KEYS = Array.from(
  { length: 9 },
  (_, index) => `metric-${index}`
);

function getCollectionKey(
  collection: ApiXtdhCollection,
  fallbackIndex: number
) {
  const normalizedContract = collection.contract?.trim().toLowerCase();
  if (normalizedContract) {
    return normalizedContract;
  }

  return [
    "fallback",
    fallbackIndex,
    collection.xtdh,
    collection.xtdh_rate,
    collection.total_token_count,
    collection.active_token_count,
    collection.total_contributor_count,
    collection.active_contributor_count,
  ].join("-");
}
