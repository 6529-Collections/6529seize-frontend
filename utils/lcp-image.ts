import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { getMediaType } from "@/components/nft-image/utils/media-type";

/**
 * Determines the LCP image URL for server-side preloading
 * Uses the same logic as NFTImageRenderer to ensure consistency
 */
export function getLCPImageUrl(featuredNft: NFTWithMemesExtendedData): string | null {
  // Determine if this will be an image or other media type
  const mediaType = getMediaType(featuredNft, true);
  
  // Only preload if it's going to be an image
  if (mediaType !== 'image') {
    return null;
  }
  
  // Use the same priority logic as NFTImageRenderer:
  // 1. scaled (if not showing original)
  // 2. image (full resolution)
  // 3. thumbnail as fallback
  
  if (featuredNft.scaled) {
    return featuredNft.scaled;
  }
  
  if (featuredNft.image) {
    return featuredNft.image;
  }
  
  if (featuredNft.thumbnail) {
    return featuredNft.thumbnail;
  }
  
  return null;
}