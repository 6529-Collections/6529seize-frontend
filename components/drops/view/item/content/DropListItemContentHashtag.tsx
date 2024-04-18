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
      <div className="tw-font-medium tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out">
   
        <div className="tw-mt-1 md:tw-flex md:tw-justify-center tw-w-full md:tw-p-[1px] tw-ring-1 tw-ring-inset tw-ring-iron-700 md:tw-rounded-xl">
          <div className="tw-w-full tw-h-full">
            {nft && (
              <img
                src={nft.token.imageSmall}
                alt="NFT token"
                className="tw-w-full tw-h-full tw-object-center tw-object-contain"
              />
            )}
          </div>
        </div>
      </div>
    </LazyTippy>
  );
}
