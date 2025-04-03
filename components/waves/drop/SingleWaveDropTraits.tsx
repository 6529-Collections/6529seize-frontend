import React, { useState, useMemo } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import Tippy from "@tippyjs/react";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import { ApiDropMetadata } from "../../../generated/models/ApiDropMetadata";
import { TraitsData } from "../memes/submission/types/TraitsData";

interface SingleWaveDropTraitsProps {
  readonly drop: ExtendedDrop;
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{
  label: string;
  value: string | number | boolean;
}> = ({ label, value }) => {
  const isMobile = useIsMobileDevice();

  // Skip empty values
  if (
    (typeof value === "string" && !value) ||
    (typeof value === "number" && value === 0) ||
    (typeof value === "boolean" && !value)
  ) {
    return null;
  }

  // Format display value
  const displayValue = typeof value === "boolean" ? "Yes" : String(value);

  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800 tw-flex tw-flex-col tw-gap-y-1">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">{label}:</span>
      <Tippy
        disabled={isMobile}
        content={displayValue}
        placement="top"
        theme="dark"
      >
        <span className="tw-text-iron-200 tw-text-xs tw-font-medium tw-truncate">
          {displayValue}
        </span>
      </Tippy>
    </div>
  );
};

// Extract trait data from drop metadata
const extractTraitsFromMetadata = (
  metadata: ApiDropMetadata[]
): Partial<TraitsData> => {
  // Initialize with empty values for all fields to avoid type errors
  const traits: Partial<TraitsData> = {
    // Text fields
    artist: "",
    seizeArtistProfile: "",
    memeName: "",
    palette: "",
    style: "",
    jewel: "",
    superpower: "",
    dharma: "",
    gear: "",
    clothing: "",
    element: "",
    mystery: "",
    secrets: "",
    weapon: "",
    home: "",
    parent: "",
    sibling: "",
    food: "",
    drink: "",
    bonus: "",
    boost: "",
    title: "",
    description: "",

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
  };

  // Process each metadata item
  metadata.forEach((item) => {
    // Normalize the key by removing spaces, dashes, and converting to lowercase
    const normalizedKey = item.data_key
      .toLowerCase()
      .replace(/[\s-_]+/g, "")
      .replace(/points-/g, "points")
      .replace(/type-/g, "type");

    const value = item.data_value;

    // Map for boolean traits (using normalized keys)
    const booleanTraits = [
      "punk6529",
      "gradient",
      "movement",
      "dynamic",
      "interactive",
      "collab",
      "om",
      "threed",
      "3d",
      "pepe",
      "gm",
      "summer",
      "tulip",
    ];

    // Map for number traits (using normalized keys)
    const numberTraits = [
      "pointspower",
      "pointswisdom",
      "pointsloki",
      "pointsspeed",
    ];

    // Comprehensive key mapping for string traits
    const keyMapping: Record<string, keyof TraitsData> = {
      // Basic info
      artist: "artist",
      artistname: "artist",
      memename: "memeName",
      meme: "memeName",
      title: "memeName",

      // Special properties
      palette: "palette",
      colorpalette: "palette",
      style: "style",
      artstyle: "style",
      jewel: "jewel",
      gem: "jewel",
      superpower: "superpower",
      power: "superpower",
      dharma: "dharma",
      gear: "gear",
      equipment: "gear",
      clothing: "clothing",
      outfit: "clothing",
      element: "element",
      bonus: "bonus",
      boost: "boost",

      // Additional details
      mystery: "mystery",
      secrets: "secrets",
      secret: "secrets",
      weapon: "weapon",
      home: "home",
      house: "home",
      parent: "parent",
      sibling: "sibling",
      food: "food",
      drink: "drink",
      beverage: "drink",

      // Special
      seizeartistprofile: "seizeArtistProfile",
      artistprofile: "seizeArtistProfile",
      profilehandle: "seizeArtistProfile",
    };

    // Process based on trait type
    if (booleanTraits.includes(normalizedKey)) {
      // Handle special case for "3d" which maps to "threeD"
      const traitKey = normalizedKey === "3d" ? "threeD" : normalizedKey;

      // Type guard: ensure we're only assigning to known boolean fields
      const booleanKeys: Array<keyof TraitsData> = [
        "punk6529",
        "gradient",
        "movement",
        "dynamic",
        "interactive",
        "collab",
        "om",
        "threeD",
        "pepe",
        "gm",
        "summer",
        "tulip",
      ];

      if (booleanKeys.includes(traitKey as keyof TraitsData)) {
        const boolKey = traitKey as keyof TraitsData;
        const boolValue =
          value.toLowerCase() === "true" ||
          value === "1" ||
          value.toLowerCase() === "yes";

        // Safe assignment with type checking
        if (
          typeof traits[boolKey] === "boolean" ||
          traits[boolKey] === undefined
        ) {
          (traits as Record<keyof TraitsData, any>)[boolKey] = boolValue;
        }
      }
    } else if (numberTraits.includes(normalizedKey)) {
      // Map common variations to their canonical property names
      let traitKey: keyof TraitsData | null = null;

      // Type guard: map to known number fields
      if (
        ["pointsPower", "pointsWisdom", "pointsLoki", "pointsSpeed"].includes(
          normalizedKey as keyof TraitsData
        )
      ) {
        traitKey = normalizedKey as keyof TraitsData;
      }

      if (traitKey) {
        const numValue = Number(value) || 0;

        // Safe assignment with type checking
        if (
          typeof traits[traitKey] === "number" ||
          traits[traitKey] === undefined
        ) {
          (traits as Record<keyof TraitsData, any>)[traitKey] = numValue;
        }
      }
    } else if (keyMapping[normalizedKey]) {
      const textKey = keyMapping[normalizedKey];

      // Safe assignment with type checking
      if (
        typeof traits[textKey] === "string" ||
        traits[textKey] === undefined
      ) {
        (traits as Record<keyof TraitsData, any>)[textKey] = value;
      }
    }
    // Special case: handle any key that starts with "points"
    else if (normalizedKey.startsWith("points")) {
      const pointType = normalizedKey.replace("points", "");
      const capitalizedPointType =
        pointType.charAt(0).toUpperCase() + pointType.slice(1);

      if (["Power", "Wisdom", "Loki", "Speed"].includes(capitalizedPointType)) {
        const camelCaseKey =
          `points${capitalizedPointType}` as keyof TraitsData;
        const pointValue = Number(value) || 0;

        // Safe assignment with type checking
        if (
          typeof traits[camelCaseKey] === "number" ||
          traits[camelCaseKey] === undefined
        ) {
          (traits as Record<keyof TraitsData, any>)[camelCaseKey] = pointValue;
        }
      }
    }
  });

  return traits;
};

