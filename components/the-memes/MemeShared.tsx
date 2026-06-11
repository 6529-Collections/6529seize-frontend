import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { BaseNFT } from "@/entities/INFT";
import { areEqualAddresses, idStringToDisplay } from "@/helpers/Helpers";
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

export const MEME_TABS: MemeTab[] = [
  { focus: MEME_FOCUS.LIVE, title: "Overview" },
  { focus: MEME_FOCUS.YOUR_CARDS, title: "Your Cards" },
  { focus: MEME_FOCUS.THE_ART, title: "The Art" },
  { focus: MEME_FOCUS.REFERENCES, title: "References" },
  { focus: MEME_FOCUS.COLLECTORS, title: "Collectors" },
  { focus: MEME_FOCUS.HISTORY, title: "History" },
  { focus: MEME_FOCUS.ACTIVITY, title: "Activity" },
  { focus: MEME_FOCUS.TIMELINE, title: "Timeline" },
];

interface MemeTab {
  focus: MEME_FOCUS;
  title: string;
}

async function getMetadataProps(
  contract: string,
  id: string,
  focus: string,
  isDistribution: boolean = false
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
  const response = await fetchUrl(
    `${publicEnv.API_ENDPOINT}/api/${urlPath}?contract=${contract}&id=${id}`
  );
  let artist: string | null = null;
  let image: string | null = null;
  if (response?.data?.length > 0) {
    const nft = response.data[0];
    description = `${name} | ${description}`;
    name = `${nft.name}`;
    artist = nft.artist ?? null;
    if (nft.thumbnail) {
      image = nft.thumbnail;
    } else if (nft.image) {
      image = nft.image;
    }
  }

  if (focus && focus !== MEME_FOCUS.LIVE) {
    const tab = MEME_TABS.find((t) => t.focus === focus);
    if (tab) {
      name = `${name} | ${tab.title}`;
    }
  } else if (isDistribution) {
    name = `${name} | Distribution`;
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
  isDistribution: boolean = false
) {
  const { title, description, ogImage, ogImageAlt } = await getMetadataProps(
    contract,
    id,
    focus,
    isDistribution
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
  focus?: MEME_FOCUS
) {
  let t = title;
  if (id) {
    t = `${t} #${id}`;
  }
  if (nft) {
    t = `${nft.name} | ${t}`;
  }
  if (focus && focus !== MEME_FOCUS.LIVE) {
    const tab = MEME_TABS.find((t) => t.focus === focus);
    if (tab) {
      t = `${t} | ${tab.title}`;
    }
  }
  return t;
}
