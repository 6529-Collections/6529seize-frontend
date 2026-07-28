export const SOLIDITY_DECLARATION_PAGE_SIZE = 100;
export const SOLIDITY_DECLARATION_MAX_PAGE_SIZE = 100;
export const SOLIDITY_DECLARATION_MAX_QUERY_LENGTH = 200;

export type SolidityDeclarationSearchKind = "" | "function" | "event" | "error";
export type SolidityDeclarationSearchLocation =
  | ""
  | "definition"
  | "file-scope";

export interface SolidityGlobalDeclarationListItem {
  readonly definitionName?: string | undefined;
  readonly href: string;
  readonly key: string;
  readonly kind: "function" | "event" | "error";
  readonly name: string;
  readonly scope: string;
  readonly selectorOrTopic: string;
  readonly signature: string;
  readonly sourcePath: string;
  readonly syntheticGetter: boolean;
  readonly topLevel: boolean;
}

export interface SolidityDeclarationSearchQuery {
  readonly kind: SolidityDeclarationSearchKind;
  readonly limit: number;
  readonly location: SolidityDeclarationSearchLocation;
  readonly offset: number;
  readonly query: string;
  readonly scope: string;
}

export interface SolidityDeclarationSearchPage {
  readonly items: readonly SolidityGlobalDeclarationListItem[];
  readonly nextOffset: number | null;
  readonly reviewId: string;
  readonly sourceCommit: string;
  readonly total: number;
  readonly version: string;
}
