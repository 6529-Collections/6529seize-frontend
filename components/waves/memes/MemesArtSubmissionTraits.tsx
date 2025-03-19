import React, { useEffect } from "react";
import { TraitsData } from "./submission/types/TraitsData";
import { Section, TraitField } from "./traits";
import { getFormSections } from "./traits/fieldDefinitions";
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
    if (Object.keys(updatedTraits).length !== Object.keys(traits).length) {
      setTraits(updatedTraits);
    }
  }, []);

  const userProfile = connectedProfile?.profile?.handle;

  // Handler functions
  const updateText = (field: keyof TraitsData, value: string) => {
    setTraits({ ...traits, [field]: value });
  };

  const updateBoolean = (field: keyof TraitsData, value: boolean) => {
    setTraits({ ...traits, [field]: value });
  };

  const updateNumber = (field: keyof TraitsData, value: number) => {
    setTraits({ ...traits, [field]: value });
  };

  // Get form sections based on user profile
  const formSections = getFormSections(userProfile ?? "");

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
