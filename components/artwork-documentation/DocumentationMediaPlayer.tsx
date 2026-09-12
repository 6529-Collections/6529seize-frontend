"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";

export function canPlayDocumentationAsset(
  asset: ApiArtworkDocumentationAsset
): boolean {
  return (
    asset.state === "ready" &&
    asset.has_media_preview === true &&
    /^(audio|video)\//.test(asset.detected_mime ?? "")
  );
}

/** Only the server's passive-media rendition is playable; source code and HTML stay downloads. */
export default function DocumentationMediaPlayer({
  contextId,
  asset,
}: {
  readonly contextId: string;
  readonly asset: ApiArtworkDocumentationAsset;
}) {
  const { msg } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      contextId,
      "passive-media",
      actorKey,
      asset.id
    ),
    queryFn: ({ signal }) =>
      downloadDocumentationAsset(contextId, asset.id, "media", signal),
    enabled: opened && canPlayDocumentationAsset(asset),
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  if (!canPlayDocumentationAsset(asset)) return null;
  const source = query.data?.url;
  const playable = !!source && /^https?:\/\//i.test(source) && !failed;
  return (
    <div className="tw-my-5 tw-space-y-3">
      {!opened && (
        <DocumentationButton secondary onClick={() => setOpened(true)}>
          {msg("museum.openMedia")}
        </DocumentationButton>
      )}
      {opened && query.isPending && (
        <p role="status" className="tw-text-sm tw-text-iron-400">
          {msg("loading")}
        </p>
      )}
      {playable &&
        (asset.detected_mime?.startsWith("audio/") ? (
          <audio
            controls
            preload="metadata"
            src={source}
            aria-label={asset.filename}
            onError={() => setFailed(true)}
            className="tw-w-full"
          />
        ) : (
          // The source is a scanned passive video. Captions may be deposited separately; never invent a track.
          <video
            controls
            playsInline
            preload="metadata"
            src={source}
            aria-label={asset.filename}
            onError={() => setFailed(true)}
            className="tw-max-h-[70vh] tw-w-full"
          />
        ))}
      {(failed || query.isError) && (
        <p role="status" className="tw-text-sm tw-leading-7 tw-text-iron-300">
          {msg("museum.mediaUnavailable")}
        </p>
      )}
      {opened && (
        <p className="tw-text-xs tw-leading-6 tw-text-iron-400">
          {msg("museum.mediaHelp")}
        </p>
      )}
    </div>
  );
}
