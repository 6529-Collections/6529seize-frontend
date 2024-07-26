import { goerli, sepolia } from "wagmi/chains";
import { NEXTGEN_CHAIN_ID } from "../components/nextGen/nextgen_contracts";

const options = { method: "GET", headers: { accept: "application/json" } };

async function fetchUrl(url: string) {
  const response = await fetch(url, options);
  return await response.json();
}

export async function getNftsForContractAndOwner(
  chainId: number,
  contract: string,
  owner: string,
  nfts?: any[],
  pageKey?: string
) {
  if (!nfts) {
    nfts = [];
  }
  let path = "eth-mainnet";
  if (chainId === sepolia.id) {
    path = "eth-sepolia";
  } else if (chainId === goerli.id) {
    path = "eth-goerli";
  }

  let url = `https://${path}.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&contractAddresses[]=${contract}`;
  if (pageKey) {
    url += `&pageKey=${pageKey}`;
  }
  const response = await fetchUrl(url);
  if (response.error) {
    return getNftsForContractAndOwner(chainId, contract, owner, nfts, pageKey);
  }
  nfts = [...nfts].concat(response.ownedNfts);
  if (response.pageKey) {
    return getNftsForContractAndOwner(
      NEXTGEN_CHAIN_ID,
      contract,
      owner,
      nfts,
      response.pageKey
    );
  }

  const allNfts = nfts.map((nft) => {
    return {
      tokenId: nft.tokenId,
      tokenType: nft.tokenType,
      name: nft.name,
      tokenUri: nft.tokenUri,
      image: nft.image,
    };
  });
  return allNfts;
}
