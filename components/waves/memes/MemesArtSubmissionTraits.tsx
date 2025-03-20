import React, { useEffect } from "react";
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
  
  // Store important values that should be preserved
  const [preservedTitle, setPreservedTitle] = React.useState<string>(traits.title || '');
  const [preservedDescription, setPreservedDescription] = React.useState<string>(traits.description || '');
  
  // Update preserved values when they change in the incoming props
  React.useEffect(() => {
    if (traits.title && traits.title !== preservedTitle) {
      setPreservedTitle(traits.title);
    }
    if (traits.description && traits.description !== preservedDescription) {
      setPreservedDescription(traits.description);
    }
  }, [traits.title, traits.description]);

  // Protected setTraits wrapper that preserves title and description
  const setTraitsPreserveFields = (newTraits: TraitsData) => {
    // Always preserve title and description in the new traits object
    newTraits.title = newTraits.title || preservedTitle || traits.title;
    newTraits.description = newTraits.description || preservedDescription || traits.description;
    
    // Call the original setTraits with the protected data
    setTraits(newTraits);
  };

  const getCurrentMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}/${month}`;
  };

  useEffect(() => {
    const updatedTraits = { ...traits };
    if (!traits.issuanceMonth) updatedTraits.issuanceMonth = getCurrentMonth();
    if (!traits.typeSeason) updatedTraits.typeSeason = 11;
    if (!traits.typeMeme) updatedTraits.typeMeme = 1;
    if (!traits.typeCardNumber) updatedTraits.typeCardNumber = 400;
    if (!traits.typeCard) updatedTraits.typeCard = "Card";
    
    // Check if we actually have changes to make
    const hasChanges = Object.keys(updatedTraits).some(key => 
      traits[key as keyof TraitsData] !== updatedTraits[key as keyof TraitsData]
    );
    
    if (hasChanges) {
      console.log("Setting default values while preserving existing traits");
      
      // Always ensure title/description are preserved
      updatedTraits.title = preservedTitle || traits.title;
      updatedTraits.description = preservedDescription || traits.description;
      
      // Use our protected setter
      setTraitsPreserveFields(updatedTraits);
    }
  }, []);

  const userProfile = connectedProfile?.profile?.handle;

  // Handler functions
  const updateText = (field: keyof TraitsData, value: string) => {
    // Handle special cases directly
    if (field === 'title') {
      setPreservedTitle(value);
    } else if (field === 'description') {
      setPreservedDescription(value);
    }
    
    // Create an updated traits object
    const updatedTraits = { ...traits };
    updatedTraits[field] = value;
    
    // Always ensure title/description are preserved
    if (field !== 'title') {
      updatedTraits.title = preservedTitle || traits.title;
    }
    if (field !== 'description') {
      updatedTraits.description = preservedDescription || traits.description;
    }
    
    // Use the protected setter
    setTraitsPreserveFields(updatedTraits);
  };

  const updateBoolean = (field: keyof TraitsData, value: boolean) => {
    const updatedTraits = { ...traits };
    updatedTraits[field] = value;
    
    // Always ensure title/description are preserved
    updatedTraits.title = preservedTitle || traits.title;
    updatedTraits.description = preservedDescription || traits.description;
    
    setTraitsPreserveFields(updatedTraits);
  };

  const updateNumber = (field: keyof TraitsData, value: number) => {
    const updatedTraits = { ...traits };
    updatedTraits[field] = value;
    
    // Always ensure title/description are preserved
    updatedTraits.title = preservedTitle || traits.title;
    updatedTraits.description = preservedDescription || traits.description;
    
    setTraitsPreserveFields(updatedTraits);
  };

  // Get form sections based on user profile - schema handles null/undefined profile
  const formSections = getFormSections(userProfile);

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
                key={`field-${section.title}-${fieldIndex}`}
                definition={field}
                traits={traits}
                updateText={updateText}
                updateNumber={updateNumber}
                updateBoolean={updateBoolean}
              />
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

export default MemesArtSubmissionTraits;
