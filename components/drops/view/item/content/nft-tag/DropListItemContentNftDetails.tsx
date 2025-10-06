import { ReferencedNft } from "@/entities/IDrop";
import { ReservoirTokensResponseTokenElement } from "@/entities/IReservoir";
import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";

export default function DropListItemContentNftDetails({
  referencedNft: { contract, token, name: tokenName },
  nft,
}: {
  readonly referencedNft: ReferencedNft;
  readonly nft: ReservoirTokensResponseTokenElement | null;
}) {
  const image = nft?.token.collection.image;
  return (
    <div className="tw-gap-x-2 tw-flex tw-items-center">
      {image && (
        <img
          alt="Seize"
          src={getScaledImageUri(image, ImageScale.W_AUTO_H_50)}
          className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-object-contain"
        />
      )}
      <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-50">
        {tokenName}
      </span>
      {/* <span className="w-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-bg-[#B884FF]/10 tw-text-[#B884FF] tw-ring-[#B884FF]/20">
        SZN1
      </span>
      <span className="tw-whitespace-nowrap inline-flex items-center tw-rounded-full tw-bg-green/10 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-green tw-ring-1 tw-ring-inset tw-ring-green/20">
        <svg
          className="tw-h-2.5 tw-w-auto tw-mr-1"
          width="17"
          height="15"
          viewBox="0 0 17 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
            fill="currentColor"
          />
        </svg>
        <span>simo</span>
      </span>
      <span className="tw-whitespace-nowrap inline-flex items-center tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-500 tw-ring-1 tw-ring-inset tw-ring-iron-700">
        <span>simo.eth</span>
      </span> */}
    </div>
  );
}
