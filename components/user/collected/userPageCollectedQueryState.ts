import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "@/entities/IProfile";
import type { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import {
  COLLECTED_COLLECTIONS_META,
  convertAddressToLowerCase,
} from "./filters/user-page-collected-filters.helpers";

export interface ProfileCollectedFilters {
  readonly handleOrWallet: string;
  readonly accountForConsolidations: boolean;
  readonly collection: CollectedCollectionType | null;
  readonly subcollection: string | null;
  readonly seized: CollectionSeized | null;
  readonly szn: MemeSeason | null;
  readonly initialSznId: number | null;
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy: CollectionSort;
  readonly sortDirection: SortDirection;
}

export interface QueryUpdateInput {
  name: keyof typeof SEARCH_PARAMS_FIELDS;
  value: string | null;
}

interface NormalizedCollectedQueryState {
  address: string | null;
  collection: CollectedCollectionType | null;
  subcollection: string | null;
  seized: CollectionSeized | null;
  sznId: number | null;
  page: number;
  sortBy: CollectionSort;
  sortDirection: SortDirection;
}

export const SEARCH_PARAMS_FIELDS = {
  address: "address",
  collection: "collection",
  subcollection: "subcollection",
  seized: "seized",
  szn: "szn",
  page: "page",
  sortBy: "sort-by",
  sortDirection: "sort-direction",
} as const;

const DEFAULT_SORT_BY = CollectionSort.TOKEN_ID;
export const DEFAULT_SORT_DIRECTION = SortDirection.DESC;
export const DEFAULT_SEIZED = CollectionSeized.SEIZED;
export const PAGE_SIZE = 24;
const COLLECTION_VALUES = Object.values(CollectedCollectionType);
const SEIZED_VALUES = Object.values(CollectionSeized);
const SORT_VALUES = Object.values(CollectionSort);
const SORT_DIRECTION_VALUES = Object.values(SortDirection);

const getDefaultSortBy = (
  collection: CollectedCollectionType | null
): CollectionSort =>
  collection === CollectedCollectionType.NETWORK
    ? CollectionSort.XTDH
    : DEFAULT_SORT_BY;

export const convertSeized = ({
  seized,
  collection,
}: {
  readonly seized: string | null;
  readonly collection: CollectedCollectionType | null;
}): CollectionSeized | null => {
  if (collection === null) return DEFAULT_SEIZED;
  if (!COLLECTED_COLLECTIONS_META[collection].filters.seized) {
    return DEFAULT_SEIZED;
  }
  if (seized === null) return null;
  const normalizedSeized = seized.toUpperCase() as CollectionSeized;
  return SEIZED_VALUES.includes(normalizedSeized) ? normalizedSeized : null;
};

export const convertSznId = ({
  szn,
  collection,
}: {
  readonly szn: string | null;
  readonly collection: CollectedCollectionType | null;
}): number | null => {
  if (collection === null) return null;
  if (!COLLECTED_COLLECTIONS_META[collection].filters.szn) return null;
  if (szn === null) return null;
  const parsed = Number.parseInt(szn, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const convertCollection = (
  collection: string | null
): CollectedCollectionType | null => {
  if (collection === null) return null;
  const normalizedCollection =
    collection.toUpperCase() as CollectedCollectionType;
  return COLLECTION_VALUES.includes(normalizedCollection)
    ? normalizedCollection
    : null;
};

export const convertSortedBy = ({
  sortBy,
  collection,
}: {
  readonly sortBy: string | null;
  readonly collection: CollectedCollectionType | null;
}): CollectionSort => {
  const defaultCollectionSortBy = getDefaultSortBy(collection);
  if (sortBy === null) return defaultCollectionSortBy;
  const normalizedSortBy = sortBy.toUpperCase() as CollectionSort;
  if (
    collection !== null &&
    !COLLECTED_COLLECTIONS_META[collection].filters.sort.includes(
      normalizedSortBy
    )
  ) {
    return defaultCollectionSortBy;
  }
  return SORT_VALUES.includes(normalizedSortBy)
    ? normalizedSortBy
    : defaultCollectionSortBy;
};

export const convertSortDirection = (
  sortDirection: string | null
): SortDirection => {
  if (sortDirection === null) return DEFAULT_SORT_DIRECTION;
  const normalizedSortDirection = sortDirection.toUpperCase() as SortDirection;
  return SORT_DIRECTION_VALUES.includes(normalizedSortDirection)
    ? normalizedSortDirection
    : DEFAULT_SORT_DIRECTION;
};

export const normalizePageNumber = (page: number): number =>
  Number.isFinite(page) && page > 0 ? page : 1;

export const setCanonicalCollectedQueryParams = ({
  normalizedParams,
  state,
}: {
  readonly normalizedParams: URLSearchParams;
  readonly state: NormalizedCollectedQueryState;
}) => {
  if (state.address !== null)
    normalizedParams.set(SEARCH_PARAMS_FIELDS.address, state.address);
  if (state.collection !== null)
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.collection,
      state.collection.toLowerCase()
    );
  if (state.subcollection !== null)
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.subcollection,
      state.subcollection.toLowerCase()
    );
  if (
    state.collection !== null &&
    COLLECTED_COLLECTIONS_META[state.collection].filters.seized &&
    state.seized !== null
  )
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.seized,
      state.seized.toLowerCase()
    );
  if (
    state.collection !== null &&
    COLLECTED_COLLECTIONS_META[state.collection].filters.szn &&
    state.sznId !== null
  )
    normalizedParams.set(SEARCH_PARAMS_FIELDS.szn, state.sznId.toString());
  if (state.page > 1)
    normalizedParams.set(SEARCH_PARAMS_FIELDS.page, state.page.toString());
  if (state.sortBy !== getDefaultSortBy(state.collection))
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.sortBy,
      state.sortBy.toLowerCase()
    );
  if (state.sortDirection !== DEFAULT_SORT_DIRECTION)
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.sortDirection,
      state.sortDirection.toLowerCase()
    );
};

