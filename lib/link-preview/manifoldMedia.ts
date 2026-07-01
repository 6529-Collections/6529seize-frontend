const MANIFOLD_ASSETS_HOST = "assets.manifold.xyz";
const MANIFOLD_PREVIEW_IMAGE_WIDTH = 800;

export const getManifoldPreviewImageUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== MANIFOLD_ASSETS_HOST) {
      return url;
    }

    const match = /^\/original\/([^/]+)\.(jpe?g|png|webp)$/i.exec(
      parsed.pathname
    );
    const assetId = match?.[1];
    const extensionCandidate = match?.[2];
    if (!assetId || !extensionCandidate) {
      return url;
    }

    const lowerExtension = extensionCandidate.toLowerCase();
    const extension = lowerExtension === "jpeg" ? "jpg" : lowerExtension;
    parsed.pathname = `/optimized/${assetId}/w_${MANIFOLD_PREVIEW_IMAGE_WIDTH}.${extension}`;
    return parsed.toString();
  } catch {
    return url;
  }
};
