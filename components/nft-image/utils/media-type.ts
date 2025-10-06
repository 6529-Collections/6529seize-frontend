import { BaseNFT, NFTLite } from "@/entities/INFT";

export type MediaType = 'html' | 'glb' | 'video' | 'image';

export function getMediaType(nft: BaseNFT | NFTLite, animation: boolean): MediaType {
  if (!animation || !nft.animation) {
    return 'image';
  }

  if (!("metadata" in nft) || !nft.metadata?.animation_details?.format) {
    return 'image';
  }

  const format = nft.metadata.animation_details.format.toLowerCase();
  
  switch (format) {
    case 'html':
      return 'html';
    case 'glb':
      return 'glb';
    case 'mp4':
    case 'mov':
      return 'video';
    default:
      return 'image';
  }
}