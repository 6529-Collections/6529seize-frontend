import { IAttribute } from "../../entities/INFT";

export interface ManifoldImageDetails {
  bytes: number;
  format: string;
  sha256: string;
  width: number;
  height: number;
}

export interface ManifoldPublicData {
  asset: {
    created_by: string;
    description: string;
    name: string;
    external_url: string;
    attributes: IAttribute[];
    image_details: ManifoldImageDetails;
    image: string;
    image_url: string;
    animation_details: {
      bytes: number;
      format: string;
      sha256: string;
    };
    animation: string;
    animation_url: string;
  };
  endDate: number;
  network: number;
  contract: ManifoldContract;
  mintPrice: ManifoldMintPrice;
  startDate: number;
  description: string;
  instanceAllowlist: ManifoldInstanceAllowlist;
  mintingRestriction: string;
  extensionAddress721: ManifoldExtensionAddress;
  extensionAddress1155: ManifoldExtensionAddress;
}

export interface ManifoldCreator {
  id: number;
  name: string;
  address: string;
}

export interface ManifoldContract {
  name: string;
  symbol: string;
  contractAddress: string;
  networkId: number;
  spec: string;
}

export interface ManifoldMintPrice {
  value: string;
  decimals: number;
  currency: string;
  erc20: string;
}

export interface ManifoldInstanceAllowlist {
  merkleTreeId: number;
}

export interface ManifoldExtensionAddress {
  value: string;
  version: number;
}

export interface ManifoldInstance {
  id: number;
  creator: ManifoldCreator;
  slug: string;
  publicData: ManifoldPublicData;

  appId: number;
}

export interface ManifoldMerkleProof {
  merkleProof: string[];
  value: number;
}

export function getTraitValue(
  instance: ManifoldInstance,
  traitType: string
): string | undefined {
  return instance.publicData.asset.attributes.find(
    (a: IAttribute) => a.trait_type === traitType
  )?.value;
}
