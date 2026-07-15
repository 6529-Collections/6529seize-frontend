import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { BaseNFT } from "@/entities/INFT";
import { areEqualAddresses, idStringToDisplay } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "../providers/metadata";

export enum MEME_FOCUS {
  LIVE = "live",
  YOUR_CARDS = "your-cards",
  THE_ART = "the-art",
  REFERENCES = "references",
  COLLECTORS = "collectors",
  HISTORY = "history",
  YOUR_TRANSACTIONS = "your-transactions",
  ACTIVITY = "activity",
  TIMELINE = "timeline",
}

const MEME_FOCUS_VALUES: readonly string[] = Object.values(MEME_FOCUS);

function assertUnhandled(value: never, label: string): never {
  throw new Error(`Unhandled ${label}: ${String(value)}`);
}

export function isMemeFocus(focus: string): focus is MEME_FOCUS {
  return MEME_FOCUS_VALUES.includes(focus);
}

export function getMemeFocusLabel(
  focus: MEME_FOCUS,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  switch (focus) {
    case MEME_FOCUS.LIVE:
      return t(locale, "theMemes.detail.tabs.overview");
    case MEME_FOCUS.YOUR_CARDS:
      return t(locale, "theMemes.detail.tabs.yourCards");
    case MEME_FOCUS.THE_ART:
      return t(locale, "theMemes.detail.tabs.theArt");
    case MEME_FOCUS.REFERENCES:
      return t(locale, "theMemes.detail.tabs.references");
    case MEME_FOCUS.COLLECTORS:
      return t(locale, "theMemes.detail.tabs.collectors");
    case MEME_FOCUS.HISTORY:
      return t(locale, "theMemes.detail.tabs.history");
    case MEME_FOCUS.YOUR_TRANSACTIONS:
      return t(locale, "theMemes.detail.tabs.yourTransactions");
    case MEME_FOCUS.ACTIVITY:
      return t(locale, "theMemes.detail.tabs.activity");
    case MEME_FOCUS.TIMELINE:
      return t(locale, "theMemes.detail.tabs.timeline");
    default:
      return assertUnhandled(focus, "MEME_FOCUS");
  }
}

export const MEME_TABS: MemeTab[] = [
  { focus: MEME_FOCUS.LIVE },
  { focus: MEME_FOCUS.YOUR_CARDS },
  { focus: MEME_FOCUS.THE_ART },
  { focus: MEME_FOCUS.REFERENCES },
  { focus: MEME_FOCUS.COLLECTORS },
  { focus: MEME_FOCUS.HISTORY },
  { focus: MEME_FOCUS.ACTIVITY },
  { focus: MEME_FOCUS.TIMELINE },
];

interface MemeTab {
  focus: MEME_FOCUS;
}

async function getMetadataProps(
  contract: string,
  id: string,
  focus: string,
  isDistribution: boolean = false,
  locale: SupportedLocale = DEFAULT_LOCALE,
  prefetchedNft?: BaseNFT | null
) {
  let urlPath = "nfts";
  const idDisplay = idStringToDisplay(id);
  let collection = "The Memes";
  let name = `The Memes #${idDisplay}`;
  let description = "Collections";
  if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
    urlPath = "nfts_memelab";
    collection = "Meme Lab";
    name = `Meme Lab #${idDisplay}`;
  }
  const query = new URLSearchParams({ contract, id }).toString();
  let artist: string | null = null;
  let image: string | null = null;
  try {
    let nft = prefetchedNft ?? undefined;
    if (prefetchedNft === undefined) {
      const response = await fetchUrl<DBResponse<BaseNFT>>(
        `${publicEnv.API_ENDPOINT}/api/${urlPath}?${query}`
      );
      nft = Array.isArray(response.data) ? response.data[0] : undefined;
    }
    if (nft && typeof nft.name === "string" && nft.name.trim().length > 0) {
      description = `${name} | ${description}`;
      name = nft.name;
      artist = nft.artist ?? null;
      if (nft.thumbnail) {
        image = nft.thumbnail;
      } else if (nft.image) {
        image = nft.image;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch NFT metadata for social card", {
      contract,
      id,
      error,
    });
  }

  if (focus && focus !== MEME_FOCUS.LIVE) {
    if (isMemeFocus(focus)) {
      name = `${name} | ${getMemeFocusLabel(focus, locale)}`;
    }
  } else if (isDistribution) {
    name = `${name} | ${t(locale, "distribution.title")}`;
  }

  return {
    title: name,
    description: description,
    ogImage: getNftSocialCardImagePath({
      artist,
      badge: collection,
      collection,
      contract,
      id,
      image,
      subtitle: description,
      title: name,
    }),
    ogImageAlt: `${name} social card`,
  };
}

export async function getSharedAppServerSideProps(
  contract: string,
  id: string,
  focus: string,
  isDistribution: boolean = false,
  locale: SupportedLocale = DEFAULT_LOCALE,
  prefetchedNft?: BaseNFT | null
) {
  const { title, description, ogImage, ogImageAlt } = await getMetadataProps(
    contract,
    id,
    focus,
    isDistribution,
    locale,
    prefetchedNft
  );

  return getAppMetadata(
    getLargeSocialCardMetadata({
      title,
      description,
      ogImage,
      ogImageAlt,
    })
  );
}

export function getMemeTabTitle(
  title: string,
  id?: string,
  nft?: BaseNFT,
  focus?: MEME_FOCUS,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  let t = title;
  if (id) {
    t = `${t} #${id}`;
  }
  if (nft) {
    t = `${nft.name} | ${t}`;
  }
  if (focus && focus !== MEME_FOCUS.LIVE) {
    t = `${t} | ${getMemeFocusLabel(focus, locale)}`;
  }
  return t;
}
