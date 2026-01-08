import { publicEnv } from "@/config/env";
import type { TraitsData } from "../submission/types/TraitsData";

/**
 * Enum defining all possible field types
 * Using string enum for better debugging and serialization
 */
export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DROPDOWN = "dropdown",
}

// Map from field name to human-readable label for reuse across components
export const FIELD_TO_LABEL_MAP: Record<keyof TraitsData, string> = {
  // Basic fields
  title: "Title",
  description: "Description",

  // Text fields
  artist: "Artist",
  seizeArtistProfile: "SEIZE Artist Profile",
  palette: "Palette",
  style: "Style",
  jewel: "Jewel",
  superpower: "Superpower",
  dharma: "Dharma",
  gear: "Gear",
  clothing: "Clothing",
  element: "Element",
  mystery: "Mystery",
  secrets: "Secrets",
  weapon: "Weapon",
  home: "Home",
  parent: "Parent",
  sibling: "Sibling",
  food: "Food",
  drink: "Drink",
  bonus: "Bonus",
  boost: "Boost",

  // Boolean fields
  punk6529: "Punk 6529",
  gradient: "Gradient",
  movement: "Movement",
  dynamic: "Dynamic",
  interactive: "Interactive",
  collab: "Collab",
  om: "OM",
  threeD: "3D",
  pepe: "Pepe",
  gm: "GM",
  summer: "Summer",
  tulip: "Tulip",

  // Dropdown fields
  memeName: "Meme Name",

  // Number fields
  pointsPower: "Points - Power",
  pointsWisdom: "Points - Wisdom",
  pointsLoki: "Points - Loki",
  pointsSpeed: "Points - Speed",
};

/**
 * Base interface for all field definitions
 */
export interface BaseFieldDefinition {
  readonly type: FieldType;
  readonly field: keyof TraitsData;
  readonly label: string;
}

/**
 * Text input field definition
 */
interface TextFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.TEXT;
  readonly readOnly?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly initialValue?: string | undefined;
}

/**
 * Numeric input field definition
 */
export interface NumberFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.NUMBER;
  readonly readOnly?: boolean | undefined;
  readonly min: number;
  readonly max: number;
  readonly initialValue?: number | undefined;
}

/**
 * Boolean toggle field definition
 */
interface BooleanFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.BOOLEAN;
  readonly initialValue?: boolean | undefined;
}

/**
 * Dropdown select field definition
 */
export interface DropdownFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.DROPDOWN;
  readonly options: readonly string[];
  readonly initialValue?: string | undefined;
}

// Union type of all field definitions
export type FieldDefinition =
  | TextFieldDefinition
  | NumberFieldDefinition
  | BooleanFieldDefinition
  | DropdownFieldDefinition;

// Section definition
interface SectionDefinition {
  readonly title: string;
  readonly layout: "single" | "double";
  readonly fields: readonly FieldDefinition[];
}

// Meme name options constant
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
] as const;

// Define the trait definitions - Single source of truth
export const traitDefinitions: readonly SectionDefinition[] = [
  {
    title: "Basic Information",
    layout: "single",
    fields: [
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.artist,
        field: "artist",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.seizeArtistProfile,
        field: "seizeArtistProfile",
        readOnly: true,
        initialValue: "",
      },
      {
        type: FieldType.DROPDOWN,
        label: FIELD_TO_LABEL_MAP.memeName,
        field: "memeName",
        options: MEME_NAME_OPTIONS,
        initialValue: "",
      },
    ],
  },

  {
    title: "Card Points",
    layout: "single",
    fields: [
      {
        type: FieldType.NUMBER,
        label: FIELD_TO_LABEL_MAP.pointsPower,
        field: "pointsPower",
        initialValue: 0,
        min: -10000000000,
        max: 10000000000,
      },
      {
        type: FieldType.NUMBER,
        label: FIELD_TO_LABEL_MAP.pointsWisdom,
        field: "pointsWisdom",
        min: -10000000000,
        max: 10000000000,
      },
      {
        type: FieldType.NUMBER,
        label: FIELD_TO_LABEL_MAP.pointsLoki,
        field: "pointsLoki",
        min: -10000000000,
        max: 10000000000,
      },
      {
        type: FieldType.NUMBER,
        label: FIELD_TO_LABEL_MAP.pointsSpeed,
        field: "pointsSpeed",
        min: -10000000000,
        max: 10000000000,
      },
    ],
  },
  {
    title: "Card Attributes",
    layout: "double",
    fields: [
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.punk6529,
        field: "punk6529",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.gradient,
        field: "gradient",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.movement,
        field: "movement",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.dynamic,
        field: "dynamic",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.interactive,
        field: "interactive",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.collab,
        field: "collab",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.om,
        field: "om",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.threeD,
        field: "threeD",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.pepe,
        field: "pepe",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.gm,
        field: "gm",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.summer,
        field: "summer",
        initialValue: false,
      },
      {
        type: FieldType.BOOLEAN,
        label: FIELD_TO_LABEL_MAP.tulip,
        field: "tulip",
        initialValue: false,
      },
    ],
  },
  {
    title: "Card Special Properties",
    layout: "single",
    fields: [
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.bonus,
        field: "bonus",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.boost,
        field: "boost",
        initialValue: "",
      },
      {
        type: FieldType.DROPDOWN,
        label: FIELD_TO_LABEL_MAP.palette,
        field: "palette",
        options: ["Color", "Black and White"],
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.style,
        field: "style",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.jewel,
        field: "jewel",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.superpower,
        field: "superpower",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.dharma,
        field: "dharma",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.gear,
        field: "gear",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.clothing,
        field: "clothing",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.element,
        field: "element",
        initialValue: "",
      },
    ],
  },
  {
    title: "Card Additional Details",
    layout: "single",
    fields: [
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.mystery,
        field: "mystery",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.secrets,
        field: "secrets",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.weapon,
        field: "weapon",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.home,
        field: "home",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.parent,
        field: "parent",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.sibling,
        field: "sibling",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.food,
        field: "food",
        initialValue: "",
      },
      {
        type: FieldType.TEXT,
        label: FIELD_TO_LABEL_MAP.drink,
        field: "drink",
        initialValue: "",
      },
    ],
  },
];

