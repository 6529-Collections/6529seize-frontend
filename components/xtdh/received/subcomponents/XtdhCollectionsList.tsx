import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";

import { EmptyState } from "@/components/common/EmptyState";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  readonly onSelectCollection?: ((contract: string | null) => void) | undefined;
  readonly isIdentityScoped?: boolean | undefined;
  readonly searchTerm?: string | undefined;
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
  searchTerm = "",
}: Readonly<XtdhCollectionsListProps>) {
  const locale = useBrowserLocale();
  const targetLabel = isIdentityScoped ? "this identity" : "the ecosystem";
  const normalizedSearchTerm = searchTerm.trim();
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
    if (normalizedSearchTerm) {
      return (
        <EmptyState
          title={t(locale, "xtdh.collections.search.emptyTitle", {
            query: normalizedSearchTerm,
          })}
          message={t(locale, "xtdh.collections.search.emptyDescription")}
        />
      );
    }

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
      <ul className="tw-m-0 tw-flex tw-flex-col tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
        {collections.map((collection, index) => (
          <XtdhReceivedCollectionCard
            key={getCollectionKey(collection, index)}
            collection={collection}
            onSelect={onSelectCollection}
            isSelected={
              normalizedSelected !== null &&
              collection.contract.trim().toLowerCase() === normalizedSelected
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
  const locale = useBrowserLocale();

  return (
    <div>
      <output className="tw-sr-only" aria-live="polite">
        {t(locale, "xtdh.collections.loading")}
      </output>
      <ul
        aria-hidden="true"
        className="tw-m-0 tw-flex tw-flex-col tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0"
      >
        {SKELETON_INDICES.map((index) => (
          <li
            key={`skeleton-${index}`}
            data-testid="xtdh-collection-skeleton"
            className="tw-w-full tw-list-none tw-overflow-hidden tw-rounded-b-xl tw-px-6 tw-py-6 motion-safe:tw-animate-pulse"
          >
            <div className="tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-x-3 tw-gap-y-6 md:tw-flex-row">
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center">
                <div
                  data-xtdh-skeleton-thumbnail=""
                  className="tw-h-16 tw-w-16 tw-shrink-0 tw-rounded-lg tw-bg-iron-800"
                />
                <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
                  <div className="tw-h-6 tw-w-32 tw-rounded tw-bg-iron-800" />
                  <div className="tw-bg-iron-850 tw-h-6 tw-w-40 tw-rounded" />
                </div>
              </div>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                <div className="tw-h-5 tw-w-24 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-5 tw-w-40 tw-rounded tw-bg-iron-800" />
              </div>
            </div>
            <div
              data-xtdh-skeleton-metrics=""
              className="tw-mb-0 tw-mt-6 tw-grid tw-gap-x-6 tw-gap-y-4 sm:tw-grid-cols-2 md:tw-ml-20 md:tw-mt-4 md:tw-grid-cols-3"
            >
              {SKELETON_METRIC_KEYS.map((metricKey) => (
                <div key={metricKey} className="tw-space-y-1.5">
                  <div className="tw-h-4 tw-w-20 tw-rounded tw-bg-iron-800" />
                  <div className="tw-bg-iron-850 tw-h-6 tw-w-24 tw-rounded" />
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
  { length: 6 },
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
