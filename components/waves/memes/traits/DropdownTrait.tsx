import React, { useCallback, useRef } from "react";
import { DropdownTraitProps } from "./types";
import { TraitWrapper } from "./TraitWrapper";

/**
 * Simplified DropdownTrait component with direct state management
 */
export const DropdownTrait: React.FC<DropdownTraitProps> = React.memo(
  ({
    label,
    field,
    traits,
    updateText,
    options,
    className,
    error,
    onBlur,
  }) => {
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

    return (
      <TraitWrapper label={label} className={className} error={error}>
        <select
          ref={selectRef}
          defaultValue={(traits[field] as string) || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="tw-form-select tw-w-full sm:tw-w-2/3 tw-bg-iron-900 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-rounded-lg tw-px-3 tw-py-3 
          tw-text-sm tw-text-iron-100 tw-cursor-pointer tw-transition-all tw-shadow-inner
          focus:tw-ring-1 focus:tw-ring-primary-400 hover:tw-ring-primary-400"
        >
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
