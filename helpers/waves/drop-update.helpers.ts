import type { ApiCreateDropPart } from "@/generated/models/ApiCreateDropPart";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiUpdateDropRequest } from "@/generated/models/ApiUpdateDropRequest";

interface BuildDropUpdateRequestParams {
  readonly drop: ApiDrop;
  readonly activePartIndex: number;
  readonly newContent: string;
  readonly mentions?: ApiDropMentionedUser[] | undefined;
  readonly mentionedWaves?: ApiMentionedWave[] | undefined;
}

const buildAttachmentReferences = (
  attachments: ApiDropPart["attachments"] | null | undefined
) =>
  (attachments ?? []).map((attachment) => ({
    attachment_id: attachment.attachment_id,
  }));

export const buildDropUpdateRequest = ({
  drop,
  activePartIndex,
  newContent,
  mentions,
  mentionedWaves,
}: BuildDropUpdateRequestParams): ApiUpdateDropRequest => {
  // Exclude response-only fields such as current_handle from update requests.
  const cleanedMentions = (mentions ?? drop.mentioned_users).map((user) => ({
    mentioned_profile_id: user.mentioned_profile_id,
    handle_in_content: user.handle_in_content,
  }));
  const cleanedWaves = (mentionedWaves ?? drop.mentioned_waves).map((wave) => ({
    wave_id: wave.wave_id,
    wave_name_in_content: wave.wave_name_in_content,
  }));
  const updatedParts: ApiCreateDropPart[] = drop.parts.map((part, index) => {
    const attachments = buildAttachmentReferences(part.attachments);
    const requestPart: ApiCreateDropPart = {
      content: index === activePartIndex ? newContent : part.content,
      quoted_drop: part.quoted_drop ?? null,
      media: part.media,
    };

    if (attachments.length) {
      requestPart.attachments = attachments;
    }

    return requestPart;
  });

  return {
    parts: updatedParts,
    title: drop.title,
    metadata: drop.metadata,
    referenced_nfts: drop.referenced_nfts,
    mentioned_users: cleanedMentions,
    mentioned_waves: cleanedWaves,
    signature: null,
  };
};
