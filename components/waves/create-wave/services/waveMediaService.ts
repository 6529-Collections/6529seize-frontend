import type { CreateDropPart, CreateDropRequestPart } from "@/entities/IDrop";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";
import type { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { isAttachmentUploadFile } from "@/services/uploads/attachmentUploadMimeType";
import { multiPartAttachmentUpload, multiPartUpload } from "./multiPartUpload";

/**
 * Generates a drop part with uploaded media
 * @param part CreateDropPart to process
 * @param purpose What the part's media is for (chat or decision entry)
 * @returns Promise with CreateDropRequestPart
 */
export const generateDropPart = async (
  part: CreateDropPart,
  purpose: ApiMediaUploadPurpose
): Promise<CreateDropRequestPart> => {
  const mediaFiles = part.media.filter(
    (media) => !isAttachmentUploadFile(media)
  );
  const attachmentFiles = part.media.filter(isAttachmentUploadFile);
  const media = await Promise.all(
    mediaFiles.map((file) => multiPartUpload({ file, path: "drop", purpose }))
  );
  const attachments = await Promise.all(
    attachmentFiles.map((file) => multiPartAttachmentUpload({ file }))
  );
  const badAttachment = attachments.find(
    (attachment) => attachment.status === ApiAttachmentStatus.Bad
  );
  if (badAttachment) {
    throw new Error(
      badAttachment.error_reason ??
        `${badAttachment.file_name} failed attachment validation.`
    );
  }
  return {
    ...part,
    media,
    attachments: attachments.map((attachment) => ({
      attachment_id: attachment.attachment_id,
    })),
    uploaded_attachments: attachments,
  };
};
