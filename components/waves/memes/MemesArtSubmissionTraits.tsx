import React, { useEffect } from "react";

// Define meme name options for dropdown (unchanged)
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
      className={`tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors
     
     `}
    >
      <div className="tw-flex tw-justify-between tw-items-center tw-gap-x-6">
        <label
          className={`tw-whitespace-nowrap tw-text-xs tw-font-medium ${
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
          className={`tw-form-input tw-w-full tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
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
      className={`tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors
     
`}
    >
      <div className="tw-flex tw-justify-between tw-items-center tw-gap-x-6">
        <label
          className={`tw-whitespace-nowrap tw-text-xs tw-font-medium ${
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
          className={`tw-form-input tw-w-full tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
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
      className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors
     "
    >
      <div className="tw-flex tw-justify-between tw-items-center tw-gap-x-6">
        <label className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-300">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tw-form-select tw-w-full tw-bg-iron-900 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-rounded-lg tw-px-3 tw-py-2 
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

  const handleTextChange = (field: keyof Traits) => (value: string) => {
    setTraits({ ...traits, [field]: value });
  };

  const handleBooleanChange = (field: keyof Traits) => (value: boolean) => {
    setTraits({ ...traits, [field]: value });
  };

  const handleNumberChange = (field: keyof Traits) => (value: number) => {
    setTraits({ ...traits, [field]: value });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-text-xl tw-font-semibold tw-text-iron-100">
        Artwork Traits
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-mt-2">
        <TextTrait
          label="Artist"
          value={traits.artist || userProfile}
          onChange={handleTextChange("artist")}
        />
        <TextTrait
          label="SEIZE Artist Profile"
          value={traits.seizeArtistProfile || userProfile}
          onChange={() => {}}
          readOnly
        />
        <DropdownTrait
          label="Meme Name"
          value={traits.memeName}
          onChange={handleTextChange("memeName")}
          options={MEME_NAME_OPTIONS}
        />
        <TextTrait
          label="Type - Card"
          value={traits.typeCard || "Card"}
          onChange={() => {}}
          readOnly
        />
        <TextTrait
          label="Issuance Month"
          value={traits.issuanceMonth || getCurrentMonth()}
          onChange={() => {}}
          readOnly
        />
        <NumberTrait
          label="Type - Season"
          value={traits.typeSeason || 11}
          onChange={() => {}}
          readOnly
        />
        <NumberTrait
          label="Type - Meme"
          value={traits.typeMeme || 1}
          onChange={() => {}}
          readOnly
        />
        <NumberTrait
          label="Type - Card Number"
          value={traits.typeCardNumber || 400}
          onChange={() => {}}
          readOnly
        />
        <NumberTrait
          label="Points - Power"
          value={traits.pointsPower || 0}
          onChange={handleNumberChange("pointsPower")}
          min={0}
          max={100}
        />
        <NumberTrait
          label="Points - Wisdom"
          value={traits.pointsWisdom || 0}
          onChange={handleNumberChange("pointsWisdom")}
          min={0}
          max={100}
        />
        <NumberTrait
          label="Points - Loki"
          value={traits.pointsLoki || 0}
          onChange={handleNumberChange("pointsLoki")}
          min={0}
          max={100}
        />
        <NumberTrait
          label="Points - Speed"
          value={traits.pointsSpeed || 0}
          onChange={handleNumberChange("pointsSpeed")}
          min={0}
          max={100}
        />
        <BooleanTrait
          label="Punk 6529"
          value={traits.punk6529 || false}
          onChange={handleBooleanChange("punk6529")}
        />
        <BooleanTrait
          label="Gradient"
          value={traits.gradient || false}
          onChange={handleBooleanChange("gradient")}
        />
        <BooleanTrait
          label="Movement"
          value={traits.movement || false}
          onChange={handleBooleanChange("movement")}
        />
        <BooleanTrait
          label="Dynamic"
          value={traits.dynamic || false}
          onChange={handleBooleanChange("dynamic")}
        />
        <BooleanTrait
          label="Interactive"
          value={traits.interactive || false}
          onChange={handleBooleanChange("interactive")}
        />
        <BooleanTrait
          label="Collab"
          value={traits.collab || false}
          onChange={handleBooleanChange("collab")}
        />
        <BooleanTrait
          label="OM"
          value={traits.om || false}
          onChange={handleBooleanChange("om")}
        />
        <BooleanTrait
          label="3D"
          value={traits.threeD || false}
          onChange={handleBooleanChange("threeD")}
        />
        <BooleanTrait
          label="Pepe"
          value={traits.pepe || false}
          onChange={handleBooleanChange("pepe")}
        />
        <BooleanTrait
          label="GM"
          value={traits.gm || false}
          onChange={handleBooleanChange("gm")}
        />
        <TextTrait
          label="Bonus"
          value={traits.bonus || ""}
          onChange={handleTextChange("bonus")}
        />
        <TextTrait
          label="Boost"
          value={traits.boost || ""}
          onChange={handleTextChange("boost")}
        />
        <BooleanTrait
          label="Summer"
          value={traits.summer || false}
          onChange={handleBooleanChange("summer")}
        />
        <BooleanTrait
          label="Tulip"
          value={traits.tulip || false}
          onChange={handleBooleanChange("tulip")}
        />
        <DropdownTrait
          label="Palette"
          value={traits.palette || ""}
          onChange={handleTextChange("palette")}
          options={["Color", "Black and White"]}
        />
        <TextTrait
          label="Style"
          value={traits.style || ""}
          onChange={handleTextChange("style")}
        />
        <TextTrait
          label="Jewel"
          value={traits.jewel || ""}
          onChange={handleTextChange("jewel")}
        />
        <TextTrait
          label="Superpower"
          value={traits.superpower || ""}
          onChange={handleTextChange("superpower")}
        />
        <TextTrait
          label="Dharma"
          value={traits.dharma || ""}
          onChange={handleTextChange("dharma")}
        />
        <TextTrait
          label="Gear"
          value={traits.gear || ""}
          onChange={handleTextChange("gear")}
        />
        <TextTrait
          label="Clothing"
          value={traits.clothing || ""}
          onChange={handleTextChange("clothing")}
        />
        <TextTrait
          label="Element"
          value={traits.element || ""}
          onChange={handleTextChange("element")}
        />
        <TextTrait
          label="Mystery"
          value={traits.mystery || ""}
          onChange={handleTextChange("mystery")}
        />
        <TextTrait
          label="Secrets"
          value={traits.secrets || ""}
          onChange={handleTextChange("secrets")}
        />
        <TextTrait
          label="Weapon"
          value={traits.weapon || ""}
          onChange={handleTextChange("weapon")}
        />
        <TextTrait
          label="Home"
          value={traits.home || ""}
          onChange={handleTextChange("home")}
        />
        <TextTrait
          label="Parent"
          value={traits.parent || ""}
          onChange={handleTextChange("parent")}
        />
        <TextTrait
          label="Sibling"
          value={traits.sibling || ""}
          onChange={handleTextChange("sibling")}
        />
        <TextTrait
          label="Food"
          value={traits.food || ""}
          onChange={handleTextChange("food")}
        />
        <TextTrait
          label="Drink"
          value={traits.drink || ""}
          onChange={handleTextChange("drink")}
        />
      </div>
    </div>
  );
}

export default MemesArtSubmissionTraits;
