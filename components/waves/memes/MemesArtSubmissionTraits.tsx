"use client"

import React, { useCallback } from "react";
import { TraitsData } from "./submission/types/TraitsData";
import { Section, TraitField } from "./traits";
import { getFormSections } from "./traits/schema";
import { useAuth } from "../../auth/Auth";

interface MemesArtSubmissionTraitsProps {
  readonly traits: TraitsData;
  readonly setTraits: (traits: Partial<TraitsData>) => void;
  readonly validationErrors?: Record<keyof TraitsData, string | null>;
  readonly onFieldBlur?: (field: keyof TraitsData) => void;
}

/**
 * MemesArtSubmissionTraits - Component for managing all artwork trait fields
 *
 * Simplified implementation with direct updates to the central state
 */
const MemesArtSubmissionTraits: React.FC<MemesArtSubmissionTraitsProps> = ({
  traits,
  setTraits,
  validationErrors = {},
  onFieldBlur,
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

  // Use memoization to prevent unnecessary rebuilding of form sections
  const formSections = React.useMemo(
    () => getFormSections(userProfile),
    [userProfile]
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-1">
      <h2 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-100 tw-mb-4">
        Artwork Traits
      </h2>

      <div className="tw-flex tw-flex-col tw-gap-y-8">
        {formSections.map((section, sectionIndex) => (
          <Section key={`section-${sectionIndex}`} title={section.title}>
            <div className="tw-flex tw-flex-col tw-gap-6">
              {section.fields.map((field, fieldIndex) => (
                <TraitField
                  key={`field-${field.field}-${fieldIndex}`}
                  definition={field}
                  traits={traits}
                  updateText={updateText}
                  updateNumber={updateNumber}
                  updateBoolean={updateBoolean}
                  error={validationErrors[field.field]}
                  onBlur={
                    onFieldBlur ? () => onFieldBlur(field.field) : undefined
                  }
                />
              ))}
            </div>
          </Section>
        ))}
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(MemesArtSubmissionTraits);
