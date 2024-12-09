import GroupCreateNftsSelect from "./GroupCreateNftsSelect";
import {
  ApiGroupOwnsNft,
  ApiGroupOwnsNftNameEnum,
} from "../../../../../../generated/models/ApiGroupOwnsNft";
import { NFTSearchResult } from "../../../../../header/header-search/HeaderSearchModalItem";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "../../../../../../constants";
import { ApiCreateGroupDescription } from "../../../../../../generated/models/ApiCreateGroupDescription";
import GroupCreateNftsSelected from "./GroupCreateNftsSelected";

export default function GroupCreateNfts({
  nfts,
  setNfts,
}: {
  readonly nfts: ApiCreateGroupDescription["owns_nfts"];
  readonly setNfts: (nfts: ApiCreateGroupDescription["owns_nfts"]) => void;
}) {
  const NAME_ENUMS: Record<string, ApiGroupOwnsNftNameEnum> = {
    [GRADIENT_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Gradients,
    [MEMES_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Memes,
    [MEMELAB_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Memelab,
    [NEXTGEN_CONTRACT.toLowerCase()]: ApiGroupOwnsNftNameEnum.Nextgen,
  };

  const onSelect = (item: NFTSearchResult) => {
    const nameEnum = NAME_ENUMS[item.contract.toLowerCase()];
    if (!nameEnum) {
      return;
    }
    const group: ApiGroupOwnsNft = nfts.find((g) => g.name === nameEnum) ?? {
      name: nameEnum,
      tokens: [],
    };

    const isPresent = group.tokens.find((t) => t === `${item.id}`);
    if (isPresent) {
      group.tokens = group.tokens.filter((t) => t !== `${item.id}`);
    } else {
      group.tokens.push(`${item.id}`);
    }

    const newSelected = nfts.filter((g) => g.name !== nameEnum);
    newSelected.push(group);
    setNfts(newSelected);
  };

  const onRemove = ({
    name,
    token,
  }: {
    name: ApiGroupOwnsNftNameEnum;
    token: string;
  }) => {
    const updatedNfts = nfts
      .map((group) => {
        if (group.name === name) {
          return {
            ...group,
            tokens: group.tokens.filter((t) => t !== token),
          };
        }
        return group;
      })
      .filter((group) => group.tokens.length > 0);

    setNfts(updatedNfts);
  };

  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div>
        <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
          Required NFTs
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
          Identity must own all of these specific tokens.
        </p>
      </div>
      <div className="tw-mt-2 sm:tw-mt-3">
        <GroupCreateNftsSelect onSelect={onSelect} selected={nfts} />
      </div>
      <GroupCreateNftsSelected selected={nfts} onRemove={onRemove} />
    </div>
  );
}
