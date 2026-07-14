import type { CreateDropPart, CreateDropRequestPart } from "@/entities/IDrop";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";
import { isAttachmentUploadFile } from "@/services/uploads/attachmentUploadMimeType";
import type React from "react";
import {
  multiPartAttachmentUpload,
  multiPartUpload,
} from "../create-wave/services/multiPartUpload";
import { toApiCreateDropPart } from "../utils/createDropRequestPart";
import type { UploadingFile } from "./types";

const generateMediaForPart = async (
  media: File,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
) => {
  setUploadingFiles((prev) => [
    ...prev,
    { file: media, isUploading: true, progress: 0, phase: "uploading" },
  ]);
  return await multiPartUpload({
    file: media,
    path: "drop",
    waitForReady: false,
    onProgress: (progress) =>
      setUploadingFiles((prev) =>
        prev.map((uf) => (uf.file === media ? { ...uf, progress } : uf))
      ),
    onProcessing: () =>
      setUploadingFiles((prev) =>
        prev.map((uf) =>
          uf.file === media ? { ...uf, progress: 100, phase: "processing" } : uf
        )
      ),
  }).finally(() => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== media));
  });
};

const generateAttachmentForPart = async (
  attachment: File,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
) => {
  setUploadingFiles((prev) => [
    ...prev,
    { file: attachment, isUploading: true, progress: 0, phase: "uploading" },
  ]);
  return await multiPartAttachmentUpload({
    file: attachment,
    onProgress: (progress) =>
      setUploadingFiles((prev) =>
        prev.map((uf) => (uf.file === attachment ? { ...uf, progress } : uf))
      ),
  }).finally(() => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== attachment));
  });
};

const generatePart = async (
  part: CreateDropPart,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
): Promise<CreateDropRequestPart> => {
  const mediaFiles = part.media.filter((file) => !isAttachmentUploadFile(file));
  const attachmentFiles = part.media.filter(isAttachmentUploadFile);
  const media = await Promise.all(
    mediaFiles.map((mediaFile) =>
      generateMediaForPart(mediaFile, setUploadingFiles)
    )
  );
  const uploadedAttachments = await Promise.all(
    attachmentFiles.map((attachment) =>
      generateAttachmentForPart(attachment, setUploadingFiles)
    )
  );
  const badAttachment = uploadedAttachments.find(
    (attachment) => attachment.status === ApiAttachmentStatus.Bad
  );
  if (badAttachment) {
    throw new Error(
      badAttachment.error_reason ??
        `${badAttachment.file_name} failed attachment validation.`
    );
  }
  return {
    content: part.content,
    quoted_drop: part.quoted_drop,
    media,
    attachments: uploadedAttachments.map((attachment) => ({
      attachment_id: attachment.attachment_id,
    })),
    uploaded_attachments: uploadedAttachments,
  };
};

export const generateParts = async (
  parts: CreateDropPart[],
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
): Promise<CreateDropRequestPart[]> => {
  try {
    return await Promise.all(
      parts.map((part) => generatePart(part, setUploadingFiles))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("content_type") ||
      message.includes("Unsupported file type")
    ) {
      throw new Error("File type not supported.");
    }
    throw new Error("Error uploading file. Please try again.");
  }
};

export const toApiCreateDropParts = (
  parts: CreateDropRequestPart[]
): ApiCreateDropRequest["parts"] => parts.map(toApiCreateDropPart);
