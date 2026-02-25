"use client";

import React, { useCallback } from "react";
import type { TraitsData } from "./submission/types/TraitsData";
import { Section, TraitField } from "./traits";
import { getFormSections } from "./traits/schema";
import { useAuth } from "@/components/auth/Auth";

interface MemesArtSubmissionTraitsProps {
  readonly traits: TraitsData;
  readonly setTraits: (traits: Partial<TraitsData>) => void;
  readonly showTitle?: boolean | undefined;
  readonly validationErrors?:
    | Record<keyof TraitsData, string | null>
    | undefined;
  readonly onFieldBlur?:
    | ((field: keyof TraitsData) => void)
    | undefined;
  readonly readOnlyOverrides?: Partial<Record<keyof TraitsData, boolean>>;
}

/**
 * MemesArtSubmissionTraits - Component for managing all artwork trait fields
 *
 * Simplified implementation with direct updates to the central state
 */
const MemesArtSubmissionTraits: React.FC<MemesArtSubmissionTraitsProps> = ({
  traits,
  setTraits,
  showTitle = true,
  validationErrors = {},
  onFieldBlur,
  readOnlyOverrides,
}) => {
  const { connectedProfile } = useAuth();

  // Get the user profile from connected account
  const userProfile = connectedProfile?.handle;

  // Direct field update handlers - much simpler now
  const updateText = useCallback(
    (field: keyof TraitsData, value: string) => {
      setTraits({ [field]: value });
    },
    [setTraits]
  );

  const updateBoolean = useCallback(
    (field: keyof TraitsData, value: boolean) => {
      setTraits({ [field]: value });
    },
    [setTraits]
  );

  const updateNumber = useCallback(
    (field: keyof TraitsData, value: number) => {
      setTraits({ [field]: value });
    },
    [setTraits]
  );

  const formSections = React.useMemo(
    () => getFormSections(userProfile, readOnlyOverrides),
    [userProfile, readOnlyOverrides]
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-1">
      {showTitle && (
        <h2 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-100 tw-mb-4">
          Artwork Traits
        </h2>
      )}

      <div className="tw-flex tw-flex-col tw-gap-y-8">
        {formSections.map((section, sectionIndex) => (
          <Section key={`section-${sectionIndex}`} title={section.title}>
            <div className="tw-flex tw-flex-col tw-gap-6">
              {section.fields.map((field, fieldIndex) => {
                const hasReadOnlyOverride =
                  readOnlyOverrides?.[field.field] !== undefined;
                const effectiveReadOnly =
                  readOnlyOverrides?.[field.field] ?? field.readOnly;
                const definitionWithReadOnly =
                  effectiveReadOnly === undefined
                    ? field
                    : { ...field, readOnly: effectiveReadOnly };
                return (
                  <TraitField
                    key={`field-${field.field}-${fieldIndex}`}
                    definition={definitionWithReadOnly}
                    {...(hasReadOnlyOverride
                      ? { readOnlyOverride: Boolean(effectiveReadOnly) }
                      : {})}
                    traits={traits}
                    updateText={updateText}
                    updateNumber={updateNumber}
                    updateBoolean={updateBoolean}
                    error={validationErrors[field.field]}
                    onBlur={
                      onFieldBlur ? () => onFieldBlur(field.field) : undefined
                    }
                  />
                );
              })}
            </div>
          </Section>
        ))}
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(MemesArtSubmissionTraits);
