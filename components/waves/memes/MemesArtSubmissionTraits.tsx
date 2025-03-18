import React, { useEffect } from "react";

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

// Interfaces (unchanged)
export interface Traits {
  // Text fields
  artist: string;
  palette: string; // Only "Color" or "Black and White"
  style: string;
  jewel: string;
  superpower: string;
  dharma: string;
  gear: string;
  clothing: string;
  element: string;
  mystery: string;
  secrets: string;
  weapon: string;
  home: string;
  parent: string;
  sibling: string;
  food: string;
  drink: string;
  bonus: string; // Changed from boolean to string
  boost: string; // Changed from boolean to string

  // Boolean fields
  punk6529: boolean;
  gradient: boolean;
  movement: boolean;
  dynamic: boolean;
  interactive: boolean;
  collab: boolean;
  om: boolean;
  threeD: boolean;
  pepe: boolean;
  gm: boolean;
  summer: boolean;
  tulip: boolean;

  // Dropdown fields
  memeName: string;

  // Number fields
  pointsPower: number;
  pointsWisdom: number;
  pointsLoki: number;
  pointsSpeed: number;

  // Read-only fields
  seizeArtistProfile: string;
  typeCard: string;
  issuanceMonth: string;
  typeSeason: number;
  typeMeme: number;
  typeCardNumber: number;
}

interface MemesArtSubmissionTraitsProps {
  readonly traits: Traits;
  readonly setTraits: (traits: Traits) => void;
}

interface BooleanTraitProps {
  readonly label: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}

interface TextTraitProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly readOnly?: boolean;
}

interface NumberTraitProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly readOnly?: boolean;
}

interface DropdownTraitProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: string[];
}

