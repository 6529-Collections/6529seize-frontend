"use client";

import { useEffect, useState } from "react";

import ManifoldItemPreviewCard from "../ManifoldItemPreviewCard";
import OpenGraphPreview from "../OpenGraphPreview";
import {
  asNonEmptyString,
  type MarketplacePreviewState,
  type MarketplaceTypePreviewProps,
  pickMedia,
  toPreviewData,
} from "./common";
import { fetchLinkPreview } from "@/services/api/link-preview-api";

export default function MarketplaceTransientNftPreview({
  href,
  imageOnly = false,
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
    return (
      <OpenGraphPreview
        href={href}
        preview={undefined}
        imageOnly={imageOnly}
        hideActions={imageOnly}
      />
    );
  }

  if (state.type === "error") {
    throw state.error;
  }

  const title = asNonEmptyString(state.data.title);
  const media = pickMedia(state.data);

  if (title && media) {
    return (
      <ManifoldItemPreviewCard
        href={href}
        title={title}
        mediaUrl={media.url}
        mediaMimeType={media.mimeType}
        imageOnly={imageOnly}
        hideActions={imageOnly}
      />
    );
  }

  return (
    <OpenGraphPreview
      href={href}
      preview={toPreviewData(state.data)}
      imageOnly={imageOnly}
      hideActions={imageOnly}
    />
  );
}
