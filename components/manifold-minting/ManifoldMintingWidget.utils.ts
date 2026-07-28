import { MEMES_CONTRACT } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function getTransactionModalTitle(
  locale: SupportedLocale,
  contract: string,
  tokenId: number | undefined
): string {
  const hasMemeTokenId =
    areEqualAddresses(contract, MEMES_CONTRACT) &&
    typeof tokenId === "number" &&
    Number.isSafeInteger(tokenId) &&
    tokenId > 0;

  return hasMemeTokenId
    ? t(locale, "theMemes.mint.transaction.titleWithTokenId", { tokenId })
    : t(locale, "theMemes.mint.transaction.title");
}