// BooleanTrait Component
function BooleanTrait({ label, value, onChange }: BooleanTraitProps) {
  return (
    <div className="tw-bg-iron-900/50 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800/40 tw-flex tw-items-center">
      <div className="tw-text-sm tw-text-iron-200 tw-w-1/3 tw-font-medium">
        {label}
      </div>
      <div className="tw-flex tw-gap-3 tw-flex-1">
        <button
          onClick={() => onChange(true)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              value
                ? "tw-bg-emerald-600/30 tw-ring-emerald-500/60 tw-text-emerald-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              !value
                ? "tw-bg-rose-600/30 tw-ring-rose-500/60 tw-text-rose-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
        >
          No
        </button>
      </div>
    </div>
  );
}

// TextTrait Component
function TextTrait({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
}: TextTraitProps) {
  return (
    <div
      className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors"
    >
      <div className="tw-flex tw-items-center tw-gap-x-6">
        <label
          className={`tw-w-1/3 tw-text-sm tw-font-medium ${
            readOnly ? "tw-text-iron-400" : "tw-text-iron-300"
          }`}
        >
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          readOnly={readOnly}
          className={`tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
            ${
              readOnly
                ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
                : "tw-bg-iron-900 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
            } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`}
        />
      </div>
    </div>
  );
}

// NumberTrait Component
function NumberTrait({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  readOnly,
}: NumberTraitProps) {
  return (
    <div
      className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors"
    >
      <div className="tw-flex tw-items-center tw-gap-x-6">
        <label
          className={`tw-w-1/3 tw-text-sm tw-font-medium ${
            readOnly ? "tw-text-iron-400" : "tw-text-iron-300"
          }`}
        >
          {label}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          readOnly={readOnly}
          className={`tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
            ${
              readOnly
                ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
                : "tw-bg-iron-900/80 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
            } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`}
        />
      </div>
    </div>
  );
}

// DropdownTrait Component
function DropdownTrait({
  label,
  value,
  onChange,
  options,
}: DropdownTraitProps) {
  return (
    <div
      className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors"
    >
      <div className="tw-flex tw-items-center tw-gap-x-6">
        <label className="tw-w-1/3 tw-text-sm tw-font-medium tw-text-iron-300">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tw-form-select tw-w-2/3 tw-bg-iron-900 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-rounded-lg tw-px-3 tw-py-3 
            tw-text-sm tw-text-iron-100 tw-cursor-pointer tw-transition-all tw-shadow-inner
            focus:tw-ring-1 focus:tw-ring-primary-400 hover:tw-ring-primary-400"
        >
          <option value="" className="tw-bg-iron-950">
            Select {label}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="tw-bg-iron-950">
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
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

  // Simplified handler functions
  const updateText = (field: keyof Traits, value: string) => {
    setTraits({ ...traits, [field]: value });
  };

  const updateBoolean = (field: keyof Traits, value: boolean) => {
    setTraits({ ...traits, [field]: value });
  };

  const updateNumber = (field: keyof Traits, value: number) => {
    setTraits({ ...traits, [field]: value });
  };

  // Render helpers for each field type
  const renderTextTrait = (label: string, field: keyof Traits, readOnly = false, placeholder?: string) => (
    <div className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors">
      <div className="tw-flex tw-items-center tw-gap-x-6">
        <label
          className={`tw-w-1/3 tw-text-sm tw-font-medium ${
            readOnly ? "tw-text-iron-400" : "tw-text-iron-300"
          }`}
        >
          {label}
        </label>
        <input
          type="text"
          value={traits[field] as string || ""}
          onChange={(e) => updateText(field, e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          readOnly={readOnly}
          className={`tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
            ${
              readOnly
                ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
                : "tw-bg-iron-900 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
            } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`}
        />
      </div>
    </div>
  );

  const renderNumberTrait = (label: string, field: keyof Traits, readOnly = false, min = 0, max = 100) => (
    <div className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors">
      <div className="tw-flex tw-items-center tw-gap-x-6">
        <label
          className={`tw-w-1/3 tw-text-sm tw-font-medium ${
            readOnly ? "tw-text-iron-400" : "tw-text-iron-300"
          }`}
        >
          {label}
        </label>
        <input
          type="number"
          value={traits[field] as number || 0}
          onChange={(e) => updateNumber(field, Number(e.target.value))}
          min={min}
          max={max}
          readOnly={readOnly}
          className={`tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
            ${
              readOnly
                ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
                : "tw-bg-iron-900/80 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
            } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`}
        />
      </div>
    </div>
  );

  const renderDropdownTrait = (label: string, field: keyof Traits, options: string[]) => (
    <div className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors">
      <div className="tw-flex tw-items-center tw-gap-x-6">
        <label className="tw-w-1/3 tw-text-sm tw-font-medium tw-text-iron-300">
          {label}
        </label>
        <select
          value={traits[field] as string || ""}
          onChange={(e) => updateText(field, e.target.value)}
          className="tw-form-select tw-w-2/3 tw-bg-iron-900 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-rounded-lg tw-px-3 tw-py-3 
            tw-text-sm tw-text-iron-100 tw-cursor-pointer tw-transition-all tw-shadow-inner
            focus:tw-ring-1 focus:tw-ring-primary-400 hover:tw-ring-primary-400"
        >
          <option value="" className="tw-bg-iron-950">
            Select {label}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="tw-bg-iron-950">
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderBooleanTrait = (label: string, field: keyof Traits) => (
    <div className="tw-bg-iron-900/50 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800/40 tw-flex tw-items-center">
      <div className="tw-text-sm tw-text-iron-200 tw-w-1/3 tw-font-medium">
        {label}
      </div>
      <div className="tw-flex tw-gap-3 tw-flex-1">
        <button
          onClick={() => updateBoolean(field, true)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              traits[field]
                ? "tw-bg-emerald-600/30 tw-ring-emerald-500/60 tw-text-emerald-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
        >
          Yes
        </button>
        <button
          onClick={() => updateBoolean(field, false)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              !traits[field]
                ? "tw-bg-rose-600/30 tw-ring-rose-500/60 tw-text-rose-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
        >
          No
        </button>
      </div>
    </div>
  );

  // Section component for consistent styling
  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="tw-mt-6 tw-first:tw-mt-0">
      <div className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-4">
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-text-xl tw-font-semibold tw-text-iron-100">
        Artwork Traits
      </div>
      
      {/* Basic Information */}
      <Section title="Basic Information">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {renderTextTrait("Artist", "artist", false, userProfile)}
          {renderTextTrait("SEIZE Artist Profile", "seizeArtistProfile", true, userProfile)}
          {renderDropdownTrait("Meme Name", "memeName", MEME_NAME_OPTIONS)}
        </div>
      </Section>
      
      {/* Card Type */}
      <Section title="Card Type Information">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {renderTextTrait("Type - Card", "typeCard", true)}
          {renderTextTrait("Issuance Month", "issuanceMonth", true)}
          {renderNumberTrait("Type - Season", "typeSeason", true)}
          {renderNumberTrait("Type - Meme", "typeMeme", true)}
          {renderNumberTrait("Type - Card Number", "typeCardNumber", true)}
        </div>
      </Section>
      
      {/* Card Points */}
      <Section title="Card Points">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {renderNumberTrait("Points - Power", "pointsPower")}
          {renderNumberTrait("Points - Wisdom", "pointsWisdom")}
          {renderNumberTrait("Points - Loki", "pointsLoki")}
          {renderNumberTrait("Points - Speed", "pointsSpeed")}
        </div>
      </Section>
      
      {/* Card Attributes (Boolean fields) */}
      <Section title="Card Attributes">
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          {renderBooleanTrait("Punk 6529", "punk6529")}
          {renderBooleanTrait("Gradient", "gradient")}
          {renderBooleanTrait("Movement", "movement")}
          {renderBooleanTrait("Dynamic", "dynamic")}
          {renderBooleanTrait("Interactive", "interactive")}
          {renderBooleanTrait("Collab", "collab")}
          {renderBooleanTrait("OM", "om")}
          {renderBooleanTrait("3D", "threeD")}
          {renderBooleanTrait("Pepe", "pepe")}
          {renderBooleanTrait("GM", "gm")}
          {renderBooleanTrait("Summer", "summer")}
          {renderBooleanTrait("Tulip", "tulip")}
        </div>
      </Section>
      
      {/* Card Special Properties */}
      <Section title="Card Special Properties">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {renderTextTrait("Bonus", "bonus")}
          {renderTextTrait("Boost", "boost")}
          {renderDropdownTrait("Palette", "palette", ["Color", "Black and White"])}
          {renderTextTrait("Style", "style")}
          {renderTextTrait("Jewel", "jewel")}
          {renderTextTrait("Superpower", "superpower")}
          {renderTextTrait("Dharma", "dharma")}
          {renderTextTrait("Gear", "gear")}
          {renderTextTrait("Clothing", "clothing")}
          {renderTextTrait("Element", "element")}
        </div>
      </Section>
      
      {/* Card Details */}
      <Section title="Card Additional Details">
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {renderTextTrait("Mystery", "mystery")}
          {renderTextTrait("Secrets", "secrets")}
          {renderTextTrait("Weapon", "weapon")}
          {renderTextTrait("Home", "home")}
          {renderTextTrait("Parent", "parent")}
          {renderTextTrait("Sibling", "sibling")}
          {renderTextTrait("Food", "food")}
          {renderTextTrait("Drink", "drink")}
        </div>
      </Section>
    </div>
  );
}

export default MemesArtSubmissionTraits;
