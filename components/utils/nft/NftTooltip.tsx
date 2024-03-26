import { useQuery } from "@tanstack/react-query";
import { ReservoirToken } from "../../drops/create/lexical/plugins/hashtags/HashtagsPlugin";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { d } from "@tanstack/react-query-devtools/build/legacy/devtools-5fd5b190";

export default function NftTooltip({
  contract,
  tokenId,
}: {
  readonly contract: string;
  readonly tokenId: string;
}) {
  const { data: nfts } = useQuery<ReservoirToken[]>({
    queryKey: [QueryKey.RESERVOIR_NFT, { contract, tokenId }],
    queryFn: async () => {
      const url = `https://api.reservoir.tools/tokens/v7?tokens=${contract}%3A${tokenId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data.tokens;
      }
      return [];
    },
    enabled: !!contract && !!tokenId,
  });
  return <div>{nfts?.at(0)?.token.name}</div>;
}
