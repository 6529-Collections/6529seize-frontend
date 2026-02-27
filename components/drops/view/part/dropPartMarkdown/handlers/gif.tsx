import { renderGifEmbed } from "../renderers";
import type { LinkHandler } from "../linkTypes";
import type { LinkPreviewVariant } from "@/components/waves/LinkPreviewContext";
import { isTenorGifUrl } from "@/components/waves/drops/gifPreview";

export const createGifHandler = (options?: {
  readonly linkPreviewVariant?: LinkPreviewVariant;
}): LinkHandler => ({
  match: isTenorGifUrl,
  render: (href) =>
    renderGifEmbed(href, {
      fixedSize: options?.linkPreviewVariant !== "home",
    }),
  display: "block",
});