export const getNormalizedCollectedQueryStateFromFilters = (
  filters: ProfileCollectedFilters
): NormalizedCollectedQueryState => ({
  address: filters.accountForConsolidations
    ? null
    : convertAddressToLowerCase(filters.handleOrWallet),
  collection: filters.collection,
  subcollection:
    filters.collection === CollectedCollectionType.NETWORK
      ? filters.subcollection
      : null,
  seized: convertSeized({
    seized: filters.seized,
    collection: filters.collection,
  }),
  sznId: filters.szn?.id ?? filters.initialSznId,
  page: normalizePageNumber(filters.page),
  sortBy: convertSortedBy({
    sortBy: filters.sortBy,
    collection: filters.collection,
  }),
  sortDirection: convertSortDirection(filters.sortDirection),
});

export const applyQueryUpdateItemsToState = ({
  state,
  updateItems,
}: {
  readonly state: NormalizedCollectedQueryState;
  readonly updateItems: QueryUpdateInput[];
}): NormalizedCollectedQueryState => {
  const nextState: NormalizedCollectedQueryState = { ...state };
  for (const { name, value } of updateItems) {
    switch (name) {
      case "address":
        nextState.address = convertAddressToLowerCase(value);
        break;
      case "collection":
        nextState.collection = convertCollection(value);
        nextState.subcollection =
          nextState.collection === CollectedCollectionType.NETWORK
            ? nextState.subcollection
            : null;
        nextState.seized = convertSeized({
          seized: nextState.seized,
          collection: nextState.collection,
        });
        nextState.sznId = convertSznId({
          szn: nextState.sznId?.toString() ?? null,
          collection: nextState.collection,
        });
        nextState.sortBy = convertSortedBy({
          sortBy: nextState.sortBy,
          collection: nextState.collection,
        });
        break;
      case "subcollection":
        nextState.subcollection =
          nextState.collection === CollectedCollectionType.NETWORK
            ? value
            : null;
        break;
      case "seized":
        nextState.seized = convertSeized({
          seized: value,
          collection: nextState.collection,
        });
        break;
      case "szn":
        nextState.sznId = convertSznId({
          szn: value,
          collection: nextState.collection,
        });
        break;
      case "page":
        nextState.page = normalizePageNumber(
          value ? Number.parseInt(value, 10) : 1
        );
        break;
      case "sortBy":
        nextState.sortBy = convertSortedBy({
          sortBy: value,
          collection: nextState.collection,
        });
        break;
      case "sortDirection":
        nextState.sortDirection = convertSortDirection(value);
        break;
      default:
        break;
    }
  }
  return nextState;
};
