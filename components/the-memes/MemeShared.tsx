import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { BaseNFT } from "@/entities/INFT";
import { areEqualAddresses, idStringToDisplay } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import { getAppMetadata } from "../providers/metadata";

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
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  let urlPath = "nfts";
  const idDisplay = idStringToDisplay(id);
  let name = `The Memes #${idDisplay}`;
  let description = "Collections";
  if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
    urlPath = "nfts_memelab";
    name = `Meme Lab #${idDisplay}`;
  }
  const response = await fetchUrl(
    `${publicEnv.API_ENDPOINT}/api/${urlPath}?contract=${contract}&id=${id}`
  );
  let image = `${publicEnv.BASE_ENDPOINT}/6529io.png`;
  if (response?.data?.length > 0) {
    description = `${name} | ${description}`;
    name = `${response.data[0].name}`;
    if (response.data[0].thumbnail) {
      image = response.data[0].thumbnail;
    } else if (response.data[0].image) {
      image = response.data[0].image;
    }
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
    ogImage: image,
  };
}

export async function getSharedAppServerSideProps(
  contract: string,
  id: string,
  focus: string,
  isDistribution: boolean = false,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  const { title, description, ogImage } = await getMetadataProps(
    contract,
    id,
    focus,
    isDistribution,
    locale
  );

  return getAppMetadata({
    title,
    description: description,
    ogImage,
    twitterCard: "summary",
  });
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
