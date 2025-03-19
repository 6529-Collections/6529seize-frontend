import { TraitsData } from "../submission/types/TraitsData";

// Component Props Types
export interface BaseTraitProps {
  readonly label: string;
  readonly field: keyof TraitsData;
  readonly className?: string;
}

export interface TextTraitProps extends BaseTraitProps {
  readonly readOnly?: boolean;
  readonly placeholder?: string;
  readonly traits: TraitsData;
  readonly updateText: (field: keyof TraitsData, value: string) => void;
}

export interface NumberTraitProps extends BaseTraitProps {
  readonly readOnly?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly traits: TraitsData;
  readonly updateNumber: (field: keyof TraitsData, value: number) => void;
}

export interface DropdownTraitProps extends BaseTraitProps {
  readonly options: string[];
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
}

export interface TraitWrapperProps {
  readonly label: string;
  readonly readOnly?: boolean;
  readonly children: React.ReactNode;
  readonly isBoolean?: boolean;
  readonly className?: string;
}

// Field Definition Types for Data-Driven Approach
export interface BaseFieldDefinition {
  readonly type: string;
  readonly label: string;
  readonly field: keyof TraitsData;
}

export interface TextFieldDefinition extends BaseFieldDefinition {
  readonly type: 'text';
  readonly readOnly?: boolean;
  readonly placeholder?: string;
}

export interface NumberFieldDefinition extends BaseFieldDefinition {
  readonly type: 'number';
  readonly readOnly?: boolean;
  readonly min?: number;
  readonly max?: number;
}

export interface DropdownFieldDefinition extends BaseFieldDefinition {
  readonly type: 'dropdown';
  readonly options: string[];
}

export interface BooleanFieldDefinition extends BaseFieldDefinition {
  readonly type: 'boolean';
}

export type FieldDefinition = 
  | TextFieldDefinition 
  | NumberFieldDefinition 
  | DropdownFieldDefinition 
  | BooleanFieldDefinition;

export interface SectionDefinition {
  readonly title: string;
  readonly layout: 'single' | 'double';
  readonly fields: readonly FieldDefinition[];
}

export interface TraitFieldProps {
  readonly definition: FieldDefinition;
  readonly traits: TraitsData;
  readonly updateText: (field: keyof TraitsData, value: string) => void;
  readonly updateNumber: (field: keyof TraitsData, value: number) => void;
  readonly updateBoolean: (field: keyof TraitsData, value: boolean) => void;
}