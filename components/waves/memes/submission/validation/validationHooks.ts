"use client";

import { useCallback, useMemo, useState } from "react";
import type { TraitsData } from "../types/TraitsData";
import { validateTraitsData } from "./traitsValidation";
import type { ValidationOptions, ValidationResult } from "./validationTypes";

const FOCUSABLE_FIELD_SELECTOR =
  'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

/**
 * Custom hook for form validation
 *
 * @param traits Current form data
 * @param initialTraits Initial form data (for detecting dirty fields)
 * @returns Validation state and handlers
 */
export function useTraitsValidation(
  traits: TraitsData,
  initialTraits: TraitsData
) {
  // Track which fields have been touched by user interaction
  const [touchedFields, setTouchedFields] = useState<Set<keyof TraitsData>>(
    new Set()
  );

  // Track if a submission has been attempted
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Current validation mode based on submission state
  const validationMode = submitAttempted ? "all" : "touched";

  // Create validation options
  const validationOptions = useMemo<ValidationOptions>(
    () => ({
      mode: validationMode,
      touchedFields,
      initialValues: initialTraits,
    }),
    [validationMode, touchedFields, initialTraits]
  );

  // Validate form data based on current options
  const validationResult = useMemo<ValidationResult>(() => {
    return validateTraitsData(traits, validationOptions);
  }, [traits, validationOptions]);

  // Mark a field as touched when the user interacts with it
  const markFieldTouched = useCallback((field: keyof TraitsData) => {
    setTouchedFields((prev) => {
      const newSet = new Set(prev);
      newSet.add(field);
      return newSet;
    });
  }, []);

  // Mark all fields as touched
  const markAllFieldsTouched = useCallback(() => {
    setTouchedFields(new Set(Object.keys(traits) as Array<keyof TraitsData>));
  }, [traits]);

  // Helper to mark submission attempted and validate all fields
  const validateAll = useCallback(() => {
    setSubmitAttempted(true);
    return validateTraitsData(traits, { mode: "all" });
  }, [traits]);

  // Reset validation state
  const resetValidation = useCallback(() => {
    setTouchedFields(new Set());
    setSubmitAttempted(false);
  }, []);

  const focusFirstInvalidField = useCallback(
    (field = validationResult.firstInvalidField) => {
      if (!field) return;

      const fieldElement = document.getElementById(`field-${String(field)}`);
      if (!(fieldElement instanceof HTMLElement)) return;

      const focusTarget = fieldElement.matches(FOCUSABLE_FIELD_SELECTOR)
        ? fieldElement
        : fieldElement.querySelector<HTMLElement>(FOCUSABLE_FIELD_SELECTOR);

      focusTarget?.focus();
      fieldElement.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
        inline: "nearest",
      });
    },
    [validationResult.firstInvalidField]
  );

  return {
    // Validation state
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    errorCount: validationResult.errorCount,
    touchedFields,
    submitAttempted,

    // Actions
    markFieldTouched,
    markAllFieldsTouched,
    validateAll,
    resetValidation,
    focusFirstInvalidField,

    // Full validation result for advanced usage
    validationResult,
  };
}
