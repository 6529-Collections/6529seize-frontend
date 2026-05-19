import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { BaseNFT } from "@/entities/INFT";
import { areEqualAddresses, idStringToDisplay } from "@/helpers/Helpers";
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
    ogImage: image,
  };
}

export async function getSharedAppServerSideProps(
  contract: string,
  id: string,
  focus: string,
  isDistribution: boolean = false
) {
  const { title, description, ogImage } = await getMetadataProps(
    contract,
    id,
    focus,
    isDistribution
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

export function TabButton(
  props: Readonly<{
    tab: MemeTab;
    activeTab: MEME_FOCUS | undefined;
    setActiveTab: (focus: MEME_FOCUS) => void;
  }>
) {
  const isActive = props.activeTab === props.tab.focus;

  return (
    <button
      type="button"
      className={`tw-m-0 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-no-underline tw-transition-colors tw-duration-200 ${
        isActive
          ? "tw-font-semibold tw-text-white"
          : "tw-text-gray-400 hover:tw-text-white"
      }`}
      onClick={() => {
        props.setActiveTab(props.tab.focus);
      }}
    >
      {props.tab.title}
    </button>
  );
}
