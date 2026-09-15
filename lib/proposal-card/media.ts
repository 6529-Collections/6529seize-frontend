import { ApiProposalFrameRequestMimeTypeEnum } from "@/generated/models/ApiProposalFrameRequest";

export function getProposalCardMimeType(
  mimeType: string
): ApiProposalFrameRequestMimeTypeEnum | undefined {
  return Object.values(ApiProposalFrameRequestMimeTypeEnum).find(
    (value) => String(value) === mimeType
  );
}
