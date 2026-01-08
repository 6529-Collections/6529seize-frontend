"use client";

import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { isNumber } from "lodash";
import React, { useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import type { TraitsData } from "../memes/submission/types/TraitsData";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  FIELD_TO_LABEL_MAP,
  MEME_TRAITS_SORT_ORDER,
} from "../memes/traits/schema";

interface SingleWaveDropTraitsProps {
  readonly drop: ExtendedDrop;
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{
  label: string;
  value: string | number | boolean;
}> = ({ label, value }) => {
  const isMobile = useIsMobileDevice();

  // Format display value
  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  return (
    <div className="tw-flex-1 tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-px-3 tw-py-2 tw-flex tw-flex-col tw-min-w-[100px]">
      <span className="tw-block tw-text-[9px] tw-uppercase tw-tracking-wide tw-text-iron-500 tw-mb-1 tw-font-normal">
        {label}
      </span>
      <>
        <span
          className="tw-text-xs tw-font-medium tw-text-iron-200 tw-truncate"
          data-tooltip-id={`trait-${label}-${displayValue}`}
        >
          {displayValue}
        </span>
        {!isMobile && (
          <Tooltip
            id={`trait-${label}-${displayValue}`}
            place="top"
            offset={8}
            opacity={1}
            style={{ ...TOOLTIP_STYLES, maxWidth: "300px", wordWrap: "break-word" }}
          >
            <span className="tw-text-xs">{displayValue}</span>
          </Tooltip>
        )}
      </>
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
      .replace(/[\s-_]+/g, "")
      .replaceAll("points-", "points")
      .replaceAll("type-", "type");

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
    } else if (keyMapping[normalizedKey.toLowerCase()]) {
      const textKey = keyMapping[normalizedKey.toLowerCase()];

      // Safe assignment with type checking
      if (
        typeof traits[textKey!] === "string" ||
        traits[textKey!] === undefined
      ) {
        (traits as Record<keyof TraitsData, any>)[textKey!] = value;
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

    // Extract content from the first part if available
    const description =
      drop.parts && drop.parts.length > 0 ? drop.parts[0]?.content || "" : "";

    // Return full traits with fallback values for missing traits
    const finalTraits: TraitsData = {
      // Use drop title and first part content if available
      title: drop.title || extractedTraits.title || "",
      description: description || extractedTraits.description || "",

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
      bonus: extractedTraits.bonus ?? "",
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

  // Convert traits to array of items for display with logical ordering
  const traitItems = useMemo(() => {
    // Define priority order for key fields
    const priorityKeys = [
      // Basic identity fields
      "artist",
      "seizeArtistProfile",
      "memeName",
      "title",
      "description",

      // Boolean trait flags (Yes/No values)
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

      // Visual properties
      "style",
      "palette",
      "jewel",

      // Character attributes
      "superpower",
      "dharma",
      "element",

      // Equipment and appearance
      "gear",
      "clothing",
      "weapon",

      // Environment and context
      "home",
      "parent",
      "sibling",

      // Preferences
      "food",
      "drink",

      // Special characteristics
      "mystery",
      "secrets",

      // Boosts and bonuses
      "bonus",
      "boost",

      // Points fields
      "pointsPower",
      "pointsWisdom",
      "pointsLoki",
      "pointsSpeed",
    ];

    const items: { label: string; value: any }[] = [];

    // First add items in priority order
    priorityKeys.forEach((key) => {
      if (key in traits && traits[key as keyof TraitsData] !== undefined) {
        // For strings, only include if not empty
        const value = traits[key as keyof TraitsData];
        if (
          (typeof value === "string" && value) ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          items.push({ label: key, value });
        }
      }
    });

    // Add any remaining items not in the priority list
    Object.entries(traits).forEach(([key, value]) => {
      if (!priorityKeys.includes(key)) {
        if (
          (typeof value === "string" && value) ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          items.push({ label: key, value });
        }
      }
    });

    items.sort((a, b) => {
      const aIndex = MEME_TRAITS_SORT_ORDER.indexOf(a.label);
      const bIndex = MEME_TRAITS_SORT_ORDER.indexOf(b.label);
      return (
        (aIndex === -1 ? Infinity : aIndex) -
        (bIndex === -1 ? Infinity : bIndex)
      );
    });

    items.forEach((item) => {
      const knownKey =
        FIELD_TO_LABEL_MAP[item.label as keyof typeof FIELD_TO_LABEL_MAP];
      const formattedKey =
        knownKey ??
        item.label
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      item.label = formattedKey;

      if (isNumber(item.value)) {
        item.value = item.value.toLocaleString();
      }
    });

    return items;
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
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-3">
        {/* Always show first 3 items */}
        {traitItems.slice(0, 3).map((item) => (
          <MetadataItem
            key={item.label}
            label={
              FIELD_TO_LABEL_MAP[
                item.label as keyof typeof FIELD_TO_LABEL_MAP
              ] ?? item.label
            }
            value={item.value}
          />
        ))}

        {/* Show more button or additional items */}
        {traitItems.length > 3 &&
          (showAllTraits ? (
            <>
              {traitItems.slice(3).map((item) => (
                <MetadataItem
                  key={item.label}
                  label={
                    FIELD_TO_LABEL_MAP[
                      item.label as keyof typeof FIELD_TO_LABEL_MAP
                    ] ?? item.label
                  }
                  value={item.value}
                />
              ))}
              <button
                onClick={handleShowLess}
                className="tw-flex-1 tw-min-w-[100px] tw-px-3 tw-py-2 tw-bg-iron-900/30 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-text-xs tw-text-iron-300 hover:tw-text-iron-40 tw-transition-colors tw-flex tw-items-center tw-justify-center tw-cursor-pointer">
                Show less
              </button>
            </>
          ) : (
            <button
              onClick={handleShowMore}
              className="tw-flex-1 tw-min-w-[100px] tw-px-3 tw-py-2 tw-bg-iron-900/30 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-text-xs tw-text-iron-300 hover:tw-text-iron-50 tw-transition-colors tw-flex tw-items-center tw-justify-center tw-cursor-pointer">
              Show all
            </button>
          ))}
      </div>
    </div>
  );
};
