const NFT_MEDIA_RENDERER_ATTRIBUTE = "data-nft-media-renderer";

type NFTMediaRendererType = "image" | "video" | "html" | "glb";

export function getNFTMediaRendererAttributes(mediaType: NFTMediaRendererType) {
  return {
    [NFT_MEDIA_RENDERER_ATTRIBUTE]: mediaType,
  };
}
