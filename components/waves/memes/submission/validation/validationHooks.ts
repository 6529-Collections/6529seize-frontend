"use client";

import { publicEnv } from "@/config/env";
import { useCallback, useMemo, useState } from "react";
import type { TraitsData } from "../types/TraitsData";
import { validateTraitsData } from "./traitsValidation";
import type { ValidationOptions, ValidationResult } from "./validationTypes";

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

  // Enhanced helper for focusing the first invalid field with improved browser compatibility
  const focusFirstInvalidField = useCallback(() => {
    if (!validationResult.firstInvalidField) return;

    const field = String(validationResult.firstInvalidField);

    // Try multiple selector strategies in order of preference
    const selectors = [
      // Try by name attribute (common for inputs)
      `[name="${field}"]`,
      // Try by id with field- prefix (our convention)
      `#field-${field.toLowerCase().replace(/\s+/g, "-")}`,
      // Try by data-field attribute (our custom attribute)
      `[data-field="${field}"]`,
      // Try by aria-label that might contain the field name
      `[aria-label*="${field}"]`,
      // Try more generic form elements that might match by various attributes
      `input[id*="${field}"], textarea[id*="${field}"], select[id*="${field}"]`,
      `label[for*="${field}"]`,
      // Try labels that contain the field text (only works in jQuery, but keeping it safe)
      `label:contains("${field}")`,
    ];

    // Try each selector strategy until we find an element
    let fieldElement: HTMLElement | null = null;
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          fieldElement = element;
          break;
        }
      } catch {
        // Some selectors might not be supported in all browsers
        // Just continue to the next strategy
        continue;
      }
    }

    // If we found an element, focus and scroll to it
    if (fieldElement) {
      // Try different focus techniques
      try {
        // Standard focus
        fieldElement.focus();

        // Try smooth scrolling with feature detection and fallbacks
        try {
          // Modern browsers
          fieldElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        } catch {
          // Fallback for older browsers
          fieldElement.scrollIntoView(false);
        }

        // For better visibility, add a temporary highlight class if needed
        fieldElement.classList.add("tw-highlight-focus");
        setTimeout(() => {
          fieldElement?.classList.remove("tw-highlight-focus");
        }, 2000);
      } catch {
        // Last resort: just scroll to the general area
        const rect = fieldElement.getBoundingClientRect();
        window.scrollTo({
          top: rect.top + window.scrollY - 100,
          behavior: "smooth",
        });
      }
    } else if (publicEnv.NODE_ENV === "development") {
      // Only log in development for debugging
      console.warn(`Could not find element to focus for field: ${field}`);
    }
  }, [validationResult.firstInvalidField]);

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
