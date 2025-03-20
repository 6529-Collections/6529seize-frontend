import { TraitsData } from "../submission/types/TraitsData";

/**
 * Enum defining all possible field types
 * Using string enum for better debugging and serialization
 */
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DROPDOWN = 'dropdown',
}

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
export interface TextFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.TEXT;
  readonly readOnly?: boolean;
  readonly placeholder?: string;
  readonly initialValue?: string;
}

/**
 * Numeric input field definition
 */
export interface NumberFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.NUMBER;
  readonly readOnly?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly initialValue?: number;
}

/**
 * Boolean toggle field definition
 */
export interface BooleanFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.BOOLEAN;
  readonly initialValue?: boolean;
}

/**
 * Dropdown select field definition
 */
export interface DropdownFieldDefinition extends BaseFieldDefinition {
  readonly type: FieldType.DROPDOWN;
  readonly options: readonly string[];
  readonly initialValue?: string;
}

// Union type of all field definitions
export type FieldDefinition = 
  | TextFieldDefinition 
  | NumberFieldDefinition 
  | BooleanFieldDefinition 
  | DropdownFieldDefinition;

// Section definition
export interface SectionDefinition {
  readonly title: string;
  readonly layout: 'single' | 'double';
  readonly fields: readonly FieldDefinition[];
}

// Meme name options constant
export const MEME_NAME_OPTIONS = [
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
        label: 'Artist', 
        field: 'artist',
        initialValue: '' 
      },
      { 
        type: FieldType.TEXT, 
        label: 'SEIZE Artist Profile', 
        field: 'seizeArtistProfile',
        readOnly: true,
        initialValue: '' 
      },
      { 
        type: FieldType.DROPDOWN, 
        label: 'Meme Name', 
        field: 'memeName',
        options: MEME_NAME_OPTIONS,
        initialValue: '' 
      }
    ]
  },
  {
    title: "Card Type Information",
    layout: "single",
    fields: [
      { 
        type: FieldType.TEXT, 
        label: 'Type - Card', 
        field: 'typeCard',
        readOnly: true,
        initialValue: 'Card' 
      },
      { 
        type: FieldType.TEXT, 
        label: 'Issuance Month', 
        field: 'issuanceMonth',
        readOnly: true,
        initialValue: '' 
      },
      { 
        type: FieldType.NUMBER, 
        label: 'Type - Season', 
        field: 'typeSeason',
        readOnly: true,
        initialValue: 11 
      },
      { 
        type: FieldType.NUMBER, 
        label: 'Type - Meme', 
        field: 'typeMeme',
        readOnly: true,
        initialValue: 1 
      },
      { 
        type: FieldType.NUMBER, 
        label: 'Type - Card Number', 
        field: 'typeCardNumber',
        readOnly: true,
        initialValue: 400 
      }
    ]
  },
  {
    title: "Card Points",
    layout: "single",
    fields: [
      { 
        type: FieldType.NUMBER, 
        label: 'Points - Power', 
        field: 'pointsPower',
        initialValue: 0
      },
      { 
        type: FieldType.NUMBER, 
        label: 'Points - Wisdom', 
        field: 'pointsWisdom',
        initialValue: 0
      },
      { 
        type: FieldType.NUMBER, 
        label: 'Points - Loki', 
        field: 'pointsLoki',
        initialValue: 0
      },
      { 
        type: FieldType.NUMBER, 
        label: 'Points - Speed', 
        field: 'pointsSpeed',
        initialValue: 0
      }
    ]
  },
  {
    title: "Card Attributes",
    layout: "double",
    fields: [
      { 
        type: FieldType.BOOLEAN, 
        label: 'Punk 6529', 
        field: 'punk6529',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Gradient', 
        field: 'gradient',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Movement', 
        field: 'movement',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Dynamic', 
        field: 'dynamic',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Interactive', 
        field: 'interactive',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Collab', 
        field: 'collab',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'OM', 
        field: 'om',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: '3D', 
        field: 'threeD',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Pepe', 
        field: 'pepe',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'GM', 
        field: 'gm',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Summer', 
        field: 'summer',
        initialValue: false
      },
      { 
        type: FieldType.BOOLEAN, 
        label: 'Tulip', 
        field: 'tulip',
        initialValue: false
      }
    ]
  },
  {
    title: "Card Special Properties",
    layout: "single",
    fields: [
      { 
        type: FieldType.TEXT, 
        label: 'Bonus', 
        field: 'bonus',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Boost', 
        field: 'boost',
        initialValue: ''
      },
      { 
        type: FieldType.DROPDOWN, 
        label: 'Palette', 
        field: 'palette',
        options: ["Color", "Black and White"],
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Style', 
        field: 'style',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Jewel', 
        field: 'jewel',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Superpower', 
        field: 'superpower',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Dharma', 
        field: 'dharma',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Gear', 
        field: 'gear',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Clothing', 
        field: 'clothing',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Element', 
        field: 'element',
        initialValue: ''
      }
    ]
  },
  {
    title: "Card Additional Details",
    layout: "single",
    fields: [
      { 
        type: FieldType.TEXT, 
        label: 'Mystery', 
        field: 'mystery',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Secrets', 
        field: 'secrets',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Weapon', 
        field: 'weapon',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Home', 
        field: 'home',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Parent', 
        field: 'parent',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Sibling', 
        field: 'sibling',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Food', 
        field: 'food',
        initialValue: ''
      },
      { 
        type: FieldType.TEXT, 
        label: 'Drink', 
        field: 'drink',
        initialValue: ''
      }
    ]
  }
];

