import { ReferencedNft } from "../../../../../entities/IDrop";
import NftTooltip from "../../../../utils/nft/NftTooltip";
import { LazyTippy } from "../../../../utils/tooltip/LazyTippy";

export default function DropListItemContentHashtag({
  nft,
}: {
  readonly nft: ReferencedNft;
}) {
  return (
    <LazyTippy
      placement={"top"}
      interactive={true}
      content={<NftTooltip contract={nft.contract} tokenId={nft.token} />}
    >
      <span className="tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out">
        #{nft.name}
      </span>
    </LazyTippy>
  );
}
