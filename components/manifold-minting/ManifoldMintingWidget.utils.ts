import { MEMES_CONTRACT } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MintReceipt } from "./ManifoldMintingSuccess";

export interface MintArtwork {
  readonly name: string;
  readonly imageUrl?: string | undefined;
}

export function createMintReceipt({
  locale,
  contract,
  tokenId,
  quantity,
  recipient,
  artwork,
}: Readonly<{
  locale: SupportedLocale;
  contract: string;
  tokenId: number | undefined;
  quantity: number;
  recipient: string;
  artwork?: MintArtwork | undefined;
}>): MintReceipt {
  let collectionLabel: string | undefined;
  if (areEqualAddresses(contract, MEMES_CONTRACT)) {
    collectionLabel =
      typeof tokenId === "number" &&
      Number.isSafeInteger(tokenId) &&
      tokenId > 0
        ? t(locale, "theMemes.mint.transaction.collectionWithTokenId", {
            tokenId,
          })
        : t(locale, "theMemes.mint.transaction.collection");
  }
  const artworkName =
    typeof artwork?.name === "string" ? artwork.name.trim() : undefined;
  const hasArtworkName = artworkName !== undefined && artworkName.length > 0;
  return {
    quantity,
    recipient,
    artworkName: hasArtworkName
      ? artworkName
      : (collectionLabel ??
        t(locale, "theMemes.mint.transaction.genericArtwork")),
    imageUrl:
      typeof artwork?.imageUrl === "string"
        ? artwork.imageUrl.trim()
        : undefined,
    collectionLabel: hasArtworkName ? collectionLabel : undefined,
  };
}

export function normalizeMintCount(
  value: number | string | null | undefined
): number {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value ?? 0);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

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
