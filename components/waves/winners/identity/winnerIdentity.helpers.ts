import { getDropVisibleMetadata } from "@/components/waves/drops/identityDisplay.helpers";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

interface WinnerIdentityArgs {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}

export const getWinnerVisibleMetadata = ({
  wave,
  metadata,
}: WinnerIdentityArgs): ApiDropMetadataResponse[] => {
  return getDropVisibleMetadata({ wave, metadata });
};

export {
  getDropIdentityFallbackValue as getWinnerIdentityFallbackValue,
  getDropIdentityProfile as getWinnerIdentityProfile,
} from "@/components/waves/drops/identityDisplay.helpers";
