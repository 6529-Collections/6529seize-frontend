"use client";

import type { TraitsData } from "../submission/types/TraitsData";
import React, { useCallback, useRef } from "react";
import { TraitWrapper } from "./TraitWrapper";

interface DropdownTraitProps {
  readonly label: string;
  readonly field: keyof TraitsData;
  readonly className?: string;
  readonly error?: string | null;
  readonly onBlur?: (field: keyof TraitsData) => void;
  readonly options: readonly string[];
  readonly traits: TraitsData;
  readonly updateText: (field: keyof TraitsData, value: string) => void;
}

/**
 * Simplified DropdownTrait component with direct state management
 */
export const DropdownTrait: React.FC<DropdownTraitProps> = React.memo(
  ({ label, field, traits, updateText, options, className, error, onBlur }) => {
    // Create ref for select element
    const selectRef = useRef<HTMLSelectElement>(null);

    // Update select value when traits change
    React.useEffect(() => {
      const value = (traits[field] as string) || "";
      if (selectRef.current && value !== selectRef.current.value) {
        selectRef.current.value = value;
      }
    }, [traits, field]);

    // Handle change events
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        // For dropdowns, we can update immediately
        updateText(field, newValue);
      },
      [field, updateText]
    );

    // Handle blur events
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLSelectElement>) => {
        // Call parent onBlur if provided
        if (onBlur) {
          onBlur(field);
        }
      },
      [onBlur, field]
    );

    // Check if field is filled (option selected, not empty default)
    const isFieldFilled = React.useMemo(() => {
      const currentValue = (traits[field] as string) || "";
      return currentValue.trim().length > 0;
    }, [traits, field]);

    return (
      <TraitWrapper
        label={label}
        className={className}
        error={error}
        isFieldFilled={isFieldFilled}>
        <select
          ref={selectRef}
          defaultValue={(traits[field] as string) || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`tw-form-select tw-w-full tw-bg-iron-900 tw-border-0 tw-outline-none tw-rounded-lg tw-px-4 tw-py-3.5 
          tw-text-sm tw-text-iron-100 tw-cursor-pointer tw-transition-all tw-duration-500 tw-ease-in-out
          tw-ring-1 ${
            error
              ? "tw-ring-red"
              : "tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-650 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400"
          }
          tw-appearance-none
          [&>option]:tw-bg-iron-950 [&>option]:tw-text-iron-100
          ${isFieldFilled && !error ? "tw-pr-10" : ""}`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: "right 0.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.5em 1.5em",
          }}>
          <option value="" className="tw-bg-iron-950">
            Select {label}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="tw-bg-iron-950">
              {option}
            </option>
          ))}
        </select>
      </TraitWrapper>
    );
  }
);

DropdownTrait.displayName = "DropdownTrait";
