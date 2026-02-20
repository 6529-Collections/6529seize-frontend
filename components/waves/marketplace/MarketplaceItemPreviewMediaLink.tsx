import Link from "next/link";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import type { ResolvedPreviewHref } from "./MarketplaceItemPreviewCard.types";
import { MARKETPLACE_MEDIA_FRAME_CLASS } from "./previewLayout";

interface MarketplaceItemPreviewMediaLinkProps {
  readonly mediaUrl: string;
  readonly mediaMimeType: string;
  readonly resolvedPreviewHref: ResolvedPreviewHref;
}

export default function MarketplaceItemPreviewMediaLink({
  mediaUrl,
  mediaMimeType,
  resolvedPreviewHref,
}: MarketplaceItemPreviewMediaLinkProps) {
  const { href, target, rel } = resolvedPreviewHref;
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      prefetch={false}
      className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-no-underline"
      data-testid="marketplace-item-media-link"
    >
      <div
        className={`${MARKETPLACE_MEDIA_FRAME_CLASS} tw-relative`}
        data-testid="manifold-item-media"
      >
        <MediaDisplay
          media_mime_type={mediaMimeType}
          media_url={mediaUrl}
          disableMediaInteraction={true}
        />
      </div>
    </Link>
  );
}
