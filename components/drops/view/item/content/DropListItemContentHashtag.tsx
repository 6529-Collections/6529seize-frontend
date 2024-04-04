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
  nft: { contract, token, name },
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
      interactive={true}
      content={<NftTooltip contract={contract} token={token} />}
    >
      <div className="tw-font-medium tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out">
        #{name}
        <div className="tw-mt-1 tw-overflow-hidden tw-flex tw-justify-center tw-w-full tw-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)] tw-bg-iron-700/20 tw-rounded-xl">
          <div className="tw-h-96">
            {nft && <img src={nft.token.imageSmall} height={384} />}
          </div>
        </div>
      </div>
    </LazyTippy>
  );
}
