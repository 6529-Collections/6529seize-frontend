"use client";

import { type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { RememeSort, TokenType } from "./rememesTypes";

function assertUnhandled(value: never, label: string): never {
  throw new Error(`Unhandled ${label}: ${String(value)}`);
}

export function getRememeSortLabel(
  sort: RememeSort,
  locale: SupportedLocale
): string {
  switch (sort) {
    case RememeSort.RANDOM:
      return t(locale, "rememes.sort.random");
    case RememeSort.CREATED_ASC:
      return t(locale, "rememes.sort.recentlyAdded");
    default:
      return assertUnhandled(sort, "RememeSort");
  }
}

export function getRememeTokenTypeLabel(
  tokenType: TokenType,
  locale: SupportedLocale
): string {
  switch (tokenType) {
    case TokenType.ALL:
      return t(locale, "rememes.tokenType.all");
    case TokenType.ERC721:
      return t(locale, "rememes.tokenType.erc721");
    case TokenType.ERC1155:
      return t(locale, "rememes.tokenType.erc1155");
    default:
      return assertUnhandled(tokenType, "TokenType");
  }
}
