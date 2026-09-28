"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import { commonApiFetch } from "@/services/api/common-api";
import { competitionScope } from "@/services/api/competitions-api";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import DropAttachmentDisplay from "@/components/drops/view/item/content/attachments/DropAttachmentDisplay";
import { CompetitionState } from "./CompetitionState";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import DropPartMarkdown from "@/components/drops/view/part/DropPartMarkdown";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";

/** Entry snapshots stay in the competition cache, separate from mutable chat drops. */
export default function CompetitionEntryContent({
  content,
  dropId,
}: {
  readonly content: ApiCreateDropRequest;
  readonly dropId: string;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-min-w-0 tw-space-y-4">
      {content.metadata.length > 0 && (
        <dl className="tw-grid tw-grid-cols-1 tw-gap-3 tw-text-sm sm:tw-grid-cols-2">
          {content.metadata.map((item) => (
            <div key={item.data_key} className="tw-min-w-0">
              <dt className="tw-text-iron-400">{item.data_key}</dt>
              <dd className="tw-m-0 tw-break-words tw-text-iron-100">
                {item.data_value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {content.parts.map((part, index) => (
        <div key={`${dropId}:${index}`} className="tw-min-w-0 tw-space-y-3">
          {part.quoted_drop && (
            <Link
              className="tw-text-sm tw-text-primary-400"
              href={getWaveRoute({
                waveId: content.wave_id,
                extraParams: { drop: part.quoted_drop.drop_id },
                isDirectMessage: false,
                isApp: false,
              })}
            >
              {t(locale, "competitions.quotedDrop")}
            </Link>
          )}
          <DropPartMarkdown
            mentionedUsers={content.mentioned_users}
            mentionedGroups={content.mentioned_groups}
            mentionedWaves={content.mentioned_waves ?? []}
            referencedNfts={content.referenced_nfts}
            partContent={part.content ?? null}
            currentDropId={dropId}
            hideLinkPreviews={content.hide_link_preview}
            onQuoteClick={() => undefined}
          />
          {part.attachments?.map((attachment) => (
            <EntryAttachment
              key={attachment.attachment_id}
              id={attachment.attachment_id}
            />
          ))}
          {part.media.map((media) => (
            <DropListItemContentMedia
              key={media.url}
              media_mime_type={media.mime_type}
              media_url={media.url}
              disableAutoPlay
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EntryAttachment({ id }: { readonly id: string }) {
  const { competition } = useCompetition();
  const viewer = useCompetitionViewer();
  const query = useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      {
        ...competitionScope({
          waveId: competition.wave_id,
          competitionId: competition.id,
        }),
        viewer,
      },
      "attachment",
      id,
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiAttachment>({
        endpoint: `attachments/${encodeURIComponent(id)}`,
        signal,
        errorMode: "structured",
      }),
    retry: false,
  });
  if (query.isPending) return <CompetitionState />;
  if (query.isError || !query.data.url) return <CompetitionState error />;
  return (
    <DropAttachmentDisplay
      mimeType={query.data.mime_type}
      attachmentUrl={query.data.url}
      fileName={query.data.file_name}
      safety={query.data.safety}
    />
  );
}
