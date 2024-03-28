import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import {
  ReservoirTokensResponse,
  ReservoirTokensResponseTokenElement,
} from "../../../entities/IReservoir";
import { useEffect, useState } from "react";

export default function NftTooltip({
  contract,
  token,
}: {
  readonly contract: string;
  readonly token: string;
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

  if (!nft) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <div>{nft.token.collection.name}</div>
      <div>{nft.token.name}</div>
      <div>ID: #{nft.token.tokenId}</div>
      <div>Supply: {nft.token.supply}</div>
      <div>Remaining supply: {nft.token.remainingSupply}</div>
      <div>Floor: {nft.market.floorAsk.price?.amount.native}</div>
    </div>
  );
}
