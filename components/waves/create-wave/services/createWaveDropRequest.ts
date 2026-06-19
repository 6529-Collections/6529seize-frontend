import type { CreateDropConfig } from "@/entities/IDrop";
import type { ApiCreateWaveDropRequest } from "@/generated/models/ApiCreateWaveDropRequest";
import { toApiCreateDropPart } from "../../utils/createDropRequestPart";
import { generateDropPart } from "./waveMediaService";

export const getCreateWaveDropRequest = async (
  drop: CreateDropConfig
): Promise<ApiCreateWaveDropRequest> => {
  const dropParts = await Promise.all(
    drop.parts.map((part) => generateDropPart(part))
  );

  return {
    title: drop.title ?? null,
    parts: dropParts.map(toApiCreateDropPart),
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
