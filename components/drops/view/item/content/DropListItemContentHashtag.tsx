import { useQuery } from "@tanstack/react-query";
import { ReferencedNft } from "../../../../../entities/IDrop";
import NftTooltip from "../../../../utils/nft/NftTooltip";
import LazyTippy from "../../../../utils/tooltip/LazyTippy";
import {
  ReservoirTokensResponse,
  ReservoirTokensResponseTokenElement,
} from "../../../../../entities/IReservoir";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { useEffect, useState } from "react";

export default function DropListItemContentHashtag({
  nft: { contract, token },
}: {
  readonly nft: ReferencedNft;
}) {
  const { data: nfts } = useQuery<ReservoirTokensResponseTokenElement[]>({
    queryKey: [QueryKey.RESERVOIR_NFT, { contract, token }],
    queryFn: async () => {
      const url = `https://api.reservoir.tools/tokens/v7?tokens=${contract}%3A${token}`;
      const response = await fetch(url);
      if (response.ok) {
        const data: ReservoirTokensResponse = await response.json();
        return data.tokens;
      }
      return [];
    },
    enabled: !!contract && !!token,
    staleTime: 1000 * 60 * 5,
  });

  const [nft, setNft] = useState<ReservoirTokensResponseTokenElement | null>(
    null
  );
  useEffect(() => {
    if (nfts?.length) {
      setNft(nfts[0]);
    }
  }, [nfts]);
  return (
    <LazyTippy
      placement={"top"}
      interactive={false}
      content={<NftTooltip contract={contract} token={token} />}
    >
      <div className="tw-mt-2 tw-gap-y-2 tw-flex tw-flex-col">
        <div className="tw-w-full tw-h-full">
          {nft && (
            <img
              src={nft.token.imageSmall}
              alt="NFT token"
              className="tw-w-full tw-h-full tw-object-center tw-object-contain"
            />
          )}
        </div>
        <div className="tw-gap-x-2 tw-flex tw-items-center">
          <img alt="Seize" src="Seize_Logo_2.png" className="tw-flex-shrink-0 tw-h-3 tw-w-3" />
          <span className="tw-text-md tw-font-medium tw-text-neutral-50">
            Venus's Love for Transactions
          </span>
          <span className="inline-flex items-center tw-rounded-full tw-bg-green/10 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-green tw-ring-1 tw-ring-inset tw-ring-green/20">
            <svg
              className="tw-h-2.5 tw-w-auto tw-mr-1"
              width="17"
              height="15"
              viewBox="0 0 17 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
                fill="currentColor"
              />
            </svg>
            <span>simo</span>
          </span>
          <span className="inline-flex items-center tw-rounded-full tw-bg-neutral-800 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-500 tw-ring-1 tw-ring-inset tw-ring-neutral-700">
            <span>simo.eth</span>
          </span>
        </div>
      </div>
    </LazyTippy>
  );
}
