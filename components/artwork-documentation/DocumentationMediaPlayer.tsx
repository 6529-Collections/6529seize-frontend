"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationPublicPreview } from "@/generated/models/ApiArtworkDocumentationPublicPreview";
import { documentationMediaAlternatives } from "@/lib/artwork-documentation/media-alternatives";
import { useDocumentationCaption } from "@/hooks/artwork-documentation/useDocumentationCaption";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  inputClass,
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
  context,
  asset,
  publication,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly asset: ApiArtworkDocumentationAsset;
  readonly publication?: ApiArtworkDocumentationPublicPreview | undefined;
}) {
  const { actorKey } = useDocumentationActor();
  return (
    <MediaSession
      key={`${actorKey}:${context.id}:${asset.id}:${asset.sha256 ?? ""}`}
      context={context}
      asset={asset}
      publication={publication}
    />
  );
}

function MediaSession({
  context,
  asset,
  publication,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly asset: ApiArtworkDocumentationAsset;
  readonly publication?: ApiArtworkDocumentationPublicPreview | undefined;
}) {
  const contextId = context.id;
  const { msg } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failedTrack, setFailedTrack] = useState<string | null>(null);
  const alternatives = documentationMediaAlternatives(
    context,
    asset,
    publication
  );
  const [captionId, setCaptionId] = useState("");
  const caption =
    alternatives.captions.find((item) => item.asset.id === captionId) ??
    alternatives.captions[0];
  const captionResult = useDocumentationCaption(
    contextId,
    caption?.asset,
    opened,
    attempt
  );
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
  const captionFailed =
    captionResult?.failed === true || captionResult?.url === failedTrack;
  const track = captionResult?.url ? (
    <track
      key={captionResult.url}
      kind="captions"
      src={captionResult.url}
      label={caption?.asset.filename}
      srcLang={caption?.language}
      onErrorCapture={(event) => {
        event.stopPropagation();
        setFailedTrack(captionResult.url ?? null);
      }}
      default
    />
  ) : null;
  let status = "";
  if (failed || query.isError) status = msg("museum.mediaUnavailable");
  else if (opened && query.isPending) status = msg("loading");
  return (
    <div className="tw-my-5 tw-space-y-3">
      {!opened && (
        <DocumentationButton secondary onClick={() => setOpened(true)}>
          {msg("museum.openMedia")}
        </DocumentationButton>
      )}
      <p
        role="status"
        aria-atomic="true"
        className={
          status ? "tw-text-sm tw-leading-7 tw-text-iron-300" : "tw-sr-only"
        }
      >
        {status}
      </p>
      {playable &&
        (asset.detected_mime?.startsWith("audio/") ? (
          <audio
            controls
            preload="metadata"
            src={source}
            aria-label={asset.filename}
            onError={() => setFailed(true)}
            className="tw-w-full"
          >
            {track}
          </audio>
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
          >
            {track}
          </video>
        ))}
      {(failed || query.isError || captionFailed) && (
        <DocumentationButton
          secondary
          disabled={query.isFetching}
          onClick={() => {
            setFailed(false);
            setFailedTrack(null);
            setAttempt((value) => value + 1);
            void query.refetch();
          }}
        >
          {msg("retry")}
        </DocumentationButton>
      )}
      {opened && (
        <>
          <p className="tw-text-xs tw-leading-6 tw-text-iron-400">
            {msg("museum.mediaHelp")}
          </p>
          {alternatives.captions.length > 1 && (
            <label className="tw-block tw-text-sm tw-text-iron-300">
              {msg("museum.captionFile")}
              <select
                className={`${inputClass} tw-mt-2`}
                value={caption?.asset.id ?? ""}
                onChange={(event) => setCaptionId(event.target.value)}
              >
                {alternatives.captions.map((item) => (
                  <option key={item.asset.id} value={item.asset.id}>
                    {item.asset.filename}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p
            role="status"
            aria-atomic="true"
            className={
              captionFailed
                ? "tw-text-sm tw-leading-7 tw-text-iron-300"
                : "tw-sr-only"
            }
          >
            {captionFailed ? msg("museum.captionsUnavailable") : ""}
          </p>
          {!caption && alternatives.transcripts.length === 0 && (
            <p className="tw-text-sm tw-leading-7 tw-text-iron-400">
              {msg("museum.mediaAlternativeMissing")}
            </p>
          )}
          {alternatives.transcripts.map((transcript) => (
            <details key={transcript.id}>
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-sm tw-text-primary-300">
                {msg("museum.readTranscript")}
              </summary>
              <div
                tabIndex={0}
                role="region"
                aria-label={msg("museum.readTranscript")}
                lang={transcript.language}
                dir="auto"
                className="tw-max-h-96 tw-overflow-y-auto tw-whitespace-pre-wrap tw-break-words tw-font-serif tw-text-lg tw-leading-8"
              >
                {transcript.text}
              </div>
            </details>
          ))}
        </>
      )}
    </div>
  );
}
