import {
  getDropIdentityFallbackValue,
  getDropIdentityProfile,
  getDropVisibleMetadata,
} from "@/components/waves/drops/identityDisplay.helpers";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

interface WinnerIdentityArgs {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}

export const getWinnerIdentityProfile = ({
  wave,
  metadata,
}: WinnerIdentityArgs): ApiProfileMin | null => {
  return getDropIdentityProfile({ wave, metadata });
};

export const getWinnerIdentityFallbackValue = ({
  wave,
  metadata,
}: WinnerIdentityArgs): string | null => {
  return getDropIdentityFallbackValue({ wave, metadata });
};

export const getWinnerVisibleMetadata = ({
  wave,
  metadata,
}: WinnerIdentityArgs): ApiDropMetadataResponse[] => {
  return getDropVisibleMetadata({ wave, metadata });
};
