import { useMemo } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { getIdentitySubmissionMetadataErrors } from "../utils/identitySubmissionMetadataValidation";
import { getMetadataNameErrors } from "./content-helpers";
import type { CreateDropMetadataType } from "./types";

export function useCreateDropMetadataErrors({
  isDropMode,
  isIdentitySubmissionExperience,
  locale,
  metadata,
}: {
  readonly isDropMode: boolean;
  readonly isIdentitySubmissionExperience: boolean;
  readonly locale: SupportedLocale;
  readonly metadata: CreateDropMetadataType[];
}): Record<string, string> {
  return useMemo(
    () => ({
      ...getMetadataNameErrors(metadata, locale),
      ...getIdentitySubmissionMetadataErrors({
        isIdentitySubmissionExperience:
          isIdentitySubmissionExperience && isDropMode,
        metadata,
      }),
    }),
    [isDropMode, isIdentitySubmissionExperience, locale, metadata]
  );
}
