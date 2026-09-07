"use client";

import type { CreateDropConfig, CreateDropPart } from "@/entities/IDrop";
import DropPartContent from "@/components/drops/view/part/DropPartContent";
import { useObjectUrls } from "@/hooks/useObjectUrl";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

function DescriptionPart({
  part,
  description,
  index,
}: {
  readonly part: CreateDropPart;
  readonly description: CreateDropConfig;
  readonly index: number;
}) {
  const media = part.media;
  const mediaUrls = useObjectUrls(media);
  return (
    <div className="tw-min-w-0 tw-space-y-3 tw-break-words">
      <DropPartContent
        mentionedUsers={description.mentioned_users}
        mentionedGroups={description.mentioned_groups ?? []}
        mentionedWaves={description.mentioned_waves ?? []}
        referencedNfts={description.referenced_nfts}
        partContent={part.content}
        onQuoteClick={() => undefined}
        partMedias={media.flatMap((file, mediaIndex) => {
          const mediaSrc = mediaUrls[mediaIndex];
          return mediaSrc ? [{ mimeType: file.type, mediaSrc }] : [];
        })}
        currentPartCount={index}
      />
      {part.uploaded_attachments?.map((attachment) => (
        <p
          key={attachment.attachment_id}
          className="tw-m-0 tw-text-sm tw-text-iron-300"
        >
          {attachment.file_name}
        </p>
      ))}
    </div>
  );
}

export default function CreateWaveReviewDescription({
  description,
}: {
  readonly description: CreateDropConfig;
}) {
  const locale = useBrowserLocale();
  return (
    <section
      className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-4"
      aria-labelledby="create-wave-review-description"
    >
      <h3
        id="create-wave-review-description"
        className={CREATE_WAVE_FORM_STYLES.sectionTitle}
      >
        {t(locale, "waves.create.description.title")}
      </h3>
      {description.title && (
        <p className="tw-m-0 tw-break-words tw-text-base tw-font-semibold tw-text-iron-100">
          {description.title}
        </p>
      )}
      {description.parts.map((part, index) => (
        <DescriptionPart
          key={part.clientId ?? part.id ?? index}
          part={part}
          description={description}
          index={index}
        />
      ))}
    </section>
  );
}
