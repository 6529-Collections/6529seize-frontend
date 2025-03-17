import React, { useState, useEffect } from 'react';

// Define meme name options for dropdown
const memeNameOptions = [
  'Seize the Memes of Production',
  'WAGMI',
  'Don\'t Let the Institutions Steal Your JPGs',
  'GM',
  'Use a Hardware Wallet',
  'Open Metaverse / OM',
  'Freedom to Transact',
  'Freestyle',
  'Survive',
  'Not Your Keys, Not Your Coins',
  'Digital Rights Charter',
  'BUIDL',
  'TAP',
  'Summer.jpg',
  'Brain'
];

// Type definition for all traits
interface Traits {
  // Text fields
  artist: string;
  palette: string;
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
  
  // Boolean fields
  punk6529: boolean;
  gradient: boolean;
  movement: boolean;
  dynamic: boolean;
  interactive: boolean;
  collab: boolean;
  om: boolean;
  threeD: boolean; // '3D' is not a valid JS identifier
  pepe: boolean;
  gm: boolean;
  bonus: boolean;
  boost: boolean;
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

// Component to handle rendering a boolean trait with Yes/No buttons
const BooleanTrait: React.FC<{
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, value, onChange }) => (
  <div className="tw-bg-iron-900/50 tw-rounded-lg tw-p-4 tw-border tw-border-iron-800/50 tw-flex tw-items-center">
    <div className="tw-text-sm tw-text-iron-300 tw-w-1/3">{label}</div>
    <div className="tw-flex tw-gap-3 tw-flex-1">
      <button
        onClick={() => onChange(true)}
        className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all ${
          value 
          ? 'tw-bg-primary-500/20 tw-border-primary-500/50' 
          : 'tw-bg-iron-800/50 tw-border-iron-700/50'
        } tw-border`}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all ${
          !value 
          ? 'tw-bg-primary-500/20 tw-border-primary-500/50' 
          : 'tw-bg-iron-800/50 tw-border-iron-700/50'
        } tw-border`}
      >
        No
      </button>
    </div>
  </div>
);

// Component to handle rendering a text trait
const TextTrait: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}> = ({ label, value, onChange, placeholder, readOnly }) => (
  <div className="tw-bg-iron-900/50 tw-rounded-lg tw-p-4 tw-border tw-border-iron-800/50 tw-flex tw-items-center">
    <div className="tw-text-sm tw-text-iron-300 tw-w-1/3">{label}</div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      readOnly={readOnly}
      className={`tw-flex-1 tw-bg-iron-800/50 tw-border tw-border-iron-700/50 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 ${
        readOnly ? 'tw-opacity-70 tw-cursor-not-allowed' : ''
      }`}
    />
  </div>
);

// Component to handle rendering a number trait
const NumberTrait: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  readOnly?: boolean;
}> = ({ label, value, onChange, min = 0, max = 100, readOnly }) => (
  <div className="tw-bg-iron-900/50 tw-rounded-lg tw-p-4 tw-border tw-border-iron-800/50 tw-flex tw-items-center">
    <div className="tw-text-sm tw-text-iron-300 tw-w-1/3">{label}</div>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      readOnly={readOnly}
      className={`tw-flex-1 tw-bg-iron-800/50 tw-border tw-border-iron-700/50 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 ${
        readOnly ? 'tw-opacity-70 tw-cursor-not-allowed' : ''
      }`}
    />
  </div>
);