// Runtime schema validation function - called in development only
function validateSchema(schema: readonly SectionDefinition[]): void {
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Validate sections
      schema.forEach((section, sectionIndex) => {
        if (!section.title) {
          throw new Error(`Section ${sectionIndex} is missing title`);
        }
        
        if (!section.layout || !['single', 'double'].includes(section.layout)) {
          throw new Error(`Section "${section.title}" has invalid layout: ${section.layout}`);
        }
        
        if (!section.fields || !Array.isArray(section.fields)) {
          throw new Error(`Section "${section.title}" is missing fields array`);
        }
        
        // Validate each field
        section.fields.forEach((field, fieldIndex) => {
          if (!field.type) {
            throw new Error(`Field ${fieldIndex} in section "${section.title}" is missing type`);
          }
          
          if (!field.field) {
            throw new Error(`Field ${fieldIndex} in section "${section.title}" is missing field name`);
          }
          
          if (!field.label) {
            throw new Error(`Field ${fieldIndex} in section "${section.title}" is missing label`);
          }
          
          // Type-specific validation
          if (field.type === FieldType.DROPDOWN && (!('options' in field) || !Array.isArray(field.options))) {
            throw new Error(`Dropdown field "${field.label}" is missing options array`);
          }
        });
      });
      
      // console.log('Schema validation passed');
    } catch (error) {
      // console.error('Schema validation failed:', error);
      // In development, we could throw to make the error more visible
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    }
  }
}

// Validate the schema on load (development only)
validateSchema(traitDefinitions);

// Generate form sections (with dynamic user profile)
export function getFormSections(userProfile: string | null | undefined): readonly SectionDefinition[] {
  const profile = userProfile || "User's Profile Name";
  
  return traitDefinitions.map(section => ({
    ...section,
    fields: section.fields.map(field => {
      // Handle special case for userProfile placeholder
      if (field.field === 'artist' || field.field === 'seizeArtistProfile') {
        return {
          ...field,
          placeholder: profile
        };
      }
      return field;
    })
  }));
}

// Get initial trait values
export function getInitialTraitsValues(): TraitsData {
  const initialValues: Record<string, any> = {
    title: '',
    description: '',
  };

  // Extract initial values from each field definition
  traitDefinitions.forEach(section => {
    section.fields.forEach(field => {
      // Don't override title and description which are explicitly set above
      if (field.field !== 'title' && field.field !== 'description') {
        initialValues[field.field] = field.initialValue !== undefined 
          ? field.initialValue 
          : (field.type === FieldType.BOOLEAN ? false : field.type === FieldType.NUMBER ? 0 : '');
      }
    });
  });

  // console.log("Initial traits values created with empty title:", initialValues.title);
  return initialValues as TraitsData;
}

// Function to be imported directly in useArtworkSubmissionForm to avoid circular dependency
export const initialTraits: TraitsData = getInitialTraitsValues();