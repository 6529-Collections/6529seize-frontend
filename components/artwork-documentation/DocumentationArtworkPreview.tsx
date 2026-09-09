"use client";

import { useEffect, useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import {
  answerValue,
  documentationTitle,
} from "@/lib/artwork-documentation/answers";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { useDocumentationMessages } from "./DocumentationControls";

export default function DocumentationArtworkPreview({
  context,
}: {
  readonly context: ApiArtworkDocumentationContext;
}) {
  const { msg } = useDocumentationMessages();
  const assetId = answerValue(context, "artwork", "canonical_asset_id");
  const asset = context.assets.find((item) => item.id === assetId);
  const previewAssetId = asset?.id;
  const previewAssetState = asset?.state;
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(
    null
  );
  useEffect(() => {
    if (previewAssetId === undefined || previewAssetState !== "ready") return;
    const abort = new AbortController();
    void downloadDocumentationAsset(
      context.id,
      previewAssetId,
      "preview",
      abort.signal
    )
      .then((result) => {
        if (!abort.signal.aborted)
          setPreview({ id: previewAssetId, url: result.url });
      })
      .catch(() => {
        if (!abort.signal.aborted) setPreview(null);
      });
    return () => abort.abort();
  }, [context.id, previewAssetId, previewAssetState]);
  if (!asset) return null;
  return (
    <figure className="tw-m-0 tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4">
      {preview?.id === asset.id ? (
        // Signed private previews must load directly, outside the Next optimizer and shared cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.url}
          alt={documentationTitle(context) ?? msg("untitled")}
          className="tw-max-h-80 tw-w-full tw-object-contain"
        />
      ) : (
        <figcaption className="tw-text-xs tw-text-iron-400">
          {msg("noPreview")}
        </figcaption>
      )}
    </figure>
  );
}
