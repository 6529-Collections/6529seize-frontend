"use client";

import React, { useCallback } from "react";
import { useAuth } from "@/components/auth/Auth";
import { Section, TraitField } from "./traits";
import { getFormSections } from "./traits/schema";
import type { TraitsData } from "./submission/types/TraitsData";

interface MemesArtSubmissionTraitsProps {
  readonly traits: TraitsData;
  readonly setTraits: (traits: Partial<TraitsData>) => void;
  readonly showTitle?: boolean | undefined;
  readonly validationErrors?:
    | Record<keyof TraitsData, string | null>
    | undefined;
  readonly onFieldBlur?: ((field: keyof TraitsData) => void) | undefined;
  readonly readOnlyOverrides?: Partial<Record<keyof TraitsData, boolean>>;
  readonly showRequiredMarkers?: boolean | undefined;
  readonly size?: "default" | "sm" | undefined;
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
  showRequiredMarkers = false,
  size,
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
    <div className="tw-flex tw-flex-col">
      {showTitle && (
        <h2 className="tw-mb-5 tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-100">
          Artwork Traits
        </h2>
      )}

      <div className="tw-flex tw-flex-col tw-gap-y-10">
        {formSections.map((section) => {
          const sectionKey =
            section.title ||
            section.fields.map((field) => field.field).join("|");

          const renderField = (field: (typeof section.fields)[number]) => {
            const readOnlyOverride = readOnlyOverrides?.[field.field];
            const traitFieldOverrideProps =
              readOnlyOverride === undefined
                ? {}
                : { readOnlyOverride: Boolean(readOnlyOverride) };
            return (
              <TraitField
                key={field.field}
                definition={field}
                {...traitFieldOverrideProps}
                traits={traits}
                updateText={updateText}
                updateNumber={updateNumber}
                updateBoolean={updateBoolean}
                error={validationErrors[field.field]}
                onBlur={
                  onFieldBlur ? () => onFieldBlur(field.field) : undefined
                }
                showRequiredMarkers={showRequiredMarkers}
                size={size}
              />
            );
          };

          // Basic Information: artist + seizeArtistProfile side-by-side, memeName below
          if (section.title === "Basic Information") {
            const artistField = section.fields.find(
              (f) => f.field === "artist"
            );
            const profileField = section.fields.find(
              (f) => f.field === "seizeArtistProfile"
            );
            const remainingFields = section.fields.filter(
              (f) => f.field !== "artist" && f.field !== "seizeArtistProfile"
            );

            return (
              <Section key={sectionKey} title={section.title}>
                <div className="tw-flex tw-flex-col tw-gap-x-6 tw-gap-y-8">
                  <div className="tw-grid tw-grid-cols-1 tw-gap-x-5 tw-gap-y-8 sm:tw-grid-cols-2">
                    {artistField && renderField(artistField)}
                    {profileField && renderField(profileField)}
                  </div>
                  {remainingFields.map((field) => renderField(field))}
                </div>
              </Section>
            );
          }

          // Card Points: all 4 fields in one row
          if (section.title === "Card Points") {
            return (
              <Section key={sectionKey} title={section.title}>
                <div className="tw-grid tw-grid-cols-2 tw-gap-4 sm:tw-grid-cols-4">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </Section>
            );
          }

          // Card Attributes: 2-column grid for boolean toggles
          if (section.title === "Card Attributes") {
            return (
              <Section key={sectionKey} title={section.title}>
                <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </Section>
            );
          }

          return (
            <Section key={sectionKey} title={section.title}>
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-5 tw-gap-y-8 sm:tw-grid-cols-2">
                {section.fields.map((field) => renderField(field))}
              </div>
            </Section>
          );
        })}
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(MemesArtSubmissionTraits);
