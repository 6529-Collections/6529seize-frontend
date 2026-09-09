import type { ReferencedNft } from "@/entities/IDrop";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { TokenMetadata } from "@/types/nft";

export default function DropListItemContentNftDetails({
  referencedNft: { name: tokenName },
  nft,
}: {
  readonly referencedNft: ReferencedNft;
  readonly nft: TokenMetadata | null;
}) {
  const image = nft?.imageUrl;
  return (
    <span className="tw-gap-x-2 tw-flex tw-items-center">
      {image && (
        <img
          alt=""
          src={getScaledImageUri(image, ImageScale.W_AUTO_H_50)}
          className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-object-contain"
        />
      )}
      <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-50">
        {tokenName}
      </span>
    </span>
  );
}
