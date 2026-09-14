import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import {
  ApiProposalFrameRequestLayoutEnum,
  type ApiProposalFrameRequest,
} from "@/generated/models/ApiProposalFrameRequest";
import type { ApiProposalFrameResponse } from "@/generated/models/ApiProposalFrameResponse";
import type { ProposalCardLayout } from "@/lib/proposal-card/document";
import { getProposalCardMimeType } from "@/lib/proposal-card/media";
import type { ProposalFrameMetadata } from "@/lib/proposal-card/metadata";
import { createProposalCardThumbnail } from "@/lib/proposal-card/thumbnail";
import { commonApiPost } from "@/services/api/common-api";
import type { OperationalData } from "../types/OperationalData";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export async function prepareProposalCard({
  media,
  layout,
  title,
  locale = DEFAULT_LOCALE,
  operationalData,
  uploadThumbnail,
  assertIdentity,
}: {
  readonly media: ApiDropMedia;
  readonly layout: ProposalCardLayout;
  readonly title: string;
  readonly locale?: SupportedLocale;
  readonly operationalData: OperationalData | undefined;
  readonly uploadThumbnail: (file: File) => Promise<ApiDropMedia>;
  readonly assertIdentity: () => void;
}) {
  const artworkTitle = title.trim();
  if (!artworkTitle)
    throw new Error(t(locale, "memes.proposalFrame.missingTitle"));
  const mimeType = getProposalCardMimeType(media.mime_type);
  if (mimeType === undefined)
    throw new Error("Proposal frames support images, video, and HTML.");
  const existingPreview = operationalData?.additional_media.preview_image ?? "";
  const imageSource = media.mime_type.startsWith("image/") ? media.url : "";
  const previewSource =
    existingPreview.length > 0 ? existingPreview : imageSource;
  if (!previewSource || !operationalData) {
    throw new Error("Add a preview image for this proposal card.");
  }
  assertIdentity();
  const thumbnail = await createProposalCardThumbnail(previewSource, layout);
  assertIdentity();
  const uploadedThumbnail = await uploadThumbnail(thumbnail);
  assertIdentity();
  const framedMedia = await commonApiPost<
    ApiProposalFrameRequest,
    ApiProposalFrameResponse
  >({
    endpoint: "drop-media/proposal-frame",
    body: {
      media_url: media.url,
      mime_type: mimeType,
      title: artworkTitle,
      layout:
        layout === "portrait"
          ? ApiProposalFrameRequestLayoutEnum.Portrait
          : ApiProposalFrameRequestLayoutEnum.Landscape,
    },
  });
  assertIdentity();
  const metadata: ProposalFrameMetadata = {
    version: 1,
    layout,
    media_url: media.url,
    mime_type: media.mime_type,
    preview_image: operationalData.additional_media.preview_image,
  };
  return {
    media: framedMedia,
    metadata,
    operationalData: {
      ...operationalData,
      additional_media: {
        ...operationalData.additional_media,
        preview_image: uploadedThumbnail.url,
      },
    },
  };
}
