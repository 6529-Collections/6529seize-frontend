"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationPublicPreview } from "@/generated/models/ApiArtworkDocumentationPublicPreview";
import { isRedacted } from "@/lib/artwork-documentation/answers";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useDocumentationActor } from "./DocumentationAuthGate";
import { useDocumentationMessages } from "./DocumentationControls";

interface Props {
  readonly context: ApiArtworkDocumentationContext;
  readonly allowSubmissionReference?: boolean;
  readonly compact?: boolean;
  readonly publication?: ApiArtworkDocumentationPublicPreview | undefined;
}

export function ArtworkImage({
  url,
  title,
  compact,
}: {
  readonly url: string;
  readonly title: string;
  readonly compact: boolean;
}) {
  const { msg } = useDocumentationMessages();
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <p className="tw-m-0 tw-py-8 tw-text-sm tw-text-iron-400">
        {msg("noPreview")}
      </p>
    );
  return (
    // Authorized media loads directly, outside the Next optimizer and shared cache.
    <img
      src={url}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={
        compact
          ? "tw-block tw-max-h-64 tw-w-full tw-object-contain"
          : "tw-block tw-max-h-[70vh] tw-w-full tw-object-contain"
      }
    />
  );
}

function CanonicalPreview({
  context,
  assetId,
  compact = false,
  title,
}: Props & { readonly assetId: string; readonly title: string }) {
  const { msg } = useDocumentationMessages();
  const { actorKey, connectedProfile } = useDocumentationActor();
  const asset = context.assets.find((item) => item.id === assetId);
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "artwork-image",
      actorKey,
      assetId
    ),
    queryFn: ({ signal }) =>
      downloadDocumentationAsset(context.id, assetId, "preview", signal),
    enabled: asset?.state === "ready",
    retry: false,
    gcTime: 0,
    staleTime: 0,
    meta: { persist: false },
  });
  return (
    <figure className="tw-m-0 tw-min-w-0">
      <div className="tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-bg-iron-950 tw-p-5 sm:tw-p-8">
        {query.data ? (
          <ArtworkImage
            key={query.data.url}
            url={query.data.url}
            title={title}
            compact={compact}
          />
        ) : (
          <p className="tw-m-0 tw-py-8 tw-text-sm tw-text-iron-400">
            {msg(query.isLoading ? "loading" : "noPreview")}
          </p>
        )}
      </div>
      <figcaption className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
        {msg("editorial.finalArtwork")}
      </figcaption>
    </figure>
  );
}

function SubmissionReference({ context, compact = false }: Props) {
  const { msg } = useDocumentationMessages();
  const { actorKey, connectedProfile } = useDocumentationActor();
  const source = context.source_links[0];
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "submission-image",
      actorKey,
      source?.drop_id ?? "none"
    ),
    queryFn: async ({ signal }) => {
      if (!source) return null;
      const drops = await fetchDropsV2ByIds({
        dropIds: [source.drop_id],
        signal,
      });
      return (
        drops.find(
          (drop) =>
            drop.id === source.drop_id &&
            drop.wave.id === source.wave_id &&
            drop.author.id === source.author_profile_id
        ) ?? null
      );
    },
    enabled: !!source,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const drop = query.data;
  const image =
    drop?.moderation?.can_view === false
      ? undefined
      : drop?.parts
          .flatMap((part) => part.media)
          .find(
            (media) =>
              media.mime_type.startsWith("image/") &&
              (!media.media_status || media.media_status === "ready") &&
              media.url.startsWith("https://")
          );
  if (!image) return null;
  return (
    <figure className="tw-m-0 tw-min-w-0">
      <div className="tw-bg-iron-950 tw-p-5 sm:tw-p-8">
        <ArtworkImage
          key={image.url}
          url={image.url}
          title={drop?.title ?? msg("editorial.submissionImage")}
          compact={compact}
        />
      </div>
      <figcaption className="tw-mt-3 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-400">
        <span className="tw-font-medium tw-text-iron-300">
          {msg("editorial.submissionReference")}
        </span>
        {drop?.title && (
          <span className="tw-ml-2 tw-break-words">{drop.title}</span>
        )}
        <span className="tw-mt-1 tw-block">
          {msg("editorial.submissionReferenceHelp")}
        </span>
      </figcaption>
    </figure>
  );
}

export default function DocumentationArtworkPreview({
  context,
  allowSubmissionReference = false,
  compact = false,
  publication,
}: Props) {
  const { msg } = useDocumentationMessages();
  const answers = (publication ?? context).modules["artwork"]?.answers;
  const assetAnswer = answers?.["canonical_asset_id"];
  const titleAnswer = answers?.["title"];
  const assetId =
    assetAnswer &&
    !isRedacted(assetAnswer) &&
    assetAnswer.status === "provided" &&
    typeof assetAnswer.value === "string"
      ? assetAnswer.value
      : null;
  const title =
    titleAnswer &&
    !isRedacted(titleAnswer) &&
    titleAnswer.status === "provided" &&
    typeof titleAnswer.value === "string"
      ? titleAnswer.value
      : msg("untitled");
  if (assetId)
    return (
      <CanonicalPreview
        context={context}
        assetId={assetId}
        title={title}
        compact={compact}
      />
    );
  return !publication &&
    allowSubmissionReference &&
    context.source_links.length ? (
    <SubmissionReference context={context} compact={compact} />
  ) : null;
}
