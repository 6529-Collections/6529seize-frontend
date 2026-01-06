import type { BaseNFT, NFTLite } from "@/entities/INFT";

export interface BaseRendererProps {
  readonly nft: BaseNFT | NFTLite;
  readonly height: 300 | 650 | "full";
  readonly showBalance: boolean;
  readonly transparentBG?: boolean | undefined;
  readonly id?: string | undefined;
  readonly showOriginal?: boolean | undefined;
  readonly showThumbnail?: boolean | undefined;
  readonly heightStyle: string;
  readonly imageStyle: string;
  readonly bgStyle: string;
}
