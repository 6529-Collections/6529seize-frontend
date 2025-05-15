import { MEMELAB_CONTRACT } from "../../constants";
import { fetchUrl } from "../../services/6529api";
import { areEqualAddresses } from "../../helpers/Helpers";
import { BaseNFT } from "../../entities/INFT";

export enum MEME_FOCUS {
  LIVE = "live",
  YOUR_CARDS = "your-cards",
  THE_ART = "the-art",
  COLLECTORS = "collectors",
  ACTIVITY = "activity",
  TIMELINE = "timeline",
}

export const MEME_TABS: MemeTab[] = [
  { focus: MEME_FOCUS.LIVE, title: "Live" },
  { focus: MEME_FOCUS.YOUR_CARDS, title: "Your Cards" },
  { focus: MEME_FOCUS.THE_ART, title: "The Art" },
  { focus: MEME_FOCUS.COLLECTORS, title: "Collectors" },
  { focus: MEME_FOCUS.ACTIVITY, title: "Activity" },
  { focus: MEME_FOCUS.TIMELINE, title: "Timeline" },
];

export interface MemeTab {
  focus: MEME_FOCUS;
  title: string;
}

export async function getSharedServerSideProps(
  req: any,
  contract: string,
  isDistribution: boolean = false
) {
  const { id, focus } = req.query;
  let urlPath = "nfts";
  let name = `The Memes #${id}`;
  let description = "";
  if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
    urlPath = "nfts_memelab";
    name = `Meme Lab #${id}`;
  }
  if (isDistribution) {
    name = `${name} | Distribution`;
  }
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/${urlPath}?contract=${contract}&id=${id}`
  );
  let image = `${process.env.BASE_ENDPOINT}/6529io.png`;
  if (response?.data?.length > 0) {
    description = name;
    name = `${response.data[0].name}`;
    if (response.data[0].thumbnail) {
      image = response.data[0].thumbnail;
    } else if (response.data[0].image) {
      image = response.data[0].image;
    }
  }

  if (focus) {
    const tab = MEME_TABS.find((t) => t.focus === focus);
    if (tab && tab.focus !== MEME_FOCUS.LIVE) {
      name = `${name} | ${tab.title}`;
    }
  }

  return {
    props: {
      id: id,
      name: name,
      image: image,
      metadata: {
        title: name,
        description: description,
        ogImage: image,
        twitterCard: "summary",
      },
    },
  };
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
