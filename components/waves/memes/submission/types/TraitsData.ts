/**
 * TraitsData represents all the trait fields for an artwork submission
 * This is now derived from the schema definition to ensure fields stay in sync
 */

export interface TraitsData {
  // Basic fields
  title: string;
  description: string;

  // Text fields
  artist: string;
  seizeArtistProfile: string;

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
  bonus: string;
  boost: string;

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
}