export const SingleWaveDropTraits: React.FC<SingleWaveDropTraitsProps> = ({
  drop,
}) => {
  const [showAllTraits, setShowAllTraits] = useState(false);

  // Extract traits from drop metadata
  const traits = useMemo(() => {
    const extractedTraits = extractTraitsFromMetadata(drop.metadata);

    // Return full traits with fallback values for missing traits
    const finalTraits: TraitsData = {
      // Required basic fields that may not have been set
      title: "",
      description: "",

      // Fields with fallbacks from extracted data or defaults
      artist: extractedTraits.artist ?? "",
      palette: extractedTraits.palette ?? "",
      style: extractedTraits.style ?? "",
      jewel: extractedTraits.jewel ?? "",
      superpower: extractedTraits.superpower ?? "",
      dharma: extractedTraits.dharma ?? "",
      gear: extractedTraits.gear ?? "",
      clothing: extractedTraits.clothing ?? "",
      element: extractedTraits.element ?? "",
      mystery: extractedTraits.mystery ?? "",
      secrets: extractedTraits.secrets ?? "",
      weapon: extractedTraits.weapon ?? "",
      home: extractedTraits.home ?? "",
      parent: extractedTraits.parent ?? "",
      sibling: extractedTraits.sibling ?? "",
      food: extractedTraits.food ?? "",
      drink: extractedTraits.drink ?? "",
      bonus: extractedTraits.boost ?? "",
      boost: extractedTraits.boost ?? "",
      punk6529: extractedTraits.punk6529 ?? false,
      gradient: extractedTraits.gradient ?? false,
      movement: extractedTraits.movement ?? false,
      dynamic: extractedTraits.dynamic ?? false,
      interactive: extractedTraits.interactive ?? false,
      collab: extractedTraits.collab ?? false,
      om: extractedTraits.om ?? false,
      threeD: extractedTraits.threeD ?? false,
      pepe: extractedTraits.pepe ?? false,
      gm: extractedTraits.gm ?? false,
      summer: extractedTraits.summer ?? false,
      tulip: extractedTraits.tulip ?? false,
      memeName: extractedTraits.memeName ?? "",
      pointsPower: extractedTraits.pointsPower ?? 0,
      pointsWisdom: extractedTraits.pointsWisdom ?? 0,
      pointsLoki: extractedTraits.pointsLoki ?? 0,
      pointsSpeed: extractedTraits.pointsSpeed ?? 0,
      seizeArtistProfile: extractedTraits.seizeArtistProfile ?? "",
    };

    return finalTraits;
  }, [drop]);

  // Convert traits to array of items for display
  const traitItems = useMemo(() => {
    return Object.entries(traits)
      .filter(([_, value]) => {
        if (typeof value === "string") return !!value;
        if (typeof value === "number") return value > 0;
        if (typeof value === "boolean") return value === true;
        return false;
      })
      .map(([key, value]) => {
        // Format key for display (camelCase to Title Case)
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .replace(/Points /, "") // Remove "Points " prefix
          .trim();

        return { label: formattedKey, value };
      });
  }, [traits]);

  // If there are no meaningful traits to display, don't render the component
  if (traitItems.length === 0) {
    return null;
  }

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(true);
  };

  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(false);
  };

  return (
    <div className="tw-w-full">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-3 tw-gap-2">
        {/* Always show first 2 items (changed from 4) */}
        {traitItems.slice(0, 2).map((item) => (
          <MetadataItem
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}

        {/* Show more button or additional items */}
        {traitItems.length > 2 &&
          (showAllTraits ? (
            <>
              {traitItems.slice(2).map((item) => (
                <MetadataItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
              <button
                onClick={handleShowLess}
                className="tw-text-xs tw-text-iron-400 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left"
              >
                Show less
              </button>
            </>
          ) : (
            <button
              onClick={handleShowMore}
              className="tw-text-xs tw-text-iron-400 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left"
            >
              Show all
            </button>
          ))}
      </div>
    </div>
  );
};
