import { TraitsData } from "../types/TraitsData";
import { BaseFieldDefinition } from "../../traits/schema";

/**
 * Options to configure validation behavior
 */
export interface ValidationOptions {
  /**
   * Validation mode determines which fields to validate
   * - 'all': Validate all fields regardless of interaction
   * - 'touched': Only validate fields the user has interacted with
   * - 'dirty': Only validate fields that have been modified from initial values
   */
  mode?: "all" | "touched" | "dirty";

  /**
   * Set of fields that have been touched by user interaction
   * Used with mode: 'touched'
   */
  touchedFields?: Set<keyof TraitsData>;

  /**
   * Map of initial values to determine dirty state
   * Used with mode: 'dirty'
   */
  initialValues?: Partial<TraitsData>;
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  /**
   * Whether the field is valid
   */
  isValid: boolean;

  /**
   * Error message if invalid, null if valid
   */
  errorMessage: string | null;
}

/**
 * Comprehensive validation result for the entire form
 */
export interface ValidationResult {
  /**
   * Whether the entire form is valid
   */
  isValid: boolean;

  /**
   * Map of field names to their error messages
   * If a field is valid, its value will be null
   */
  errors: Record<keyof TraitsData, string | null>;

  /**
   * Reference to the first invalid field for focusing
   */
  firstInvalidField?: keyof TraitsData;

  /**
   * Count of validation errors
   */
  errorCount: number;
}

/**
 * Field validation context with all necessary information
 * for validating a specific field
 */
export interface FieldValidationContext<
  T extends keyof TraitsData = keyof TraitsData
> {
  /**
   * Field name/key
   */
  field: T;

  /**
   * Current value of the field
   */
  value: TraitsData[T];

  /**
   * Field definition from schema
   */
  fieldDefinition: BaseFieldDefinition;

  /**
   * Complete form data for cross-field validation
   */
  formData: TraitsData;
}
