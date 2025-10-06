import { BaseNFT, NFTLite } from "@/entities/INFT";

export interface BaseRendererProps {
  readonly nft: BaseNFT | NFTLite;
  readonly height: 300 | 650 | "full";
  readonly showBalance: boolean;
  readonly transparentBG?: boolean;
  readonly id?: string;
  readonly showOriginal?: boolean;
  readonly showThumbnail?: boolean;
  readonly heightStyle: string;
  readonly imageStyle: string;
  readonly bgStyle: string;
}
