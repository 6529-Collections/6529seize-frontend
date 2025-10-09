export type XtdhView = "collections" | "tokens";

export type XtdhCollectionsSort =
  | "total_rate"
  | "total_allocated"
  | "recent"
  | "grantors"
  | "name";

export type XtdhTokensSort =
  | "rate"
  | "recent"
  | "grantors"
  | "collection"
  | "name";

export type XtdhSortDirection = "asc" | "desc";

export interface XtdhFilterState<SortValue extends string> {
  readonly sort: SortValue;
  readonly direction: XtdhSortDirection;
  readonly networks: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
  readonly showMyGrants: boolean;
  readonly showMyReceiving: boolean;
}

export interface XtdhCollectionsViewState extends XtdhFilterState<XtdhCollectionsSort> {
  readonly page: number;
}

export interface XtdhTokensViewState extends XtdhFilterState<XtdhTokensSort> {
  readonly page: number;
}
