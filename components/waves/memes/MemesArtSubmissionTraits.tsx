import React, { useEffect } from "react";
import { TraitsData } from "./submission/types/TraitsData";
import {
  TextTrait,
  NumberTrait,
  DropdownTrait,
  BooleanTrait,
  Section,
} from "./traits";

// Define meme name options for dropdown
const MEME_NAME_OPTIONS = [
  "Seize the Memes of Production",
  "WAGMI",
  "Don't Let the Institutions Steal Your JPGs",
  "GM",
  "Use a Hardware Wallet",
  "Open Metaverse / OM",
  "Freedom to Transact",
  "Freestyle",
  "Survive",
  "Not Your Keys, Not Your Coins",
  "Digital Rights Charter",
  "BUIDL",
  "TAP",
  "Summer.jpg",
  "Brain",
];

interface MemesArtSubmissionTraitsProps {
  readonly traits: TraitsData;
  readonly setTraits: (traits: TraitsData) => void;
}

// Main Component
function MemesArtSubmissionTraits({
  traits,
  setTraits,
}: MemesArtSubmissionTraitsProps) {
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

  const userProfile = "User's Profile Name";

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

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-text-xl tw-font-semibold tw-text-iron-100">
        Artwork Traits
      </div>
      
      {/* Basic Information */}
      <Section title="Basic Information">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          <TextTrait 
            label="Artist" 
            field="artist" 
            traits={traits} 
            updateText={updateText}
            placeholder={userProfile} 
          />
          <TextTrait 
            label="SEIZE Artist Profile" 
            field="seizeArtistProfile" 
            traits={traits} 
            updateText={updateText}
            readOnly={true} 
            placeholder={userProfile} 
          />
          <DropdownTrait 
            label="Meme Name" 
            field="memeName" 
            traits={traits} 
            updateText={updateText}
            options={MEME_NAME_OPTIONS} 
          />
        </div>
      </Section>
      
      {/* Card Type */}
      <Section title="Card Type Information">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          <TextTrait 
            label="Type - Card" 
            field="typeCard" 
            traits={traits} 
            updateText={updateText}
            readOnly={true} 
          />
          <TextTrait 
            label="Issuance Month" 
            field="issuanceMonth" 
            traits={traits} 
            updateText={updateText}
            readOnly={true} 
          />
          <NumberTrait 
            label="Type - Season" 
            field="typeSeason" 
            traits={traits} 
            updateNumber={updateNumber}
            readOnly={true} 
          />
          <NumberTrait 
            label="Type - Meme" 
            field="typeMeme" 
            traits={traits} 
            updateNumber={updateNumber}
            readOnly={true} 
          />
          <NumberTrait 
            label="Type - Card Number" 
            field="typeCardNumber" 
            traits={traits} 
            updateNumber={updateNumber}
            readOnly={true} 
          />
        </div>
      </Section>
      
      {/* Card Points */}
      <Section title="Card Points">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          <NumberTrait 
            label="Points - Power" 
            field="pointsPower" 
            traits={traits} 
            updateNumber={updateNumber}
          />
          <NumberTrait 
            label="Points - Wisdom" 
            field="pointsWisdom" 
            traits={traits} 
            updateNumber={updateNumber}
          />
          <NumberTrait 
            label="Points - Loki" 
            field="pointsLoki" 
            traits={traits} 
            updateNumber={updateNumber}
          />
          <NumberTrait 
            label="Points - Speed" 
            field="pointsSpeed" 
            traits={traits} 
            updateNumber={updateNumber}
          />
        </div>
      </Section>
      
      {/* Card Attributes (Boolean fields) */}
      <Section title="Card Attributes">
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <BooleanTrait 
            label="Punk 6529" 
            field="punk6529" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Gradient" 
            field="gradient" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Movement" 
            field="movement" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Dynamic" 
            field="dynamic" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Interactive" 
            field="interactive" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Collab" 
            field="collab" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="OM" 
            field="om" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="3D" 
            field="threeD" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Pepe" 
            field="pepe" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="GM" 
            field="gm" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Summer" 
            field="summer" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
          <BooleanTrait 
            label="Tulip" 
            field="tulip" 
            traits={traits} 
            updateBoolean={updateBoolean}
          />
        </div>
      </Section>
      
      {/* Card Special Properties */}
      <Section title="Card Special Properties">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          <TextTrait 
            label="Bonus" 
            field="bonus" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Boost" 
            field="boost" 
            traits={traits} 
            updateText={updateText}
          />
          <DropdownTrait 
            label="Palette" 
            field="palette" 
            traits={traits} 
            updateText={updateText}
            options={["Color", "Black and White"]} 
          />
          <TextTrait 
            label="Style" 
            field="style" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Jewel" 
            field="jewel" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Superpower" 
            field="superpower" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Dharma" 
            field="dharma" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Gear" 
            field="gear" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Clothing" 
            field="clothing" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Element" 
            field="element" 
            traits={traits} 
            updateText={updateText}
          />
        </div>
      </Section>
      
      {/* Card Details */}
      <Section title="Card Additional Details">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          <TextTrait 
            label="Mystery" 
            field="mystery" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Secrets" 
            field="secrets" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Weapon" 
            field="weapon" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Home" 
            field="home" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Parent" 
            field="parent" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Sibling" 
            field="sibling" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Food" 
            field="food" 
            traits={traits} 
            updateText={updateText}
          />
          <TextTrait 
            label="Drink" 
            field="drink" 
            traits={traits} 
            updateText={updateText}
          />
        </div>
      </Section>
    </div>
  );
}

export default MemesArtSubmissionTraits;
