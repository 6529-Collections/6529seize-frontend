"use client";

import { useEffect, useState } from "react";

import MarketplaceItemPreviewCard from "../MarketplaceItemPreviewCard";
import MarketplacePreviewPlaceholder from "./MarketplacePreviewPlaceholder";
import MarketplaceUnavailableCard from "./MarketplaceUnavailableCard";
import {
  asNonEmptyString,
  type MarketplacePreviewState,
  type MarketplaceTypePreviewProps,
  pickMedia,
} from "./common";
import { fetchLinkPreview } from "@/services/api/link-preview-api";

export default function MarketplaceTransientMintPreview({
  href,
  compact = false,
}: MarketplaceTypePreviewProps) {
  const [state, setState] = useState<MarketplacePreviewState>({
    type: "loading",
    href,
  });

  useEffect(() => {
    let active = true;

    const loadPreview = async (): Promise<void> => {
      try {
        const response = await fetchLinkPreview(href);
        if (!active) {
          return;
        }

        setState({ type: "success", href, data: response });
      } catch (error: unknown) {
        if (!active) {
          return;
        }

        setState({
          type: "error",
          href,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to load marketplace preview"),
        });
      }
    };

    void loadPreview();

    return () => {
      active = false;
    };
  }, [href]);

  if (state.href !== href || state.type === "loading") {
    return <MarketplacePreviewPlaceholder href={href} compact={compact} />;
  }

  if (state.type === "error") {
    return <MarketplaceUnavailableCard href={href} compact={compact} />;
  }

  const title = asNonEmptyString(state.data.title);
  const media = pickMedia(state.data);

  if (title && media) {
    return (
      <MarketplaceItemPreviewCard
        href={href}
        title={title}
        mediaUrl={media.url}
        mediaMimeType={media.mimeType}
        compact={compact}
        hideActions={compact}
      />
    );
  }

  return <MarketplaceUnavailableCard href={href} compact={compact} />;
}
