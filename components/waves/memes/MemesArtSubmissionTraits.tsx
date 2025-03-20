import React, { useEffect, useRef, useCallback } from "react";
import { TraitsData } from "./submission/types/TraitsData";
import { Section, TraitField } from "./traits";
import { getFormSections } from "./traits/schema";
import { useAuth } from "../../auth/Auth";

interface MemesArtSubmissionTraitsProps {
  readonly traits: TraitsData;
  readonly setTraits: (traits: TraitsData) => void;
}

// Main Component
function MemesArtSubmissionTraits({
  traits,
  setTraits,
}: MemesArtSubmissionTraitsProps) {
  const { connectedProfile } = useAuth();
  
  // Create a reference to track if we're currently updating traits
  const isUpdatingRef = useRef<boolean>(false);
  
  // Create a special ref to track field values by key
  const fieldValuesRef = useRef<Record<string, any>>({});
  
  // When a field is edited, remember its value
  const trackFieldChange = useCallback((field: keyof TraitsData, value: any) => {
    fieldValuesRef.current[field] = value;
  }, []);
  
  // When traits change, update our field cache for non-critical fields
  useEffect(() => {
    if (!isUpdatingRef.current) {
      // Clone the current traits to our ref for non-critical fields
      Object.keys(traits).forEach(key => {
        // Skip undefined/null values
        if (traits[key as keyof TraitsData] != null) {
          fieldValuesRef.current[key] = traits[key as keyof TraitsData];
        }
      });
    }
  }, [traits]);

  // Protected setTraits wrapper that ensures all fields are preserved
  const setTraitsPreserveFields = useCallback((newTraits: TraitsData) => {
    // Flag that we're updating to prevent effect loops
    isUpdatingRef.current = true;
    
    try {
      // Start with a fresh copy of the current traits
      const mergedTraits = { ...traits };
      
      // Apply the new trait values to our merged traits
      Object.keys(newTraits).forEach(key => {
        if (newTraits[key as keyof TraitsData] != null) {
          mergedTraits[key as keyof TraitsData] = newTraits[key as keyof TraitsData];
          
          // Track this value in our field cache too
          fieldValuesRef.current[key] = newTraits[key as keyof TraitsData];
        }
      });
      
      // Apply our cached values on top to make sure we don't lose anything
      Object.keys(fieldValuesRef.current).forEach(key => {
        if (fieldValuesRef.current[key] != null && 
            // Only apply if different
            mergedTraits[key as keyof TraitsData] !== fieldValuesRef.current[key]) {
          mergedTraits[key as keyof TraitsData] = fieldValuesRef.current[key];
        }
      });
      
      // Removed console.log for performance
      // console.log("setTraitsPreserveFields merging:", 
      //  { oldTraits: traits, newTraits, mergedTraits, fieldCache: fieldValuesRef.current });
      
      setTraits(mergedTraits);
    } finally {
      // Clear the updating flag after a small delay 
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [traits, setTraits]);

  // Initialize default values on mount
  useEffect(() => {
    const getCurrentMonth = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      return `${year}/${month}`;
    };
    
    const updatedTraits = { ...traits };
    let hasChanges = false;
    
    // Set defaults for missing values
    if (!traits.issuanceMonth) {
      updatedTraits.issuanceMonth = getCurrentMonth();
      hasChanges = true;
    }
    if (!traits.typeSeason) {
      updatedTraits.typeSeason = 11;
      hasChanges = true;
    }
    if (!traits.typeMeme) {
      updatedTraits.typeMeme = 1;
      hasChanges = true;
    }
    if (!traits.typeCardNumber) {
      updatedTraits.typeCardNumber = 400;
      hasChanges = true;
    }
    if (!traits.typeCard) {
      updatedTraits.typeCard = "Card";
      hasChanges = true;
    }
    
    // Apply any changes
    if (hasChanges) {
      // Removed console.log for performance
      // console.log("Setting default values");
      setTraitsPreserveFields(updatedTraits);
    }
    
    // Populate our field cache with any existing values
    Object.keys(traits).forEach(key => {
      if (traits[key as keyof TraitsData] != null) {
        fieldValuesRef.current[key] = traits[key as keyof TraitsData];
      }
    });
  }, []);

  // Get the user profile from connected account
  const userProfile = connectedProfile?.profile?.handle;

  // Optimize update handlers for better performance
  // Use a stable reference pattern that doesn't create new functions on every traits change
  const updateHandlers = useRef({
    updateText: (field: keyof TraitsData, value: string) => {
      // Removed all console logging for performance
      // if (process.env.NODE_ENV === 'development') {
      //   console.log(`updateText: ${String(field)}`);
      // }
      
      // Remember this value in our field cache
      trackFieldChange(field, value);
      
      // Update traits with our value - but don't spread the entire traits object
      setTraitsPreserveFields({ [field]: value } as unknown as TraitsData);
    },
    
    updateBoolean: (field: keyof TraitsData, value: boolean) => {
      // Removed all console logging
      // if (process.env.NODE_ENV === 'development') {
      //   console.log(`updateBoolean: ${String(field)}`);
      // }
      
      // Track and update
      trackFieldChange(field, value);
      setTraitsPreserveFields({ [field]: value } as unknown as TraitsData);
    },
    
    updateNumber: (field: keyof TraitsData, value: number) => {
      // Removed all console logging
      // if (process.env.NODE_ENV === 'development') {
      //   console.log(`updateNumber: ${String(field)}`);
      // }
      
      // Track and update
      trackFieldChange(field, value);
      setTraitsPreserveFields({ [field]: value } as unknown as TraitsData);
    }
  }).current;

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
                updateText={updateHandlers.updateText}
                updateNumber={updateHandlers.updateNumber}
                updateBoolean={updateHandlers.updateBoolean}
              />
            ))}
          </div>
        </Section>
      ))}
      
      {/* Debug info for development */}
      <div className="tw-hidden">
        <h5>Traits Cache</h5>
        <pre>{JSON.stringify(fieldValuesRef.current, null, 2)}</pre>
      </div>
    </div>
  );
}

// Use React.memo to prevent unnecessary rerenders
export default React.memo(MemesArtSubmissionTraits);
