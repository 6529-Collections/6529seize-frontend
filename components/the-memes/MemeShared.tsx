import { publicEnv } from "@/config/env";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MEMELAB_CONTRACT } from "../../constants";
import { BaseNFT, VolumeType } from "../../entities/INFT";
import { areEqualAddresses, idStringToDisplay } from "../../helpers/Helpers";
import { fetchUrl } from "../../services/6529api";
import { getAppMetadata } from "../providers/metadata";

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
      className={`tw-bg-transparent tw-border-none tw-p-0 tw-m-0 tw-no-underline tw-cursor-pointer tw-transition-colors tw-duration-200 ${
        isActive
          ? "tw-text-white tw-font-semibold"
          : "tw-text-gray-400 hover:tw-text-white"
      }`}
      onClick={() => {
        props.setActiveTab(props.tab.focus);
      }}>
      {props.tab.title}
    </button>
  );
}

export function VolumeTypeDropdown({
  isVolumeSort,
  selectedVolumeSort,
  setVolumeType,
  setVolumeSort,
}: {
  readonly isVolumeSort: boolean;
  readonly selectedVolumeSort: VolumeType;
  readonly setVolumeType: (volumeType: VolumeType) => void;
  readonly setVolumeSort: () => void;
}) {
  const volumeTypes = Object.values(VolumeType);

  function handleSelect(vol: VolumeType) {
    setVolumeType(vol);
    if (!isVolumeSort) {
      setVolumeSort();
    }
  }

  return (
    <Menu as="div" className="tw-relative tw-inline-block">
      <MenuButton
        type="button"
        className={`tw-bg-transparent tw-border-none tw-p-0 tw-m-0 tw-no-underline tw-cursor-pointer tw-flex tw-items-center tw-gap-1 tw-transition-colors tw-duration-200 ${
          isVolumeSort
            ? "tw-text-white tw-font-semibold"
            : "tw-text-gray-400 hover:tw-text-white"
        }`}>
        <span>
          Volume{" "}
          {isVolumeSort && selectedVolumeSort && (
            <span>({selectedVolumeSort})</span>
          )}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className="tw-w-3 tw-h-3" />
      </MenuButton>

      <MenuItems className="tw-absolute tw-right-0 tw-mt-1 tw-min-w-[10rem] tw-bg-black tw-rounded-b tw-shadow-lg tw-z-50 unselectable tw-pb-1">
        <div className="tw-h-1 tw-bg-white"></div>
        {volumeTypes.map((vol) => (
          <MenuItem key={vol} as="div">
            {({ focus }) => (
              <button
                type="button"
                onClick={() => handleSelect(vol)}
                className={`tw-block tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-base tw-transition-colors tw-duration-200 tw-bg-black tw-border-0 tw-outline-none ${
                  focus
                    ? "tw-bg-gray-700 tw-text-white"
                    : "tw-text-white hover:tw-bg-gray-700"
                }`}>
                {vol}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
