import {
  GRADIENT_CONTRACT,
  MEMES_CONTRACT,
  MEMELAB_CONTRACT,
  NEXTGEN_CONTRACT,
} from "../../../../../../constants";
import {
  GroupOwnsNft,
  GroupOwnsNftNameEnum,
} from "../../../../../../generated/models/GroupOwnsNft";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";
import { NFTSearchResult } from "../../../../../header/header-search/HeaderSearchModalItem";

export default function GroupCreateNftSearchItem({
  item,
  selected,
  onSelect,
}: {
  readonly item: NFTSearchResult;
  readonly selected: GroupOwnsNft[];
  readonly onSelect: (newV: NFTSearchResult) => void;
}) {
  const NAME_ENUMS: Record<string, GroupOwnsNftNameEnum> = {
    [GRADIENT_CONTRACT.toLowerCase()]: GroupOwnsNftNameEnum.Gradients,
    [MEMES_CONTRACT.toLowerCase()]: GroupOwnsNftNameEnum.Memes,
    [MEMELAB_CONTRACT.toLowerCase()]: GroupOwnsNftNameEnum.Memelab,
    [NEXTGEN_CONTRACT.toLowerCase()]: GroupOwnsNftNameEnum.Nextgen,
  };

  const labels: Record<GroupOwnsNftNameEnum, string> = {
    [GroupOwnsNftNameEnum.Gradients]: "Gradients",
    [GroupOwnsNftNameEnum.Memes]: "The Memes",
    [GroupOwnsNftNameEnum.Memelab]: "Meme Lab",
    [GroupOwnsNftNameEnum.Nextgen]: "NextGen",
  };

  const nameEnum = NAME_ENUMS[item.contract.toLowerCase()];
  const contractName = labels[nameEnum];

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
        className="hover:tw-bg-iron-700 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
        onClick={() => onSelect(item)}>
        <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
          <div className="tw-flex tw-space-x-2 tw-items-center">
            <div className="tw-h-6 tw-w-6 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-900">
              <div className="tw-h-full tw-w-full tw-max-w-full">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                  <img
                    src={getScaledImageUri(
                      item.image_url,
                      ImageScale.W_AUTO_H_50
                    )}
                    alt="Network Table Profile Picture"
                    className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="tw-truncate">
              <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-white tw-truncate tw-whitespace-nowrap">
                {item.name}
              </p>
              <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-truncate tw-whitespace-nowrap">
                {contractName}
              </p>
            </div>
          </div>
          {isSelected && (
            <svg
              className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
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
