import type { NFTSearchResult } from "@/components/header/header-search/HeaderSearchModalItem";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";
import { ApiGroupOwnsNftNameEnum } from "@/generated/models/ApiGroupOwnsNft";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export default function GroupCreateNftSearchItem({
  item,
  selected,
  onSelect,
}: {
  readonly item: NFTSearchResult;
  readonly selected: ApiGroupOwnsNft[];
  readonly onSelect: (newV: NFTSearchResult) => void;
}) {
  const NAME_ENUMS: Record<string, ApiGroupOwnsNftNameEnum> = {
    [GRADIENT_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Gradients,
    [MEMES_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Memes,
    [MEMELAB_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Memelab,
    [NEXTGEN_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Nextgen,
  };

  const labels: Record<ApiGroupOwnsNftNameEnum, string> = {
    [ApiGroupOwnsNftNameEnum.Gradients]: "Gradients",
    [ApiGroupOwnsNftNameEnum.Memes]: "The Memes",
    [ApiGroupOwnsNftNameEnum.Memelab]: "Meme Lab",
    [ApiGroupOwnsNftNameEnum.Nextgen]: "NextGen",
  };

  const nameEnum = NAME_ENUMS[item.contract.toLowerCase()];
  const contractName = labels[nameEnum!];

  const getIsSelected = (): boolean => {
    if (!nameEnum) {
      return false;
    }
    const group = selected.find((g) => g.name === nameEnum);
    if (!group) {
      return false;
    }
    return group.tokens.includes(`${item.id}`);
  };

  const isSelected = getIsSelected();

  return (
    <li className="tw-h-full">
      <button
        type="button"
        className="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-bg-transparent tw-px-2 tw-py-2 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        onClick={() => onSelect(item)}
      >
        <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-space-x-2">
            <div className="tw-h-6 tw-w-6 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10">
              <div className="tw-h-full tw-w-full tw-max-w-full">
                <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                  <img
                    src={getScaledImageUri(
                      item.image_url,
                      ImageScale.W_AUTO_H_50
                    )}
                    alt="Network Table Profile Picture"
                    className="tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="tw-truncate">
              <p className="tw-mb-0 tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-white">
                {item.name}
              </p>
              <p className="tw-mb-0 tw-truncate tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
                {contractName}
              </p>
            </div>
          </div>
          {isSelected && (
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>
    </li>
  );
}