// Component to handle rendering a dropdown trait
const DropdownTrait: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}> = ({ label, value, onChange, options }) => (
  <div className="tw-bg-iron-900/50 tw-rounded-lg tw-p-4 tw-border tw-border-iron-800/50 tw-flex tw-items-center">
    <div className="tw-text-sm tw-text-iron-300 tw-w-1/3">{label}</div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="tw-flex-1 tw-bg-iron-800/50 tw-border tw-border-iron-700/50 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100"
    >
      <option value="">Select {label}</option>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

const MemesArtSubmissionTraits: React.FC<MemesArtSubmissionTraitsProps> = ({
  traits,
  setTraits,
}) => {
  // Helper function to get current month in YYYY/MM format
  const getCurrentMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}/${month}`;
  };
  
  // Initialize traits that need default values
  useEffect(() => {
    // This effect will run once to initialize any values that need defaults
    const updatedTraits = { ...traits };
    
    // Set default values for read-only fields if they're not already set
    if (!traits.issuanceMonth) {
      updatedTraits.issuanceMonth = getCurrentMonth();
    }
    
    if (!traits.typeSeason) {
      updatedTraits.typeSeason = 11;
    }
    
    if (!traits.typeMeme) {
      updatedTraits.typeMeme = 1;
    }
    
    if (!traits.typeCardNumber) {
      updatedTraits.typeCardNumber = 400;
    }
    
    if (!traits.typeCard) {
      updatedTraits.typeCard = 'Card';
    }
    
    // Update traits if we made any changes
    if (Object.keys(updatedTraits).length !== Object.keys(traits).length) {
      setTraits(updatedTraits);
    }
  }, []);
  
  // Get user profile for artist fields
  const userProfile = "User's Profile Name"; // This should come from actual user context
  
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <h3 className="tw-text-lg tw-font-medium tw-text-iron-100">Artwork Traits</h3>
      
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
        {/* Text fields */}
        <TextTrait 
          label="Artist" 
          value={traits.artist || userProfile} 
          onChange={(value) => setTraits({ ...traits, artist: value })} 
        />
        
        <TextTrait 
          label="SEIZE Artist Profile" 
          value={traits.seizeArtistProfile || userProfile} 
          onChange={(value) => {}} // No-op since it's read-only
          readOnly 
        />
        
        <DropdownTrait 
          label="Meme Name" 
          value={traits.memeName} 
          onChange={(value) => setTraits({ ...traits, memeName: value })} 
          options={memeNameOptions} 
        />
        
        <TextTrait 
          label="Type - Card" 
          value={traits.typeCard || 'Card'} 
          onChange={(value) => {}} // No-op since it's read-only
          readOnly 
        />
        
        <TextTrait 
          label="Issuance Month" 
          value={traits.issuanceMonth || getCurrentMonth()} 
          onChange={(value) => {}} // No-op since it's read-only
          readOnly 
        />
        
        <NumberTrait 
          label="Type - Season" 
          value={traits.typeSeason || 11} 
          onChange={(value) => {}} // No-op since it's read-only
          readOnly 
        />
        
        <NumberTrait 
          label="Type - Meme" 
          value={traits.typeMeme || 1} 
          onChange={(value) => {}} // No-op since it's read-only
          readOnly 
        />
        
        <NumberTrait 
          label="Type - Card Number" 
          value={traits.typeCardNumber || 400} 
          onChange={(value) => {}} // No-op since it's read-only
          readOnly 
        />
        
        {/* Percentage points */}
        <NumberTrait 
          label="Points - Power" 
          value={traits.pointsPower || 0} 
          onChange={(value) => setTraits({ ...traits, pointsPower: value })} 
          min={0} 
          max={100} 
        />
        
        <NumberTrait 
          label="Points - Wisdom" 
          value={traits.pointsWisdom || 0} 
          onChange={(value) => setTraits({ ...traits, pointsWisdom: value })} 
          min={0} 
          max={100} 
        />
        
        <NumberTrait 
          label="Points - Loki" 
          value={traits.pointsLoki || 0} 
          onChange={(value) => setTraits({ ...traits, pointsLoki: value })} 
          min={0} 
          max={100} 
        />
        
        <NumberTrait 
          label="Points - Speed" 
          value={traits.pointsSpeed || 0} 
          onChange={(value) => setTraits({ ...traits, pointsSpeed: value })} 
          min={0} 
          max={100} 
        />
        
        {/* Boolean toggles */}
        <BooleanTrait 
          label="Punk 6529" 
          value={traits.punk6529 || false} 
          onChange={(value) => setTraits({ ...traits, punk6529: value })} 
        />
        
        <BooleanTrait 
          label="Gradient" 
          value={traits.gradient || false} 
          onChange={(value) => setTraits({ ...traits, gradient: value })} 
        />
        
        <BooleanTrait 
          label="Movement" 
          value={traits.movement || false} 
          onChange={(value) => setTraits({ ...traits, movement: value })} 
        />
        
        <BooleanTrait 
          label="Dynamic" 
          value={traits.dynamic || false} 
          onChange={(value) => setTraits({ ...traits, dynamic: value })} 
        />
        
        <BooleanTrait 
          label="Interactive" 
          value={traits.interactive || false} 
          onChange={(value) => setTraits({ ...traits, interactive: value })} 
        />
        
        <BooleanTrait 
          label="Collab" 
          value={traits.collab || false} 
          onChange={(value) => setTraits({ ...traits, collab: value })} 
        />
        
        <BooleanTrait 
          label="OM" 
          value={traits.om || false} 
          onChange={(value) => setTraits({ ...traits, om: value })} 
        />
        
        <BooleanTrait 
          label="3D" 
          value={traits.threeD || false} 
          onChange={(value) => setTraits({ ...traits, threeD: value })} 
        />
        
        <BooleanTrait 
          label="Pepe" 
          value={traits.pepe || false} 
          onChange={(value) => setTraits({ ...traits, pepe: value })} 
        />
        
        <BooleanTrait 
          label="GM" 
          value={traits.gm || false} 
          onChange={(value) => setTraits({ ...traits, gm: value })} 
        />
        
        <BooleanTrait 
          label="Bonus" 
          value={traits.bonus || false} 
          onChange={(value) => setTraits({ ...traits, bonus: value })} 
        />
        
        <BooleanTrait 
          label="Boost" 
          value={traits.boost || false} 
          onChange={(value) => setTraits({ ...traits, boost: value })} 
        />
        
        <BooleanTrait 
          label="Summer" 
          value={traits.summer || false} 
          onChange={(value) => setTraits({ ...traits, summer: value })} 
        />
        
        <BooleanTrait 
          label="Tulip" 
          value={traits.tulip || false} 
          onChange={(value) => setTraits({ ...traits, tulip: value })} 
        />
        
        {/* Text fields for free-form entry */}
        <TextTrait 
          label="Palette" 
          value={traits.palette || ''} 
          onChange={(value) => setTraits({ ...traits, palette: value })} 
        />
        
        <TextTrait 
          label="Style" 
          value={traits.style || ''} 
          onChange={(value) => setTraits({ ...traits, style: value })} 
        />
        
        <TextTrait 
          label="Jewel" 
          value={traits.jewel || ''} 
          onChange={(value) => setTraits({ ...traits, jewel: value })} 
        />
        
        <TextTrait 
          label="Superpower" 
          value={traits.superpower || ''} 
          onChange={(value) => setTraits({ ...traits, superpower: value })} 
        />
        
        <TextTrait 
          label="Dharma" 
          value={traits.dharma || ''} 
          onChange={(value) => setTraits({ ...traits, dharma: value })} 
        />
        
        <TextTrait 
          label="Gear" 
          value={traits.gear || ''} 
          onChange={(value) => setTraits({ ...traits, gear: value })} 
        />
        
        <TextTrait 
          label="Clothing" 
          value={traits.clothing || ''} 
          onChange={(value) => setTraits({ ...traits, clothing: value })} 
        />
        
        <TextTrait 
          label="Element" 
          value={traits.element || ''} 
          onChange={(value) => setTraits({ ...traits, element: value })} 
        />
        
        <TextTrait 
          label="Mystery" 
          value={traits.mystery || ''} 
          onChange={(value) => setTraits({ ...traits, mystery: value })} 
        />
        
        <TextTrait 
          label="Secrets" 
          value={traits.secrets || ''} 
          onChange={(value) => setTraits({ ...traits, secrets: value })} 
        />
        
        <TextTrait 
          label="Weapon" 
          value={traits.weapon || ''} 
          onChange={(value) => setTraits({ ...traits, weapon: value })} 
        />
        
        <TextTrait 
          label="Home" 
          value={traits.home || ''} 
          onChange={(value) => setTraits({ ...traits, home: value })} 
        />
        
        <TextTrait 
          label="Parent" 
          value={traits.parent || ''} 
          onChange={(value) => setTraits({ ...traits, parent: value })} 
        />
        
        <TextTrait 
          label="Sibling" 
          value={traits.sibling || ''} 
          onChange={(value) => setTraits({ ...traits, sibling: value })} 
        />
        
        <TextTrait 
          label="Food" 
          value={traits.food || ''} 
          onChange={(value) => setTraits({ ...traits, food: value })} 
        />
        
        <TextTrait 
          label="Drink" 
          value={traits.drink || ''} 
          onChange={(value) => setTraits({ ...traits, drink: value })} 
        />
      </div>
    </div>
  );
};

export default MemesArtSubmissionTraits; 