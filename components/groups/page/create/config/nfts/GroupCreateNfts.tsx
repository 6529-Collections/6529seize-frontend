import type { NFTSearchResult } from "@/components/header/header-search/HeaderSearchModalItem";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";
import { ApiGroupOwnsNftNameEnum } from "@/generated/models/ApiGroupOwnsNft";
import type { ApiGroupNftOwnershipMatchMode } from "@/generated/models/ApiGroupNftOwnershipMatchMode";
import {
  DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE,
  normalizeGroupNftOwnerships,
  withDefaultGroupNftOwnershipMatchMode,
} from "@/helpers/groups/group-nft-ownership";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import GroupCreateNftsSelect from "./GroupCreateNftsSelect";
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
    const existingGroup = nfts.find((g) => g.name === nameEnum);
    const group: ApiGroupOwnsNft = existingGroup
      ? withDefaultGroupNftOwnershipMatchMode(existingGroup)
      : {
          name: nameEnum,
          tokens: [],
          match_mode: DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE,
        };

    const isPresent = group.tokens.find((t) => t === `${item.id}`);
    const tokens = isPresent
      ? group.tokens.filter((t) => t !== `${item.id}`)
      : [...group.tokens, `${item.id}`];

    const newSelected = nfts.filter((g) => g.name !== nameEnum);
    if (tokens.length > 0) {
      newSelected.push({ ...group, tokens });
    }
    setNfts(normalizeGroupNftOwnerships(newSelected));
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
          return withDefaultGroupNftOwnershipMatchMode({
            ...group,
            tokens: group.tokens.filter((t) => t !== token),
          });
        }
        return withDefaultGroupNftOwnershipMatchMode(group);
      })
      .filter((group) => group.tokens.length > 0 || group.name !== name);

    setNfts(updatedNfts);
  };

  const onMatchModeChange = ({
    name,
    matchMode,
  }: {
    name: ApiGroupOwnsNftNameEnum;
    matchMode: ApiGroupNftOwnershipMatchMode;
  }) => {
    setNfts(
      nfts.map((group) =>
        group.name === name
          ? withDefaultGroupNftOwnershipMatchMode({
              ...group,
              match_mode: matchMode,
            })
          : withDefaultGroupNftOwnershipMatchMode(group)
      )
    );
  };

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div>
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
          Required NFTs
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
          {t(DEFAULT_LOCALE, "groups.nftOwnership.description")}
        </p>
      </div>
      <div className="tw-mt-2 sm:tw-mt-4">
        <GroupCreateNftsSelect onSelect={onSelect} selected={nfts} />
      </div>
      <GroupCreateNftsSelected
        selected={nfts}
        onRemove={onRemove}
        onMatchModeChange={onMatchModeChange}
      />
    </div>
  );
}
