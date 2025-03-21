import React, { useEffect, useCallback } from "react";
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
  console.log(traits)
  const { connectedProfile } = useAuth();
  
  // Initialize default values on mount
  useEffect(() => {
    const getCurrentMonth = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      return `${year}/${month}`;
    };
    
    // Collect default values in a single object
    const defaultValues: Partial<TraitsData> = {};
    let hasChanges = false;
    
    // Set defaults for missing values
    if (!traits.issuanceMonth) {
      defaultValues.issuanceMonth = getCurrentMonth();
      hasChanges = true;
    }
    if (!traits.typeSeason) {
      defaultValues.typeSeason = 11;
      hasChanges = true;
    }
    if (!traits.typeMeme) {
      defaultValues.typeMeme = 1;
      hasChanges = true;
    }
    if (!traits.typeCardNumber) {
      defaultValues.typeCardNumber = 400;
      hasChanges = true;
    }
    if (!traits.typeCard) {
      defaultValues.typeCard = "Card";
      hasChanges = true;
    }
    
    // Apply default values in a single update
    if (hasChanges) {
      setTraits(defaultValues);
    }
  }, [setTraits, traits]);

  // Get the user profile from connected account
  const userProfile = connectedProfile?.profile?.handle;

  // Direct field update handlers - much simpler now
  const updateText = useCallback((field: keyof TraitsData, value: string) => {
    setTraits({ [field]: value });
  }, [setTraits]);
  
  const updateBoolean = useCallback((field: keyof TraitsData, value: boolean) => {
    setTraits({ [field]: value });
  }, [setTraits]);
  
  const updateNumber = useCallback((field: keyof TraitsData, value: number) => {
    setTraits({ [field]: value });
  }, [setTraits]);

  // Use memoization to prevent unnecessary rebuilding of form sections
  const formSections = React.useMemo(() => 
    getFormSections(userProfile), [userProfile]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-text-xl tw-font-semibold tw-text-iron-100">
        Artwork Traits
      </div>

      {formSections.map((section, sectionIndex) => (
        <Section key={`section-${sectionIndex}`} title={section.title}>
          <div
            className={`tw-grid tw-grid-cols-${
              section.layout === "double" ? "2" : "1"
            } tw-gap-4`}
          >
            {section.fields.map((field, fieldIndex) => (
              <TraitField
                key={`field-${field.field}-${fieldIndex}`}
                definition={field}
                traits={traits}
                updateText={updateText}
                updateNumber={updateNumber}
                updateBoolean={updateBoolean}
                error={validationErrors[field.field]}
                onBlur={onFieldBlur ? () => onFieldBlur(field.field) : undefined}
              />
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(MemesArtSubmissionTraits);
