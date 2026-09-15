import type { ProposalCardLayout } from "./document";
import { getProposalCardMimeType } from "./media";

export interface ProposalFrameMetadata {
  readonly version: 1;
  readonly layout: ProposalCardLayout;
  readonly media_url: string;
  readonly mime_type: string;
  readonly preview_image: string;
}

export const PROPOSAL_FRAME_METADATA_KEY = "proposal_frame";

export function parseProposalFrameMetadata(
  value: string | undefined
): ProposalFrameMetadata | null {
  if (!value) return null;
  try {
    const data: unknown = JSON.parse(value);
    if (data === null || typeof data !== "object" || Array.isArray(data))
      return null;
    const record = data as Record<string, unknown>;
    if (
      record["version"] !== 1 ||
      !["portrait", "landscape"].includes(String(record["layout"])) ||
      typeof record["media_url"] !== "string" ||
      typeof record["mime_type"] !== "string" ||
      typeof record["preview_image"] !== "string" ||
      getProposalCardMimeType(record["mime_type"]) === undefined
    )
      return null;
    const source = new URL(record["media_url"]);
    if (
      !["https:", "ipfs:", "ipns:", "ar:"].includes(source.protocol) ||
      source.username ||
      source.password
    )
      return null;
    if (record["preview_image"]) {
      const preview = new URL(record["preview_image"]);
      if (
        !["https:", "ipfs:", "ipns:", "ar:"].includes(preview.protocol) ||
        preview.username ||
        preview.password
      )
        return null;
    }
    return {
      version: 1,
      layout: record["layout"] as ProposalCardLayout,
      media_url: record["media_url"],
      mime_type: record["mime_type"],
      preview_image: record["preview_image"],
    };
  } catch {
    return null;
  }
}
