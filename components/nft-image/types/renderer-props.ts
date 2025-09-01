import { BaseNFT, NFTLite } from "../../../entities/INFT";

export interface BaseRendererProps {
  nft: BaseNFT | NFTLite;
  height: 300 | 650 | "full";
  balance: number;
  showOwned?: boolean;
  showUnseized: boolean;
  transparentBG?: boolean;
  id?: string;
  showOriginal?: boolean;
  showThumbnail?: boolean;
  heightStyle: string;
  imageStyle: string;
  bgStyle: string;
}