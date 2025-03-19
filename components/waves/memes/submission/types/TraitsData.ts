// Import the type from MemesArtSubmissionTraits to maintain a single source of truth
import { Traits } from "../../MemesArtSubmissionTraits";

// Re-export the type with a more descriptive name for our component structure
export type TraitsData = Traits & {
  // Add any additional fields needed in our new components that aren't in the original type
  title: string;
  description: string;
};