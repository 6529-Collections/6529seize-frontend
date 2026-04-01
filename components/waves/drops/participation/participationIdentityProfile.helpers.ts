import {
  getDropIdentityProfile,
  getDropVisibleMetadata,
} from "@/components/waves/drops/identityDisplay.helpers";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

export const getParticipationIdentityProfile = ({
  wave,
  metadata,
}: {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}): ApiProfileMin | null => {
  return getDropIdentityProfile({ wave, metadata });
};

export const getParticipationVisibleMetadata = ({
  wave,
  metadata,
}: {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}): ApiDropMetadataResponse[] => {
  return getDropVisibleMetadata({ wave, metadata });
};
