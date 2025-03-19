import React, { useState, useMemo } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { AnimatePresence, motion } from "framer-motion";

import { ApiDropMetadata } from "../../../generated/models/ApiDropMetadata";
import { TraitsData } from "../memes/submission/types/TraitsData";
import { FieldType } from "../memes/traits/schema";

interface SingleWaveDropTraitsProps {
  readonly drop: ExtendedDrop;
}

// Extract trait data from drop metadata
const extractTraitsFromMetadata = (metadata: ApiDropMetadata[]): Partial<TraitsData> => {
  // Initialize with empty values for all fields to avoid type errors
  const traits: Partial<TraitsData> = {
    // Text fields
    artist: '',
    seizeArtistProfile: '',
    typeCard: '',
    issuanceMonth: '',
    memeName: '',
    palette: '',
    style: '',
    jewel: '',
    superpower: '',
    dharma: '',
    gear: '',
    clothing: '',
    element: '',
    mystery: '',
    secrets: '',
    weapon: '',
    home: '',
    parent: '',
    sibling: '',
    food: '',
    drink: '',
    bonus: '',
    boost: '',
    title: '',
    description: '',
    
    // Boolean fields
    punk6529: false,
    gradient: false,
    movement: false,
    dynamic: false,
    interactive: false,
    collab: false,
    om: false,
    threeD: false,
    pepe: false,
    gm: false,
    summer: false,
    tulip: false,
    
    // Number fields
    pointsPower: 0,
    pointsWisdom: 0,
    pointsLoki: 0,
    pointsSpeed: 0,
    typeSeason: 0,
    typeMeme: 0,
    typeCardNumber: 0
  };
  
  // Process each metadata item
  metadata.forEach(item => {
    // Normalize the key by removing spaces, dashes, and converting to lowercase
    const normalizedKey = item.data_key
      .toLowerCase()
      .replace(/[\s-_]+/g, '')
      .replace(/points-/g, 'points')
      .replace(/type-/g, 'type');
      
    const value = item.data_value;
    
    // Map for boolean traits (using normalized keys)
    const booleanTraits = [
      "punk6529", "gradient", "movement", "dynamic", "interactive", 
      "collab", "om", "threed", "3d", "pepe", "gm", "summer", "tulip"
    ];
    
    // Map for number traits (using normalized keys)
    const numberTraits = [
      "pointspower", "pointswisdom", "pointsloki", "pointsspeed", 
      "typeseason", "typememe", "typecardnumber", "season", "cardnumber"
    ];
    
    // Comprehensive key mapping for string traits
    const keyMapping: Record<string, keyof TraitsData> = {
      // Basic info
      "artist": "artist",
      "artistname": "artist",
      "memename": "memeName",
      "meme": "memeName",
      "title": "memeName",
      
      // Card type info
      "typecard": "typeCard",
      "card": "typeCard",
      "issuancemonth": "issuanceMonth",
      "issuancedate": "issuanceMonth",
      "month": "issuanceMonth",
      "typeseason": "typeSeason",
      "season": "typeSeason",
      "typememe": "typeMeme",
      "memenumber": "typeMeme",
      "typecardnumber": "typeCardNumber",
      "cardnumber": "typeCardNumber",
      "itemnumber": "typeCardNumber",
      
      // Special properties
      "palette": "palette",
      "colorpalette": "palette",
      "style": "style",
      "artstyle": "style",
      "jewel": "jewel",
      "gem": "jewel",
      "superpower": "superpower",
      "power": "superpower",
      "dharma": "dharma",
      "gear": "gear",
      "equipment": "gear",
      "clothing": "clothing",
      "outfit": "clothing",
      "element": "element",
      "bonus": "bonus",
      "boost": "boost",
      
      // Additional details
      "mystery": "mystery",
      "secrets": "secrets",
      "secret": "secrets",
      "weapon": "weapon",
      "home": "home",
      "house": "home",
      "parent": "parent",
      "sibling": "sibling",
      "food": "food",
      "drink": "drink",
      "beverage": "drink",
      
      // Special
      "seizeartistprofile": "seizeArtistProfile",
      "artistprofile": "seizeArtistProfile",
      "profilehandle": "seizeArtistProfile"
    };
    
    // Process based on trait type
    if (booleanTraits.includes(normalizedKey)) {
      // Handle special case for "3d" which maps to "threeD"
      const traitKey = normalizedKey === "3d" ? "threeD" : normalizedKey;
      
      // Type guard: ensure we're only assigning to known boolean fields
      const booleanKeys: Array<keyof TraitsData> = [
        "punk6529", "gradient", "movement", "dynamic", "interactive", 
        "collab", "om", "threeD", "pepe", "gm", "summer", "tulip"
      ];
      
      if (booleanKeys.includes(traitKey as keyof TraitsData)) {
        const boolKey = traitKey as keyof TraitsData;
        const boolValue = value.toLowerCase() === "true" || value === "1" || value.toLowerCase() === "yes";
        
        // Safe assignment with type checking
        if (typeof traits[boolKey] === 'boolean' || traits[boolKey] === undefined) {
          (traits as Record<keyof TraitsData, any>)[boolKey] = boolValue;
        }
      }
    }
    else if (numberTraits.includes(normalizedKey)) {
      // Map common variations to their canonical property names
      let traitKey: keyof TraitsData | null = null;
      
      // Type guard: map to known number fields
      if (normalizedKey === "season") traitKey = "typeSeason";
      else if (normalizedKey === "cardnumber") traitKey = "typeCardNumber";
      else if ([
        "pointsPower", "pointsWisdom", "pointsLoki", "pointsSpeed", 
        "typeSeason", "typeMeme", "typeCardNumber"
      ].includes(normalizedKey as keyof TraitsData)) {
        traitKey = normalizedKey as keyof TraitsData;
      }
      
      if (traitKey) {
        const numValue = Number(value) || 0;
        
        // Safe assignment with type checking
        if (typeof traits[traitKey] === 'number' || traits[traitKey] === undefined) {
          (traits as Record<keyof TraitsData, any>)[traitKey] = numValue;
        }
      }
    }
    else if (keyMapping[normalizedKey]) {
      const textKey = keyMapping[normalizedKey];
      
      // Safe assignment with type checking
      if (typeof traits[textKey] === 'string' || traits[textKey] === undefined) {
        (traits as Record<keyof TraitsData, any>)[textKey] = value;
      }
    }
    // Special case: handle any key that starts with "points"
    else if (normalizedKey.startsWith("points")) {
      const pointType = normalizedKey.replace("points", "");
      const capitalizedPointType = pointType.charAt(0).toUpperCase() + pointType.slice(1);
      
      if (["Power", "Wisdom", "Loki", "Speed"].includes(capitalizedPointType)) {
        const camelCaseKey = `points${capitalizedPointType}` as keyof TraitsData;
        const pointValue = Number(value) || 0;
        
        // Safe assignment with type checking
        if (typeof traits[camelCaseKey] === 'number' || traits[camelCaseKey] === undefined) {
          (traits as Record<keyof TraitsData, any>)[camelCaseKey] = pointValue;
        }
      }
    }
  });
  
  return traits;
};

