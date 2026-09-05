import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { toApiCreateDropMedia } from "@/components/waves/utils/createDropRequestPart";
import type { OperationalData } from "../types/OperationalData";
import type { TraitsData } from "../types/TraitsData";
import { buildSubmissionMetadata } from "./submissionMetadata";

export const transformToApiRequest = (data: {
  waveId: string;
  traits: TraitsData;
  operationalData?: OperationalData | undefined;
  isAdditionalActionPromised?: boolean | undefined;
  media: ApiDropMedia;
  signerAddress: string;
  isSafeSignature: boolean;
}): ApiCreateDropRequest => {
  const {
    waveId,
    traits,
    operationalData,
    isAdditionalActionPromised = false,
    media,
    signerAddress,
    isSafeSignature,
  } = data;

  return {
    wave_id: waveId,
    drop_type: ApiDropType.Participatory,
    is_additional_action_promised: isAdditionalActionPromised,
    title: traits.title,
    parts: [
      {
        content: traits.description,
        media: [toApiCreateDropMedia(media)],
      },
    ],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: buildSubmissionMetadata({ traits, operationalData }),
    signature: null,
    is_safe_signature: isSafeSignature,
    signer_address: signerAddress,
  };
};
