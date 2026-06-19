import type { CreateDropConfig } from "@/entities/IDrop";
import type { ApiCreateDropPart } from "@/generated/models/ApiCreateDropPart";
import type { ApiCreateWaveDropRequest } from "@/generated/models/ApiCreateWaveDropRequest";
import { generateDropPart } from "./waveMediaService";

export const getCreateWaveDropRequest = async (
  drop: CreateDropConfig
): Promise<ApiCreateWaveDropRequest> => {
  const dropParts = await Promise.all(
    drop.parts.map((part) => generateDropPart(part))
  );

  return {
    title: drop.title ?? null,
    parts: dropParts.map((part): ApiCreateDropPart => {
      const requestPart: ApiCreateDropPart = {
        content: part.content,
        quoted_drop: part.quoted_drop,
        media: part.media,
      };

      const attachments = part.attachments;
      if (attachments !== undefined && attachments.length > 0) {
        requestPart.attachments = attachments;
      }

      return requestPart;
    }),
    referenced_nfts: drop.referenced_nfts.map((nft) => ({
      contract: nft.contract,
      token: nft.token,
      name: nft.name,
    })),
    mentioned_users: drop.mentioned_users.map((user) => ({
      mentioned_profile_id: user.mentioned_profile_id,
      handle_in_content: user.handle_in_content,
    })),
    metadata: drop.metadata.map((meta) => ({
      data_key: meta.data_key,
      data_value: meta.data_value,
    })),
    signature: null,
  };
};
