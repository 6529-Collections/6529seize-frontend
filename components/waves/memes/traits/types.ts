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

export interface NumberTraitProps extends BaseTraitProps {
  readonly readOnly?: boolean;
  readonly min: number;
  readonly max: number;
  readonly traits: TraitsData;
  readonly updateNumber: (field: keyof TraitsData, value: number) => void;
}

export interface DropdownTraitProps extends BaseTraitProps {
  readonly options: readonly string[];
  readonly traits: TraitsData;
  readonly updateText: (field: keyof TraitsData, value: string) => void;
}

export interface BooleanTraitProps extends BaseTraitProps {
  readonly traits: TraitsData;
  readonly updateBoolean: (field: keyof TraitsData, value: boolean) => void;
}

export interface SectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export interface TraitWrapperProps {
  readonly label: string;
  readonly readOnly?: boolean;
  readonly children: React.ReactNode;
  readonly isBoolean?: boolean;
  readonly className?: string;
  readonly error?: string | null;
  readonly id?: string;
  readonly isFieldFilled?: boolean;
}