// Helper component for displaying trait items
const TraitItem = ({ label, value }: { label: string; value: string | number | boolean }) => {
  // Skip empty string values or zero values
  if ((typeof value === "string" && !value) || 
      (typeof value === "number" && value === 0)) {
    return null;
  }
  
  // For boolean values, only show those that are true
  if (typeof value === "boolean" && !value) {
    return null;
  }

  // Format values appropriately
  let displayValue: string | number;
  
  if (typeof value === "boolean") {
    displayValue = "Yes";
  } else if (typeof value === "number") {
    displayValue = value;
  } else if (label === "Issuance Month" && value.includes("/")) {
    // Format date strings like "2023/02" to "February 2023"
    try {
      const [year, month] = value.split("/");
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthIndex = parseInt(month, 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        displayValue = `${monthNames[monthIndex]} ${year}`;
      } else {
        displayValue = value;
      }
    } catch (e) {
      displayValue = value;
    }
  } else {
    displayValue = value;
  }

  return (
    <div className="tw-flex tw-justify-between tw-py-2 tw-px-4">
      <span className="tw-text-iron-300 tw-text-sm">{label}</span>
      <span className="tw-text-primary-300 tw-text-sm tw-font-medium">{displayValue}</span>
    </div>
  );
};

// Component for displaying a category of traits with its own collapsible section
const TraitCategory = ({
  title,
  isOpen,
  toggleOpen,
  children,
}: {
  title: string;
  isOpen: boolean;
  toggleOpen: () => void;
  children: React.ReactNode;
}) => {
  // Check if there are any non-null children to display
  const childrenArray = React.Children.toArray(children);
  const hasVisibleChildren = childrenArray.some(child => child !== null);
  
  // Don't render the category if there are no visible children
  if (!hasVisibleChildren) {
    return null;
  }
  
  return (
    <div className="tw-border-b tw-border-iron-700 tw-last:tw-border-b-0">
      <button
        onClick={toggleOpen}
        className="tw-w-full tw-flex tw-items-center tw-justify-between tw-py-3 tw-px-4 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors hover:tw-text-primary-300 tw-border-0 tw-bg-transparent"
      >
        <span>{title}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="tw-w-4 tw-h-4 tw-text-iron-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tw-overflow-hidden"
          >
            <div className="tw-border-t tw-border-iron-800/80 tw-pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SingleWaveDropTraits: React.FC<SingleWaveDropTraitsProps> = ({
  drop,
}) => {
  const [isTraitsOpen, setIsTraitsOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Basic Information": true,
    "Card Points": false,
    "Card Attributes": false,
    "Special Properties": false,
    "Additional Details": false,
  });

  // Extract traits from drop metadata
  const traits = useMemo(() => {
    const extractedTraits = extractTraitsFromMetadata(drop.metadata);
    
    // Return full traits with fallback values for missing traits
    const finalTraits: TraitsData = {
      // Required basic fields that may not have been set
      title: '',
      description: '',
      
      // Fields with fallbacks from extracted data or defaults
      artist: extractedTraits.artist || drop.author.handle || "Unknown Artist",
      palette: extractedTraits.palette || "Color",
      style: extractedTraits.style || "",
      jewel: extractedTraits.jewel || "",
      superpower: extractedTraits.superpower || "",
      dharma: extractedTraits.dharma || "",
      gear: extractedTraits.gear || "",
      clothing: extractedTraits.clothing || "",
      element: extractedTraits.element || "",
      mystery: extractedTraits.mystery || "",
      secrets: extractedTraits.secrets || "",
      weapon: extractedTraits.weapon || "",
      home: extractedTraits.home || "",
      parent: extractedTraits.parent || "",
      sibling: extractedTraits.sibling || "",
      food: extractedTraits.food || "",
      drink: extractedTraits.drink || "",
      bonus: extractedTraits.bonus || "",
      boost: extractedTraits.boost || "",
      punk6529: extractedTraits.punk6529 || false,
      gradient: extractedTraits.gradient || false,
      movement: extractedTraits.movement || false,
      dynamic: extractedTraits.dynamic || false,
      interactive: extractedTraits.interactive || false,
      collab: extractedTraits.collab || false,
      om: extractedTraits.om || false,
      threeD: extractedTraits.threeD || false,
      pepe: extractedTraits.pepe || false,
      gm: extractedTraits.gm || false,
      summer: extractedTraits.summer || false,
      tulip: extractedTraits.tulip || false,
      memeName: extractedTraits.memeName || drop.title || "WAGMI",
      pointsPower: extractedTraits.pointsPower || 0,
      pointsWisdom: extractedTraits.pointsWisdom || 0,
      pointsLoki: extractedTraits.pointsLoki || 0,
      pointsSpeed: extractedTraits.pointsSpeed || 0,
      seizeArtistProfile: extractedTraits.seizeArtistProfile || drop.author.handle || "",
      typeCard: extractedTraits.typeCard || "Card",
      issuanceMonth: extractedTraits.issuanceMonth || new Date().toISOString().substring(0, 7).replace("-", "/"),
      typeSeason: extractedTraits.typeSeason || 11,
      typeMeme: extractedTraits.typeMeme || 1,
      typeCardNumber: extractedTraits.typeCardNumber || 0,
    };
    
    return finalTraits;
  }, [drop]);

  // Check if there are any meaningful traits to display
  const hasTraits = useMemo(() => {
    // Check for any non-empty or non-zero traits
    const nonEmptyCount = Object.entries(traits).filter(([_, value]) => {
      if (typeof value === "string") return !!value;
      if (typeof value === "number") return value > 0;
      if (typeof value === "boolean") return value === true;
      return false;
    }).length;
    
    // Only show traits section if we have at least 3 valid traits
    return nonEmptyCount >= 3;
  }, [traits]);
  
  // If there are no meaningful traits to display, don't render the component
  if (!hasTraits) {
    return null;
  }

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div>
      <button
        onClick={() => setIsTraitsOpen(!isTraitsOpen)}
        className={`tw-text-sm tw-w-full tw-group tw-ring-1 tw-ring-iron-700 desktop-hover:hover:tw-ring-primary-400/30 tw-flex tw-justify-between tw-items-center tw-font-medium tw-py-2.5 md:tw-py-3 tw-px-5 tw-bg-iron-900 tw-transition-all tw-duration-300 tw-border-0 ${
          isTraitsOpen ? "tw-rounded-t-xl" : "tw-rounded-xl"
        }`}
      >
        <span
          className={
            isTraitsOpen
              ? "tw-text-primary-300"
              : "tw-text-iron-300 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
          }
        >
          Artwork Traits
        </span>
        <motion.svg
          animate={{ rotate: isTraitsOpen ? 0 : -90 }}
          transition={{ duration: 0.3 }}
          className={`tw-w-4 tw-h-4 tw-flex-shrink-0 ${
            isTraitsOpen
              ? "tw-text-primary-300"
              : "tw-text-iron-400 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isTraitsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-overflow-hidden tw-ring-1 tw-ring-iron-700 tw-rounded-b-xl tw-bg-iron-900"
          >
            <div className="tw-max-h-[19.75rem] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
              <TraitCategory
                title="Basic Information"
                isOpen={openCategories["Basic Information"]}
                toggleOpen={() => toggleCategory("Basic Information")}
              >
                <TraitItem label="Artist" value={traits.artist} />
                <TraitItem label="Meme Name" value={traits.memeName} />
                <TraitItem label="Season" value={traits.typeSeason} />
                <TraitItem label="Card Number" value={traits.typeCardNumber} />
                <TraitItem label="Issuance Month" value={traits.issuanceMonth} />
              </TraitCategory>

              <TraitCategory
                title="Card Points"
                isOpen={openCategories["Card Points"]}
                toggleOpen={() => toggleCategory("Card Points")}
              >
                <TraitItem label="Power" value={traits.pointsPower} />
                <TraitItem label="Wisdom" value={traits.pointsWisdom} />
                <TraitItem label="Loki" value={traits.pointsLoki} />
                <TraitItem label="Speed" value={traits.pointsSpeed} />
              </TraitCategory>

              <TraitCategory
                title="Card Attributes"
                isOpen={openCategories["Card Attributes"]}
                toggleOpen={() => toggleCategory("Card Attributes")}
              >
                <div className="tw-grid tw-grid-cols-2 tw-gap-x-4">
                  <TraitItem label="Punk 6529" value={traits.punk6529} />
                  <TraitItem label="Gradient" value={traits.gradient} />
                  <TraitItem label="Movement" value={traits.movement} />
                  <TraitItem label="Dynamic" value={traits.dynamic} />
                  <TraitItem label="Interactive" value={traits.interactive} />
                  <TraitItem label="Collab" value={traits.collab} />
                  <TraitItem label="OM" value={traits.om} />
                  <TraitItem label="3D" value={traits.threeD} />
                  <TraitItem label="Pepe" value={traits.pepe} />
                  <TraitItem label="GM" value={traits.gm} />
                  <TraitItem label="Summer" value={traits.summer} />
                  <TraitItem label="Tulip" value={traits.tulip} />
                </div>
              </TraitCategory>

              <TraitCategory
                title="Special Properties"
                isOpen={openCategories["Special Properties"]}
                toggleOpen={() => toggleCategory("Special Properties")}
              >
                <TraitItem label="Palette" value={traits.palette} />
                <TraitItem label="Style" value={traits.style} />
                <TraitItem label="Jewel" value={traits.jewel} />
                <TraitItem label="Superpower" value={traits.superpower} />
                <TraitItem label="Dharma" value={traits.dharma} />
                <TraitItem label="Gear" value={traits.gear} />
                <TraitItem label="Clothing" value={traits.clothing} />
                <TraitItem label="Element" value={traits.element} />
                <TraitItem label="Bonus" value={traits.bonus} />
                <TraitItem label="Boost" value={traits.boost} />
              </TraitCategory>

              <TraitCategory
                title="Additional Details"
                isOpen={openCategories["Additional Details"]}
                toggleOpen={() => toggleCategory("Additional Details")}
              >
                <TraitItem label="Mystery" value={traits.mystery} />
                <TraitItem label="Secrets" value={traits.secrets} />
                <TraitItem label="Weapon" value={traits.weapon} />
                <TraitItem label="Home" value={traits.home} />
                <TraitItem label="Parent" value={traits.parent} />
                <TraitItem label="Sibling" value={traits.sibling} />
                <TraitItem label="Food" value={traits.food} />
                <TraitItem label="Drink" value={traits.drink} />
              </TraitCategory>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
