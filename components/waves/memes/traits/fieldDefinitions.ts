import { SectionDefinition } from './types';

// Define meme name options for dropdown
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
];

// Get the form sections definition function - takes userProfile for placeholder values
export const getFormSections = (userProfile: string): readonly SectionDefinition[] => [
  {
    title: "Basic Information",
    layout: "single",
    fields: [
      { 
        type: 'text', 
        label: 'Artist', 
        field: 'artist', 
        placeholder: userProfile 
      },
      { 
        type: 'text', 
        label: 'SEIZE Artist Profile', 
        field: 'seizeArtistProfile', 
        readOnly: true, 
        placeholder: userProfile 
      },
      { 
        type: 'dropdown', 
        label: 'Meme Name', 
        field: 'memeName', 
        options: MEME_NAME_OPTIONS 
      }
    ]
  },
  {
    title: "Card Type Information",
    layout: "single",
    fields: [
      { 
        type: 'text', 
        label: 'Type - Card', 
        field: 'typeCard', 
        readOnly: true 
      },
      { 
        type: 'text', 
        label: 'Issuance Month', 
        field: 'issuanceMonth', 
        readOnly: true 
      },
      { 
        type: 'number', 
        label: 'Type - Season', 
        field: 'typeSeason', 
        readOnly: true 
      },
      { 
        type: 'number', 
        label: 'Type - Meme', 
        field: 'typeMeme', 
        readOnly: true 
      },
      { 
        type: 'number', 
        label: 'Type - Card Number', 
        field: 'typeCardNumber', 
        readOnly: true 
      }
    ]
  },
  {
    title: "Card Points",
    layout: "single",
    fields: [
      { 
        type: 'number', 
        label: 'Points - Power', 
        field: 'pointsPower' 
      },
      { 
        type: 'number', 
        label: 'Points - Wisdom', 
        field: 'pointsWisdom' 
      },
      { 
        type: 'number', 
        label: 'Points - Loki', 
        field: 'pointsLoki' 
      },
      { 
        type: 'number', 
        label: 'Points - Speed', 
        field: 'pointsSpeed' 
      }
    ]
  },
  {
    title: "Card Attributes",
    layout: "double",
    fields: [
      { 
        type: 'boolean', 
        label: 'Punk 6529', 
        field: 'punk6529' 
      },
      { 
        type: 'boolean', 
        label: 'Gradient', 
        field: 'gradient' 
      },
      { 
        type: 'boolean', 
        label: 'Movement', 
        field: 'movement' 
      },
      { 
        type: 'boolean', 
        label: 'Dynamic', 
        field: 'dynamic' 
      },
      { 
        type: 'boolean', 
        label: 'Interactive', 
        field: 'interactive' 
      },
      { 
        type: 'boolean', 
        label: 'Collab', 
        field: 'collab' 
      },
      { 
        type: 'boolean', 
        label: 'OM', 
        field: 'om' 
      },
      { 
        type: 'boolean', 
        label: '3D', 
        field: 'threeD' 
      },
      { 
        type: 'boolean', 
        label: 'Pepe', 
        field: 'pepe' 
      },
      { 
        type: 'boolean', 
        label: 'GM', 
        field: 'gm' 
      },
      { 
        type: 'boolean', 
        label: 'Summer', 
        field: 'summer' 
      },
      { 
        type: 'boolean', 
        label: 'Tulip', 
        field: 'tulip' 
      }
    ]
  },
  {
    title: "Card Special Properties",
    layout: "single",
    fields: [
      { 
        type: 'text', 
        label: 'Bonus', 
        field: 'bonus' 
      },
      { 
        type: 'text', 
        label: 'Boost', 
        field: 'boost' 
      },
      { 
        type: 'dropdown', 
        label: 'Palette', 
        field: 'palette', 
        options: ["Color", "Black and White"]
      },
      { 
        type: 'text', 
        label: 'Style', 
        field: 'style' 
      },
      { 
        type: 'text', 
        label: 'Jewel', 
        field: 'jewel' 
      },
      { 
        type: 'text', 
        label: 'Superpower', 
        field: 'superpower' 
      },
      { 
        type: 'text', 
        label: 'Dharma', 
        field: 'dharma' 
      },
      { 
        type: 'text', 
        label: 'Gear', 
        field: 'gear' 
      },
      { 
        type: 'text', 
        label: 'Clothing', 
        field: 'clothing' 
      },
      { 
        type: 'text', 
        label: 'Element', 
        field: 'element' 
      }
    ]
  },
  {
    title: "Card Additional Details",
    layout: "single",
    fields: [
      { 
        type: 'text', 
        label: 'Mystery', 
        field: 'mystery' 
      },
      { 
        type: 'text', 
        label: 'Secrets', 
        field: 'secrets' 
      },
      { 
        type: 'text', 
        label: 'Weapon', 
        field: 'weapon' 
      },
      { 
        type: 'text', 
        label: 'Home', 
        field: 'home' 
      },
      { 
        type: 'text', 
        label: 'Parent', 
        field: 'parent' 
      },
      { 
        type: 'text', 
        label: 'Sibling', 
        field: 'sibling' 
      },
      { 
        type: 'text', 
        label: 'Food', 
        field: 'food' 
      },
      { 
        type: 'text', 
        label: 'Drink', 
        field: 'drink' 
      }
    ]
  }
];