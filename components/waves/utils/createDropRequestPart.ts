import type { CreateDropRequestPart } from "@/entities/IDrop";
import type { ApiCreateDropMedia } from "@/generated/models/ApiCreateDropMedia";
import type { ApiCreateDropPart } from "@/generated/models/ApiCreateDropPart";

type UploadedDropMedia = CreateDropRequestPart["media"][number];

const toApiCreateDropMedia = (media: UploadedDropMedia): ApiCreateDropMedia => {
  const requestMedia: ApiCreateDropMedia = {
    url: media.url,
    mime_type: media.mime_type,
  };

  if (media.media_upload_id !== undefined && media.media_upload_id !== null) {
    requestMedia.media_upload_id = media.media_upload_id;
  }

  return requestMedia;
};

export const toApiCreateDropPart = (
  part: CreateDropRequestPart
): ApiCreateDropPart => {
  const requestPart: ApiCreateDropPart = {
    content: part.content,
    quoted_drop: part.quoted_drop,
    media: part.media.map(toApiCreateDropMedia),
  };

  if (part.attachments !== undefined && part.attachments.length > 0) {
    requestPart.attachments = part.attachments;
  }

  return requestPart;
};