// Runtime schema validation function - called in development only
function validateSchema(schema: readonly SectionDefinition[]): void {
  if (publicEnv.NODE_ENV !== "production") {
    try {
      // Validate sections
      schema.forEach((section, sectionIndex) => {
        if (!section.title) {
          throw new Error(`Section ${sectionIndex} is missing title`);
        }

        if (!section.layout || !["single", "double"].includes(section.layout)) {
          throw new Error(
            `Section "${section.title}" has invalid layout: ${section.layout}`
          );
        }

        if (!section.fields || !Array.isArray(section.fields)) {
          throw new Error(`Section "${section.title}" is missing fields array`);
        }

        // Validate each field
        section.fields.forEach((field, fieldIndex) => {
          if (!field.type) {
            throw new Error(
              `Field ${fieldIndex} in section "${section.title}" is missing type`
            );
          }

          if (!field.field) {
            throw new Error(
              `Field ${fieldIndex} in section "${section.title}" is missing field name`
            );
          }

          if (!field.label) {
            throw new Error(
              `Field ${fieldIndex} in section "${section.title}" is missing label`
            );
          }

          // Type-specific validation
          if (
            field.type === FieldType.DROPDOWN &&
            (!("options" in field) || !Array.isArray(field.options))
          ) {
            throw new Error(
              `Dropdown field "${field.label}" is missing options array`
            );
          }
        });
      });
    } catch (error) {
      console.error("Schema validation failed:", error);
      // In development, we could throw to make the error more visible
      if (publicEnv.NODE_ENV === "development") {
        throw error;
      }
    }
  }
}

// Validate the schema on load (development only)
validateSchema(traitDefinitions);

// Generate form sections (with dynamic user profile)
export function getFormSections(
  userProfile: string | null | undefined
): readonly SectionDefinition[] {
  const profile = userProfile ?? "User's Profile Name";

  return traitDefinitions.map((section) => ({
    ...section,
    fields: section.fields.map((field) => {
      // Handle special case for userProfile placeholder
      if (field.field === "artist" || field.field === "seizeArtistProfile") {
        return {
          ...field,
          placeholder: profile,
        };
      }
      return field;
    }),
  }));
}

// Get initial trait values
export function getInitialTraitsValues(): TraitsData {
  const initialValues: Record<string, any> = {
    title: "",
    description: "",
  };

  // Extract initial values from each field definition
  traitDefinitions.forEach((section) => {
    section.fields.forEach((field) => {
      // Don't override title and description which are explicitly set above
      if (field.field !== "title" && field.field !== "description") {
        initialValues[field.field] =
          field.initialValue !== undefined
            ? field.initialValue
            : field.type === FieldType.BOOLEAN
            ? false
            : field.type === FieldType.NUMBER
            ? 0
            : "";
      }
    });
  });

  return initialValues as TraitsData;
}

export const MEME_TRAITS_SORT_ORDER = [
  "artist",
  "memeName",
  "title",
  "description",
  "seizeArtistProfile",
  "punk6529",
  "gradient",
  "palette",
  "movement",
  "dynamic",
  "interactive",
  "collab",
  "om",
  "threeD",
  "type",
  "style",
  "jewel",
  "superpower",
  "dharma",
  "gear",
  "clothing",
  "element",
  "mystery",
  "secrets",
  "weapon",
  "home",
  "parent",
  "sibling",
  "food",
  "drink",
  "pepe",
  "gm",
  "bonus",
  "boost",
  "typeMeme",
  "typeSeason",
  "typeCard",
  "pointsPower",
  "pointsWisdom",
  "pointsLoki",
  "pointsSpeed",
  "summer",
  "tulip",
];
