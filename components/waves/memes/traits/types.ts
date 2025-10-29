import { TraitsData } from "../submission/types/TraitsData";

// Component Props Types
interface BaseTraitProps {
  readonly label: string;
  readonly field: keyof TraitsData;
  readonly className?: string;
  readonly error?: string | null;
  readonly onBlur?: (field: keyof TraitsData) => void;
}

export interface TextTraitProps extends BaseTraitProps {
  readonly readOnly?: boolean;
  readonly placeholder?: string;
  readonly traits: TraitsData;
  readonly updateText: (field: keyof TraitsData, value: string) => void;
}
